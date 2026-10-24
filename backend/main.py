import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import init_db, fetch_calls, fetch_call_by_id, insert_call, save_stage_record, finalize_call
from stages_data import STAGES_DATA, OUTCOME_DEFINITIONS
from models import CallCreateRequest, StageSaveRequest, CallCloseRequest, LLMAssistRequest
from llm_service import (
    assist_objection_rebuttal,
    assist_need_extraction,
    assist_outcome_advisor,
    assist_whatsapp_draft,
    assist_suggest_stage,
    assist_summarize_call,
    get_active_provider
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coldcall.api")

app = FastAPI(
    title="Cold Call Caller Screen API",
    description="Backend service for Meridian Growth Partners live cold call screen. Runs on Render free tier.",
    version="1.0.0"
)

# Enable CORS for Vercel, localhost, and all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache transcripts index in memory
TRANSCRIPTS_CACHE = []

def load_transcripts_index():
    global TRANSCRIPTS_CACHE
    if TRANSCRIPTS_CACHE:
        return TRANSCRIPTS_CACHE
    candidates = [
        os.path.join(os.path.dirname(__file__), "transcripts", "cold-call-transcripts-100", "index.json"),
        os.path.join(os.path.dirname(__file__), "..", "transcripts", "cold-call-transcripts-100", "index.json"),
        "/app/backend/transcripts/cold-call-transcripts-100/index.json",
        "/app/transcripts/cold-call-transcripts-100/index.json"
    ]
    for t_path in candidates:
        if os.path.exists(t_path):
            try:
                with open(t_path, encoding="utf-8") as f:
                    TRANSCRIPTS_CACHE = json.load(f)
                    logger.info(f"Loaded {len(TRANSCRIPTS_CACHE)} transcripts from {t_path}")
                    break
            except Exception as e:
                logger.warning(f"Error reading index from {t_path}: {e}")
    return TRANSCRIPTS_CACHE

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database...")
    init_db()
    load_transcripts_index()
    logger.info(f"Loaded {len(TRANSCRIPTS_CACHE)} transcripts in index.")

# 1. Health check endpoint (Required by prompt for Render!)
@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check():
    """Render health check endpoint."""
    return {
        "status": "ok",
        "service": "Meridian Cold Call Screen API",
        "version": "1.0.0",
        "uptime": "online",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# 2. Stages configuration endpoint
@app.get("/api/stages", tags=["Cold Call Guide"])
def get_stages():
    """Returns the 8 cold-call stages with quotes, taps, and purpose."""
    return {
        "stages": STAGES_DATA,
        "outcomes": OUTCOME_DEFINITIONS,
        "total_stages": len(STAGES_DATA)
    }

# 3. Calls endpoints
@app.post("/api/calls", tags=["Calls"])
def create_new_call(payload: CallCreateRequest):
    """Starts a new cold call session."""
    try:
        new_call = insert_call(payload.model_dump())
        return new_call
    except Exception as e:
        logger.error(f"Error creating call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calls", tags=["Calls"])
def list_calls(
    stage: Optional[int] = Query(None, description="Filter by stage reached (1-8)"),
    outcome: Optional[str] = Query(None, description="Filter by call outcome"),
    search: Optional[str] = Query(None, description="Search company or prospect name"),
    limit: int = Query(50, description="Max calls to return")
):
    """Second screen: Lists past calls with stage reached and outcome."""
    try:
        calls = fetch_calls(stage=stage, outcome=outcome, search=search, limit=limit)
        return {"calls": calls, "count": len(calls)}
    except Exception as e:
        logger.error(f"Error fetching calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calls/{call_id}", tags=["Calls"])
def get_call_detail(call_id: str):
    """Fetches a single call with all its saved stages and verbatim notes."""
    call = fetch_call_by_id(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call

@app.post("/api/calls/{call_id}/stages", tags=["Calls"])
def save_stage(call_id: str, payload: StageSaveRequest):
    """Saves what happened at a specific stage (tap selection, prospect words, AI suggestion)."""
    try:
        updated = save_stage_record(call_id, payload.model_dump())
        if not updated:
            raise HTTPException(status_code=404, detail="Call not found")
        return updated
    except Exception as e:
        logger.error(f"Error saving stage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calls/{call_id}/close", tags=["Calls"])
def close_call(call_id: str, payload: CallCloseRequest):
    """Finalizes a call, recording the final outcome, duration, and summary."""
    try:
        closed = finalize_call(call_id, payload.model_dump())
        if not closed:
            raise HTTPException(status_code=404, detail="Call not found")
        return closed
    except Exception as e:
        logger.error(f"Error closing call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. LLM Assistant Endpoint
@app.get("/api/llm/provider", tags=["AI Copilot"])
def get_llm_provider():
    """Returns the currently active LLM backend provider."""
    return {
        "active_provider": get_active_provider(),
        "supported_free_tier_keys": ["GEMINI_API_KEY", "CEREBRAS_API_KEY", "MISTRAL_API_KEY"],
        "security_note": "API keys are securely held on the Render backend; never exposed to the client browser."
    }

@app.post("/api/llm/assist", tags=["AI Copilot"])
async def llm_assist(payload: LLMAssistRequest):
    """Provides real-time AI assistance: stage suggestion, objection rebuttals, Stage 5 need analysis, call summarization, and WhatsApp messages."""
    mode = payload.mode
    
    if mode == "suggest_stage":
        res = await assist_suggest_stage(
            typed_text=payload.typed_text or payload.prospect_words or "",
            current_stage=payload.stage_number or 1
        )
        return res

    elif mode == "summarize_call":
        res = await assist_summarize_call(
            call_data=payload.call_data or {
                "prospect_name": payload.prospect_name,
                "company": payload.company,
                "prospect_role": payload.role,
                "stage_reached": payload.stage_number or 8,
                "stage_5_need_verbatim": payload.prospect_words,
                "next_step_details": payload.next_step,
                "stages": payload.stages_data or []
            }
        )
        return res
        
    elif mode == "objection_rebuttal":
        res = await assist_objection_rebuttal(
            stage_number=payload.stage_number or 6,
            stage_name=payload.stage_name or "Objection",
            tap_result=payload.tap_result or "",
            prospect_words=payload.prospect_words or "",
            company=payload.company or "Prospect Company",
            role=payload.role or "Executive"
        )
        return res
        
    elif mode == "need_extraction":
        res = await assist_need_extraction(
            prospect_words=payload.prospect_words or "",
            company=payload.company or "Prospect Company",
            role=payload.role or "Executive"
        )
        return res
        
    elif mode == "outcome_check":
        res = await assist_outcome_advisor(
            stages_data=payload.stages_data or [],
            selected_outcome=payload.selected_outcome or "interested",
            prospect_name=payload.prospect_name or "Prospect",
            company=payload.company or "Prospect Company"
        )
        return res
        
    elif mode == "whatsapp_draft":
        res = await assist_whatsapp_draft(
            prospect_name=payload.prospect_name or "",
            company=payload.company or "",
            next_step=payload.next_step or "",
            need_verbatim=payload.prospect_words or ""
        )
        return res
        
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported LLM mode: {mode}")


# 5. Transcripts Explorer & Simulator Endpoints
@app.get("/api/transcripts", tags=["100 Transcripts"])
def list_transcripts(
    outcome: Optional[str] = None,
    company_kind: Optional[str] = None,
    search: Optional[str] = None
):
    """Lists the 100 historical transcripts for browsing and caller training."""
    items = load_transcripts_index()
    if outcome:
        items = [i for i in items if i.get("outcome") == outcome]
    if company_kind:
        items = [i for i in items if i.get("company_kind") == company_kind]
    if search:
        s = search.lower()
        items = [i for i in items if s in i.get("company", "").lower() or s in i.get("prospect_role", "").lower() or s in i.get("id", "").lower()]
    return {"transcripts": items, "total": len(items)}

@app.get("/api/transcripts/{transcript_id}", tags=["100 Transcripts"])
def get_transcript(transcript_id: str):
    """Returns the full text and parsed turns of a specific transcript."""
    tid = transcript_id.upper()
    candidates = [
        os.path.join(os.path.dirname(__file__), "transcripts", "cold-call-transcripts-100", "transcripts", f"{tid}.txt"),
        os.path.join(os.path.dirname(__file__), "..", "transcripts", "cold-call-transcripts-100", "transcripts", f"{tid}.txt"),
        f"/app/backend/transcripts/cold-call-transcripts-100/transcripts/{tid}.txt",
        f"/app/transcripts/cold-call-transcripts-100/transcripts/{tid}.txt"
    ]
    t_file = None
    for c in candidates:
        if os.path.exists(c):
            t_file = c
            break
    if not t_file:
        raise HTTPException(status_code=404, detail=f"Transcript file {tid}.txt not found")
        
    with open(t_file, encoding="utf-8") as f:
        content = f.read()
        
    lines = content.splitlines()
    header = {}
    dialogue = []
    
    for l in lines:
        if l.startswith("#"):
            header["id"] = l.strip("# ")
        elif ":" in l and not (l.startswith("CALLER:") or l.startswith("PROSPECT:") or l.startswith("RECEPTION:")):
            k, v = l.split(":", 1)
            header[k.strip()] = v.strip()
        elif l.startswith("CALLER:") or l.startswith("PROSPECT:") or l.startswith("RECEPTION:"):
            sp, txt = l.split(":", 1)
            dialogue.append({"speaker": sp.strip(), "text": txt.strip()})
            
    return {
        "header": header,
        "raw_text": content,
        "dialogue": dialogue,
        "turns_count": len(dialogue)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

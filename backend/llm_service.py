import os
import json
import logging
import httpx

logger = logging.getLogger("coldcall.llm")

# Provider API Keys (Read securely on the backend, NEVER exposed to browser)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def get_active_provider() -> str:
    if GEMINI_API_KEY:
        return "Gemini (Google AI Studio - gemini-1.5-flash)"
    if CEREBRAS_API_KEY:
        return "Cerebras Cloud (llama3.1-8b / llama-3.3-70b)"
    if MISTRAL_API_KEY:
        return "Mistral AI (mistral-small-latest)"
    if GROQ_API_KEY:
        return "Groq Cloud (llama-3.3-70b-versatile)"
    return "Heuristic Copilot (Offline / Deterministic Rule-Engine)"

async def generate_llm_response(prompt: str, system_prompt: str = "") -> tuple[str | None, str]:
    """
    Calls Gemini, Cerebras, Mistral, or Groq based on available keys.
    Returns (response_text, provider_name).
    """
    # 1. Google Gemini (Google AI Studio Free Tier)
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 350
                }
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip(), "gemini-1.5-flash"
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}")

    # 2. Cerebras Cloud (Ultra-fast LLaMA 3.1 / 3.3 Free Tier)
    if CEREBRAS_API_KEY:
        try:
            url = "https://api.cerebras.ai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {CEREBRAS_API_KEY}", "Content-Type": "application/json"}
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, headers=headers, json={
                    "model": "llama3.1-8b",
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 350
                })
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"].strip()
                    return text, "cerebras-llama3.1-8b"
        except Exception as e:
            logger.error(f"Cerebras API request failed: {e}")

    # 3. Mistral AI (La Plateforme Free Tier)
    if MISTRAL_API_KEY:
        try:
            url = "https://api.mistral.ai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {MISTRAL_API_KEY}", "Content-Type": "application/json"}
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, headers=headers, json={
                    "model": "mistral-small-latest",
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 350
                })
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"].strip()
                    return text, "mistral-small-latest"
        except Exception as e:
            logger.error(f"Mistral API request failed: {e}")

    # 4. Groq API (Backup)
    if GROQ_API_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, headers=headers, json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 350
                })
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"].strip()
                    return text, "groq-llama3.3-70b"
        except Exception as e:
            logger.error(f"Groq API request failed: {e}")

    return None, "heuristic_offline"


# ==============================================================================
# 1. Feature: Suggest the stage from what the caller just typed
# ==============================================================================
async def assist_suggest_stage(typed_text: str, current_stage: int) -> dict:
    """
    Analyzes what the caller typed (or what the prospect said) and suggests
    which of the 8 cold-call stages the call has transitioned into.
    """
    system_prompt = (
        "You are an AI cold-call coach for Meridian Growth Partners. "
        "The 8 stages of a cold call in order are: "
        "1. Opening (reach person, confirm identity) "
        "2. Purpose (say why you called in 1-2 sentences) "
        "3. Permission (check if willing to talk now, busy, callback time) "
        "4. Their business (ask about operations/plants before pitching) "
        "5. Their need, in their words (prospect shares bottleneck, capacity, goal) "
        "6. Objection (MNC captive unit, already have agency, wrong person, brush-off) "
        "7. Next step (WhatsApp report, callback time, meeting) "
        "8. Close (end clearly and record outcome). "
        "Given the typed words, return a strict JSON object with: "
        "{\"suggested_stage\": <int 1-8>, \"stage_name\": \"<name>\", \"confidence\": <float 0.0-1.0>, \"reason\": \"<1 sentence rationale>\"}."
    )
    user_prompt = f"Caller typed: \"{typed_text}\"\nCurrent stage: {current_stage}\nWhich stage is this conversation now in?"

    llm_text, provider = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        try:
            # Extract JSON from potential markdown fence
            cleaned = llm_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            data["provider"] = provider
            return data
        except Exception:
            pass

    # Heuristic fallback based on 100 transcripts
    text_lower = typed_text.lower()
    if any(k in text_lower for k in ["wrong number", "who is this", "speaking with", "switchboard", "left the company"]):
        return {"suggested_stage": 1, "stage_name": "Opening", "confidence": 0.9, "reason": "Verifying identity or gatekeeper.", "provider": "heuristic"}
    elif any(k in text_lower for k in ["meridian", "growth report", "why you called", "calling regarding"]):
        return {"suggested_stage": 2, "stage_name": "Purpose", "confidence": 0.85, "reason": "Establishing purpose of the call.", "provider": "heuristic"}
    elif any(k in text_lower for k in ["driving", "in a meeting", "busy now", "call after", "call tomorrow", "right time", "sahi time"]):
        return {"suggested_stage": 3, "stage_name": "Permission", "confidence": 0.95, "reason": "Handling time availability or callback window.", "provider": "heuristic"}
    elif any(k in text_lower for k in ["we manufacture", "our plants", "our division", "domestic only", "our clients"]):
        return {"suggested_stage": 4, "stage_name": "Their business", "confidence": 0.85, "reason": "Discussing business scale and operational model.", "provider": "heuristic"}
    elif any(k in text_lower for k in ["capacity", "utilization", "bottleneck", "struggling", "problem", "expansion", "margin", "challenge"]):
        return {"suggested_stage": 5, "stage_name": "Their need, in their words", "confidence": 0.9, "reason": "Prospect describing operational bottleneck or goal.", "provider": "heuristic"}
    elif any(k in text_lower for k in ["captive", "back office", "already have", "agency", "global contract", "not interested", "no requirement"]):
        return {"suggested_stage": 6, "stage_name": "Objection", "confidence": 0.95, "reason": "Prospect raising qualification barrier or incumbent vendor.", "provider": "heuristic"}
    elif any(k in text_lower for k in ["whatsapp", "send the report", "thursday at", "friday at", "meeting", "share your portfolio"]):
        return {"suggested_stage": 7, "stage_name": "Next step", "confidence": 0.9, "reason": "Agreeing on delivery channel or scheduled appointment.", "provider": "heuristic"}
    else:
        return {"suggested_stage": current_stage, "stage_name": f"Stage {current_stage}", "confidence": 0.5, "reason": "Continuing current stage dialogue.", "provider": "heuristic"}


# ==============================================================================
# 2. Feature: Draft the one-line summary and honest outcome of a finished call
# ==============================================================================
async def assist_summarize_call(call_data: dict) -> dict:
    """
    Drafts an accurate 1-line call summary and assesses the honest outcome
    from the prospect's verbatim words.
    """
    prospect = call_data.get("prospect_name", "Prospect")
    company = call_data.get("company", "Company")
    role = call_data.get("prospect_role", "")
    stage_reached = call_data.get("stage_reached", 8)
    words = call_data.get("stage_5_need_verbatim") or ""
    next_step = call_data.get("next_step_details") or ""
    stages = call_data.get("stages", [])
    
    stages_text = "\n".join([f"Stage {s.get('stage_number')}: Tap='{s.get('tap_result')}', Words='{s.get('prospect_words')}'" for s in stages])

    system_prompt = (
        "You are an executive sales auditor for Meridian Growth Partners. "
        "Review the cold call records and provide a JSON object with: "
        "1. 'one_line_summary': Exactly one crisp sentence describing what happened. "
        "2. 'recommended_outcome': One of: agreed_to_receive_report, next_step_agreed, interested, follow_up, call_again, not_interested, do_not_call, wrong_person, moved_company. "
        "3. 'honest_rationale': 1 sentence evaluating whether the prospect showed genuine interest or gave a polite brush-off."
    )
    user_prompt = (
        f"Prospect: {prospect} ({role}) at {company}\n"
        f"Highest stage reached: {stage_reached}\n"
        f"Stage 5 words: {words}\n"
        f"Agreed next step: {next_step}\n"
        f"Stages history:\n{stages_text}"
    )

    llm_text, provider = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        try:
            cleaned = llm_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            data["provider"] = provider
            return data
        except Exception:
            pass

    # Heuristic fallback
    words_lower = (words + " " + next_step).lower()
    if "captive" in words_lower or "back office" in words_lower:
        summary = f"India back-office captive unit with no commercial authority; flagged as do-not-call."
        rec_outcome = "do_not_call"
        rationale = "Local entity has no local consulting budget."
    elif "thursday" in words_lower or "friday" in words_lower or "call after" in words_lower:
        summary = f"Agreed to follow-up call on {next_step or 'named callback time'} to review diagnostic brief."
        rec_outcome = "next_step_agreed"
        rationale = "Prospect committed to a specific time slot."
    elif "whatsapp" in words_lower or "send" in words_lower:
        summary = f"Shared teaser diagnostic on WhatsApp; scheduled follow-up check-in."
        rec_outcome = "agreed_to_receive_report"
        rationale = "Prospect agreed to review material asynchronously."
    elif "not interested" in words_lower:
        summary = f"Prospect declined growth analysis; existing arrangements sufficient."
        rec_outcome = "not_interested"
        rationale = "Clear verbal disinterest."
    else:
        summary = f"Call completed at Stage {stage_reached}; {next_step or 'notes recorded'}."
        rec_outcome = "follow_up" if stage_reached >= 3 else "not_interested"
        rationale = "Outcome aligns with call progress."

    return {
        "one_line_summary": summary,
        "recommended_outcome": rec_outcome,
        "honest_rationale": rationale,
        "provider": "heuristic"
    }


# ==============================================================================
# 3. Feature: Mid-Call Objection Rebuttal / Pivot
# ==============================================================================
async def assist_objection_rebuttal(stage_number: int, stage_name: str, tap_result: str, prospect_words: str, company: str, role: str) -> dict:
    """Provides a calm, non-pushy Indian B2B pivot."""
    system_prompt = (
        "You are an elite B2B cold calling coach for Meridian Growth Partners, a Hyderabad-based advisory firm "
        "reaching C-suite leaders and directors of Indian companies. Provide an immediate, calm, 1-2 sentence spoken pivot. "
        "Do NOT sound pushy or defensive. Acknowledge their situation gracefully."
    )
    user_prompt = (
        f"Stage: {stage_number} ({stage_name})\n"
        f"Prospect: {role} at {company}\n"
        f"What happened (Tap): {tap_result}\n"
        f"Prospect's words: '{prospect_words}'\n\n"
        "Give the caller the single best 1-2 sentence response to speak right now."
    )
    
    llm_text, provider = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"suggestion": llm_text, "source": provider}
        
    words_lower = (prospect_words or "").lower()
    tap_lower = (tap_result or "").lower()
    
    if "captive" in words_lower or "back office" in words_lower or "mnc" in tap_lower:
        sug = "Completely understood, sir. Since strategic initiatives run out of HQ, I won't take your time. Who at the global or regional commercial team typically evaluates supply chain and operational partnerships?"
    elif "already have" in words_lower or "agency" in tap_lower or "consultant" in words_lower:
        sug = "That makes total sense; most companies of your scale have an existing partner. We specifically focus on cross-plant capacity diagnostics that complement internal teams. Would it hurt to review a 2-page benchmark comparison on WhatsApp?"
    elif "send on whatsapp" in words_lower or "mail kar" in words_lower or "whatsapp" in tap_lower:
        sug = "Gladly! I will send our one-page diagnostic summary directly to your WhatsApp. When would be a fair time to reconnect for two minutes once you have glanced at it—would Thursday 3 PM work?"
    elif "driving" in words_lower or "meeting" in words_lower or "busy" in words_lower:
        sug = "Understood, I will let you focus on driving/your meeting. May I ring you back today after 4 PM, or would tomorrow morning suit you better?"
    else:
        sug = "I appreciate you being direct with me. My only goal today was to share our brief sector benchmark for your company. May I share that 2-page brief on WhatsApp for you to glance at when convenient?"
        
    return {"suggestion": sug, "source": "heuristic_coach"}


# ==============================================================================
# 4. Feature: WhatsApp Message Drafter
# ==============================================================================
async def assist_whatsapp_draft(prospect_name: str, company: str, next_step: str, need_verbatim: str) -> dict:
    """Generates ready-to-send WhatsApp message under 40 words."""
    p_name = prospect_name.split()[0] if prospect_name else "Sir"
    
    system_prompt = (
        "Write a concise, high-converting Indian B2B WhatsApp follow-up message from Priya at Meridian Growth Partners. "
        "Keep it strictly under 40 words. Courteous, professional, and clear."
    )
    user_prompt = (
        f"Prospect: {prospect_name} at {company}\n"
        f"Agreed Next Step: {next_step}\n"
        f"Prospect need mentioned: {need_verbatim}\n\n"
        "Draft the WhatsApp message."
    )
    
    llm_text, provider = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"whatsapp_text": llm_text, "source": provider}
        
    msg = (
        f"Hi {p_name} ji, Priya here from Meridian Growth Partners. "
        f"As agreed on our call, sharing our brief growth note for {company}. "
        f"Looking forward to connecting on {next_step or 'Thursday'}! Best regards."
    )
    return {"whatsapp_text": msg, "source": "template"}


# ==============================================================================
# 5. Feature: Stage 5 Need Extraction & Verbatim Probe
# ==============================================================================
async def assist_need_extraction(prospect_words: str, company: str, role: str) -> dict:
    """Extracts operational bottleneck and suggests the next diagnostic question."""
    system_prompt = (
        "You are an expert diagnostic listener for Meridian Growth Partners. "
        "Analyze the prospect's verbatim spoken words from Stage 5 of a cold call. "
        "Extract: 1) Core operational pain/goal, 2) Recommended next probe question. "
        "Keep it concise and practical."
    )
    user_prompt = (
        f"Prospect: {role} at {company}\n"
        f"Verbatim words: '{prospect_words}'\n\n"
        "Return format: Pain Point: [1 sentence] | Next Question: [1 sentence]"
    )
    
    llm_text, provider = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"analysis": llm_text, "source": provider}
        
    words = (prospect_words or "").strip()
    if not words or len(words) < 5:
        return {
            "analysis": "No substantive words recorded yet. Prompt them gently: 'What is taking up most of your operational bandwidth this quarter?'",
            "source": "heuristic_coach"
        }
        
    return {
        "analysis": f"Recorded Focus: '{words[:60]}...' | Next Probe: 'How has that bottleneck impacted your delivery schedules or margins over the last two quarters?'",
        "source": "heuristic_coach"
    }


# ==============================================================================
# 6. Feature: Outcome Advisor / Honesty Bias Detector
# ==============================================================================
async def assist_outcome_advisor(stages_data: list, selected_outcome: str, prospect_name: str, company: str) -> dict:
    """Checks for caller logging mismatches against actual transcript quotes."""
    all_words = " ".join([s.get("prospect_words", "") for s in stages_data if s.get("prospect_words")]).lower()
    
    system_prompt = (
        "You are a sales operations auditor for Meridian Growth Partners. "
        "Check whether the caller's chosen outcome tag truthfully reflects what the prospect said, "
        "or if the caller is suffering from optimistic bias (e.g. logging 'interested' when prospect actually just said 'send WhatsApp to get off the phone')."
    )
    user_prompt = (
        f"Prospect: {prospect_name} at {company}\n"
        f"Logged Outcome: {selected_outcome}\n"
        f"Combined Prospect Spoken Dialogue: '{all_words}'\n\n"
        "Is this outcome tag accurate? If not, suggest the honest tag and 1 sentence reason."
    )
    
    llm_text, provider = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"advice": llm_text, "source": provider}
        
    is_brush_off = any(k in all_words for k in ["bhej do", "whatsapp pe daal do", "send on email", "busy now", "we will see", "dekhte hain"])
    has_hard_no = any(k in all_words for k in ["not interested", "nahi chahiye", "don't call", "no requirement", "captive", "back office"])
    
    if selected_outcome in ["interested", "agreed_to_receive_report"] and has_hard_no:
        return {
            "advice": "Warning: Prospect indicated clear lack of fit or refusal. Recommended outcome is 'not_interested' or 'do_not_call' to keep CRM data clean.",
            "recommended": "not_interested",
            "source": "heuristic_bias_detector"
        }
    elif selected_outcome == "interested" and is_brush_off:
        return {
            "advice": "Caution: 'Send on WhatsApp' without a scheduled callback is usually a polite deflection. Recommended tag: 'follow_up' or 'agreed_to_receive_report' rather than 'interested'.",
            "recommended": "agreed_to_receive_report",
            "source": "heuristic_bias_detector"
        }
    else:
        return {
            "advice": "Outcome tag aligns reasonably well with recorded notes.",
            "recommended": selected_outcome,
            "source": "heuristic_bias_detector"
        }


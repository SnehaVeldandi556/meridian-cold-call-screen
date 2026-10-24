import os
import json
import logging
import httpx

logger = logging.getLogger("coldcall.llm")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

async def generate_llm_response(prompt: str, system_prompt: str = "") -> str:
    """Calls Gemini or Groq or OpenAI depending on available keys."""
    # 1. Try Google Gemini API
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
                    "temperature": 0.3,
                    "maxOutputTokens": 300
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
                            return parts[0].get("text", "").strip()
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}")

    # 2. Try Groq API
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
                    "temperature": 0.3,
                    "max_tokens": 300
                })
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"Groq API request failed: {e}")

    # 3. Fallback: Intelligent heuristic generation
    return None

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
    
    llm_text = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"suggestion": llm_text, "source": "gemini-1.5-flash"}
        
    # Heuristic fallback based on 100 transcripts
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
    elif "wrong person" in words_lower or "left" in words_lower:
        sug = "Thank you for letting me know. Who currently heads plant operations and commercial planning since then?"
    else:
        sug = "I appreciate you being direct with me. My only goal today was to share our brief sector benchmark for your company. May I share that 2-page brief on WhatsApp for you to glance at when convenient?"
        
    return {"suggestion": sug, "source": "heuristic_coach"}

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
    
    llm_text = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"analysis": llm_text, "source": "gemini-1.5-flash"}
        
    # Heuristic fallback
    words = prospect_words.strip()
    if not words or len(words) < 5:
        return {
            "analysis": "No substantive words recorded yet. Prompt them gently: 'What is taking up most of your leadership bandwidth this quarter?'",
            "source": "heuristic_coach"
        }
        
    return {
        "analysis": f"Recorded Focus: '{words[:60]}...' | Next Probe: 'How has that impacted your unit economics or throughput over the last two quarters?'",
        "source": "heuristic_coach"
    }

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
    
    llm_text = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"advice": llm_text, "source": "gemini-1.5-flash"}
        
    # Heuristic bias checker
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

async def assist_whatsapp_draft(prospect_name: str, company: str, next_step: str, need_verbatim: str) -> dict:
    """Generates ready-to-send WhatsApp message."""
    p_name = prospect_name.split()[0] if prospect_name else "Sir"
    
    system_prompt = (
        "Write a concise, high-converting Indian B2B WhatsApp follow-up message from Priya at Meridian Growth Partners. "
        "Keep it under 40 words. Courteous, professional, and clear."
    )
    user_prompt = (
        f"Prospect: {prospect_name} at {company}\n"
        f"Agreed Next Step: {next_step}\n"
        f"Prospect need mentioned: {need_verbatim}\n\n"
        "Draft the WhatsApp message."
    )
    
    llm_text = await generate_llm_response(user_prompt, system_prompt)
    if llm_text:
        return {"whatsapp_text": llm_text, "source": "gemini-1.5-flash"}
        
    # Default high-converting template
    msg = (
        f"Hi {p_name} ji, Priya here from Meridian Growth Partners. "
        f"As agreed on our call, sharing our brief growth note for {company}. "
        f"Looking forward to our follow-up on {next_step or 'Thursday'}. Best regards!"
    )
    return {"whatsapp_text": msg, "source": "template"}

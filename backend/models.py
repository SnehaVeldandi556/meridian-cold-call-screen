from pydantic import BaseModel, Field
from typing import Optional, List, Any

class CallCreateRequest(BaseModel):
    id: Optional[str] = None
    prospect_name: str = Field(..., example="Dev Sharma")
    prospect_role: Optional[str] = Field(None, example="Technical Services Director")
    company: str = Field(..., example="Kalpana Chem Supplies (fictional)")
    company_kind: Optional[str] = Field(None, example="mid-size private company")
    caller_name: Optional[str] = Field("Priya, Meridian Growth Partners", example="Priya, Meridian Growth Partners")
    phone: Optional[str] = Field(None, example="+91 98201 44102")

class StageSaveRequest(BaseModel):
    stage_number: int = Field(..., ge=1, le=8)
    stage_name: str
    tap_result: Optional[str] = None
    prospect_words: Optional[str] = None
    ai_suggestion: Optional[str] = None

class CallCloseRequest(BaseModel):
    outcome: str = Field(..., example="next_step_agreed")
    duration_seconds: int = Field(0, ge=0)
    stage_reached: int = Field(..., ge=1, le=8)
    next_step_details: Optional[str] = None
    stage_5_need_verbatim: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_recommended_outcome: Optional[str] = None
    whatsapp_draft: Optional[str] = None

class LLMAssistRequest(BaseModel):
    mode: str = Field(..., example="objection_rebuttal") # 'objection_rebuttal', 'need_extraction', 'outcome_check', 'whatsapp_draft'
    stage_number: Optional[int] = None
    stage_name: Optional[str] = None
    tap_result: Optional[str] = None
    prospect_words: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    prospect_name: Optional[str] = None
    selected_outcome: Optional[str] = None
    next_step: Optional[str] = None
    stages_data: Optional[List[dict]] = None

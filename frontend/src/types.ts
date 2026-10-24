export interface StageQuote {
  quote: string;
  context: string;
}

export interface StageTap {
  id: string;
  label: string;
  desc: string;
  color: string;
}

export interface StageConfig {
  number: number;
  name: string;
  badge: string;
  tagline: string;
  purpose: string;
  caller_focus: string;
  may_say: StageQuote[];
  taps: StageTap[];
  default_tap: string;
  next_stage_hint: string;
}

export interface OutcomeDefinition {
  value: string;
  label: string;
  desc: string;
}

export interface CallStageRecord {
  id?: string;
  call_id?: string;
  stage_number: number;
  stage_name: string;
  tap_result: string;
  prospect_words: string;
  ai_suggestion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Call {
  id: string;
  prospect_name: string;
  prospect_role: string;
  company: string;
  company_kind: string;
  caller_name: string;
  phone?: string;
  status: 'in_progress' | 'completed' | 'dropped';
  current_stage: number;
  stage_reached: number;
  outcome: string;
  duration_seconds: number;
  stage_5_need_verbatim?: string;
  next_step_details?: string;
  ai_summary?: string;
  ai_recommended_outcome?: string;
  whatsapp_draft?: string;
  created_at: string;
  updated_at?: string;
  stages?: CallStageRecord[];
}

export interface TranscriptSummary {
  id: string;
  duration_seconds: string | number;
  outcome: string;
  prospect_role: string;
  company_kind: string;
  company: string;
  caller: string;
  turns: number;
}

export interface TranscriptDetail {
  header: Record<string, string>;
  raw_text: string;
  dialogue: Array<{ speaker: string; text: string }>;
  turns_count: number;
}

import React, { useState, useEffect } from 'react';
import { Call, OutcomeDefinition, StageConfig } from '../types';
import { requestLLMAssist } from '../api';
import {
  X,
  PhoneOff,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Clock,
  Send
} from 'lucide-react';

interface CloseCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndClose: (closeData: {
    outcome: string;
    duration_seconds: number;
    stage_reached: number;
    next_step_details: string;
    stage_5_need_verbatim: string;
    ai_summary: string;
    ai_recommended_outcome: string;
    whatsapp_draft: string;
  }) => void;
  currentCall: Call;
  currentStageNumber: number;
  allStages: StageConfig[];
  outcomes: OutcomeDefinition[];
  callDuration: number;
  formatDuration: (secs: number) => string;
}

export const CloseCallModal: React.FC<CloseCallModalProps> = ({
  isOpen,
  onClose,
  onSaveAndClose,
  currentCall,
  currentStageNumber,
  allStages,
  outcomes,
  callDuration,
  formatDuration
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<string>(
    currentCall.outcome && currentCall.outcome !== 'not_logged'
      ? currentCall.outcome
      : currentStageNumber >= 7 ? 'next_step_agreed' : 'not_interested'
  );
  const [nextStepDetails, setNextStepDetails] = useState<string>(
    currentCall.next_step_details || ''
  );
  const [stage5Need, setStage5Need] = useState<string>(
    currentCall.stage_5_need_verbatim || ''
  );
  const [aiSummary, setAiSummary] = useState<string>(currentCall.ai_summary || '');
  const [whatsappDraft, setWhatsappDraft] = useState<string>(currentCall.whatsapp_draft || '');
  const [copiedWhatsapp, setCopiedWhatsapp] = useState<boolean>(false);
  const [outcomeAdvice, setOutcomeAdvice] = useState<{ advice?: string; recommended?: string } | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-suggest next step if agreed_to_receive_report or next_step_agreed
      if (!nextStepDetails) {
        if (selectedOutcome === 'agreed_to_receive_report') {
          setNextStepDetails('Send one-page growth report on WhatsApp; follow up in 48 hours.');
        } else if (selectedOutcome === 'next_step_agreed') {
          setNextStepDetails('Follow-up call on Thursday 4:00 PM to discuss diagnostic findings.');
        }
      }
      auditOutcome();
    }
  }, [isOpen, selectedOutcome]);

  const auditOutcome = async () => {
    setIsAuditing(true);
    try {
      const res = await requestLLMAssist({
        mode: 'outcome_check',
        selected_outcome: selectedOutcome,
        prospect_name: currentCall.prospect_name,
        company: currentCall.company,
        stages_data: currentCall.stages || []
      });
      setOutcomeAdvice(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const generateWhatsapp = async () => {
    try {
      const res = await requestLLMAssist({
        mode: 'whatsapp_draft',
        prospect_name: currentCall.prospect_name,
        company: currentCall.company,
        next_step: nextStepDetails,
        prospect_words: stage5Need
      });
      setWhatsappDraft(res.whatsapp_text || '');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDraftSummary = async () => {
    setIsAuditing(true);
    try {
      const res = await requestLLMAssist({
        mode: 'summarize_call',
        prospect_name: currentCall.prospect_name,
        company: currentCall.company,
        role: currentCall.prospect_role,
        stage_number: currentStageNumber,
        prospect_words: stage5Need,
        next_step: nextStepDetails,
        stages_data: currentCall.stages || []
      });
      if (res.one_line_summary) setAiSummary(res.one_line_summary);
      if (res.recommended_outcome) setSelectedOutcome(res.recommended_outcome);
      if (res.honest_rationale) {
        setOutcomeAdvice({
          advice: res.honest_rationale,
          recommended: res.recommended_outcome
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };


  const handleCopyWhatsapp = () => {
    if (!whatsappDraft) return;
    navigator.clipboard.writeText(whatsappDraft);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAndClose({
      outcome: selectedOutcome,
      duration_seconds: callDuration,
      stage_reached: Math.max(currentCall.stage_reached, currentStageNumber),
      next_step_details: nextStepDetails,
      stage_5_need_verbatim: stage5Need,
      ai_summary: aiSummary,
      ai_recommended_outcome: outcomeAdvice?.recommended || selectedOutcome,
      whatsapp_draft: whatsappDraft
    });
  };

  if (!isOpen) return null;

  const stageObj = allStages.find(s => s.number === currentStageNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <PhoneOff className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                Close & Save Call Record
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {currentCall.prospect_name} · {currentCall.company}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Call Stats Summary */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Stage Reached</span>
              <div className="text-sm font-black text-[#0029FF] mt-0.5">
                Stage {currentStageNumber} ({stageObj?.name})
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Duration</span>
              <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                {formatDuration(callDuration)}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Caller</span>
              <div className="text-sm font-black text-slate-900 mt-0.5 truncate">
                {currentCall.caller_name.split(',')[0]}
              </div>
            </div>
          </div>

          {/* Outcome Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Call Outcome (Honest Logging)
            </label>
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
            >
              {outcomes.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} — {o.desc}
                </option>
              ))}
            </select>
          </div>

          {/* AI Outcome Honesty Check Warning */}
          {outcomeAdvice && outcomeAdvice.advice && (
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              outcomeAdvice.recommended && outcomeAdvice.recommended !== selectedOutcome
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                outcomeAdvice.recommended && outcomeAdvice.recommended !== selectedOutcome
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`} />
              <div className="space-y-1">
                <span className="font-bold">AI Call Auditor Insight:</span>
                <p className="leading-relaxed">{outcomeAdvice.advice}</p>
                {outcomeAdvice.recommended && outcomeAdvice.recommended !== selectedOutcome && (
                  <button
                    type="button"
                    onClick={() => setSelectedOutcome(outcomeAdvice.recommended!)}
                    className="text-amber-800 underline font-bold hover:text-amber-950 block mt-1"
                  >
                    Switch to recommended outcome: '{outcomeAdvice.recommended}'
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Next Step Details */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Agreed Next Step (Document, Time, or Referral)
            </label>
            <input
              type="text"
              value={nextStepDetails}
              onChange={(e) => setNextStepDetails(e.target.value)}
              placeholder="e.g. Send teaser report on WhatsApp; call Friday at 3:00 PM"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
            />
          </div>

          {/* Stage 5 Need Verbatim Review */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Prospect's Stage 5 Words (Preserved for Future Calls)
            </label>
            <textarea
              rows={2}
              value={stage5Need}
              onChange={(e) => setStage5Need(e.target.value)}
              placeholder="Prospect's exact words on pain points, goals, capacity..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-[#0029FF] focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* One-Line Call Summary */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                One-Line Call Summary
              </label>
              <button
                type="button"
                onClick={handleDraftSummary}
                disabled={isAuditing}
                className="flex items-center gap-1 text-[11px] font-bold text-[#0029FF] hover:bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors disabled:opacity-40"
              >
                <Sparkles className="w-3 h-3 text-[#0029FF]" />
                <span>{isAuditing ? 'Drafting...' : 'AI Draft 1-Line Summary'}</span>
              </button>
            </div>
            <input
              type="text"
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="e.g. Prospect acknowledged chemical unit overruns; locked Thursday 4 PM callback."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#0029FF] focus:outline-none bg-white"
            />
          </div>

          {/* Instant WhatsApp Dispatch Generator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Follow-up Message</span>
              </span>
              <button
                type="button"
                onClick={generateWhatsapp}
                className="text-[11px] font-bold text-[#0029FF] hover:underline"
              >
                {whatsappDraft ? 'Re-generate' : 'Generate with AI'}
              </button>
            </div>

            {whatsappDraft ? (
              <div className="relative bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono">
                <p className="whitespace-pre-wrap">{whatsappDraft}</p>
                <button
                  type="button"
                  onClick={handleCopyWhatsapp}
                  className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                >
                  {copiedWhatsapp ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy WhatsApp Text</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Generate a 1-click tailored message to send immediately after hanging up.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Resume Call
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#0029FF] hover:bg-blue-700 text-white text-xs font-black px-6 py-2 rounded-lg transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Call to Supabase</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

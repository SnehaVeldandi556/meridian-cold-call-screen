import React, { useState, useEffect } from 'react';
import { StageConfig, Call, CallStageRecord } from '../types';
import { requestLLMAssist } from '../api';
import {
  Sparkles,
  PhoneOff,
  ArrowRight,
  ArrowLeft,
  Quote,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  Building,
  User,
  Phone
} from 'lucide-react';

interface LiveCallerScreenProps {
  currentStage: StageConfig;
  allStages: StageConfig[];
  currentCall: Call;
  stageRecord?: CallStageRecord;
  onSaveStage: (stageNumber: number, tapResult: string, prospectWords: string, aiSuggestion?: string) => void;
  onNextStage: () => void;
  onPrevStage: () => void;
  onEndCallEarly: () => void;
  onSelectStage?: (stageNumber: number) => void;
  formatDuration: (secs: number) => string;
  callDuration: number;
}


export const LiveCallerScreen: React.FC<LiveCallerScreenProps> = ({
  currentStage,
  allStages,
  currentCall,
  stageRecord,
  onSaveStage,
  onNextStage,
  onPrevStage,
  onEndCallEarly,
  onSelectStage,
  formatDuration,
  callDuration
}) => {
  const [selectedTap, setSelectedTap] = useState<string>(
    stageRecord?.tap_result || currentStage.taps[0]?.label || ''
  );
  const [prospectWords, setProspectWords] = useState<string>(
    stageRecord?.prospect_words || ''
  );
  const [aiSuggestion, setAiSuggestion] = useState<string>(
    stageRecord?.ai_suggestion || ''
  );
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [copiedQuoteIndex, setCopiedQuoteIndex] = useState<number | null>(null);
  const [stageSuggestion, setStageSuggestion] = useState<{ suggested_stage: number; stage_name: string; reason: string } | null>(null);
  const [isDetectingStage, setIsDetectingStage] = useState<boolean>(false);

  // Sync state when stage changes
  useEffect(() => {
    setSelectedTap(stageRecord?.tap_result || currentStage.taps[0]?.label || '');
    setProspectWords(stageRecord?.prospect_words || '');
    setAiSuggestion(stageRecord?.ai_suggestion || '');
    setStageSuggestion(null);
  }, [currentStage.number, stageRecord]);


  // Handle tap button selection
  const handleTapSelect = (tapLabel: string) => {
    setSelectedTap(tapLabel);
    onSaveStage(currentStage.number, tapLabel, prospectWords, aiSuggestion);
  };

  // Handle text input changes
  const handleWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setProspectWords(text);
    onSaveStage(currentStage.number, selectedTap, text, aiSuggestion);
  };

  // Copy a quote into prospect words
  const handleCopyQuote = (quoteText: string, idx: number) => {
    const cleaned = quoteText.replace(/^[“"']|[”"']$/g, '').trim();
    setProspectWords(cleaned);
    setCopiedQuoteIndex(idx);
    setTimeout(() => setCopiedQuoteIndex(null), 1500);
    onSaveStage(currentStage.number, selectedTap, cleaned, aiSuggestion);
  };

  // Request AI Assistant Help
  const handleAskAi = async () => {
    setIsAiLoading(true);
    try {
      if (currentStage.number === 5) {
        // Stage 5: Need extraction
        const res = await requestLLMAssist({
          mode: 'need_extraction',
          prospect_words: prospectWords,
          company: currentCall.company,
          role: currentCall.prospect_role
        });
        const sug = res.analysis || res.suggestion || '';
        setAiSuggestion(sug);
        onSaveStage(currentStage.number, selectedTap, prospectWords, sug);
      } else {
        // Stage 6 or others: Objection rebuttal / live pivot
        const res = await requestLLMAssist({
          mode: 'objection_rebuttal',
          stage_number: currentStage.number,
          stage_name: currentStage.name,
          tap_result: selectedTap,
          prospect_words: prospectWords,
          company: currentCall.company,
          role: currentCall.prospect_role
        });
        const sug = res.suggestion || '';
        setAiSuggestion(sug);
        onSaveStage(currentStage.number, selectedTap, prospectWords, sug);
      }
    } catch (err) {
      console.error('AI assist failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Suggest stage from what caller just typed
  const handleDetectStage = async () => {
    if (!prospectWords.trim()) return;
    setIsDetectingStage(true);
    try {
      const res = await requestLLMAssist({
        mode: 'suggest_stage',
        typed_text: prospectWords,
        stage_number: currentStage.number
      });
      if (res && res.suggested_stage && res.suggested_stage !== currentStage.number) {
        setStageSuggestion(res);
      } else {
        setStageSuggestion(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetectingStage(false);
    }
  };

  const nextStageObj = allStages.find(s => s.number === currentStage.number + 1);

  return (

    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Prospect Header Banner (Reference Screen style) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[#0029FF]">
                Live Call · Stage {currentStage.number} of 8
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {currentCall.company_kind || 'Indian Enterprise'}
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-3">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
                {currentCall.prospect_name}
              </h1>
              {currentCall.phone && (
                <span className="text-xs font-mono text-slate-400">
                  {currentCall.phone}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-[#475569] mt-0.5">
              {currentCall.prospect_role ? `${currentCall.prospect_role}, ` : ''}
              <span className="font-bold text-[#0F172A]">{currentCall.company}</span>
              {' · '}
              <span className="text-slate-500">first call</span>
            </p>
          </div>

          {/* Call Timer & Caller Status */}
          <div className="flex items-center gap-4 self-start md:self-center">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                Call Duration
              </div>
              <div className="font-mono text-2xl font-black text-[#0F172A]">
                {formatDuration(callDuration)}
              </div>
            </div>

            <button
              onClick={onEndCallEarly}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              title="Most cold calls terminate before stage 8. End and save outcome anytime."
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stage Header & "What it is for" banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-[#0029FF] font-mono text-sm font-black text-white rounded-lg shadow-sm">
            {currentStage.number}
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#0F172A]">
              {currentStage.name}
            </h2>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#0029FF]">
              {currentStage.tagline}
            </p>
          </div>
        </div>

        {/* What it is for (Prominent 1-line glanceable banner) */}
        <div className="mt-4 bg-[#F8FAFC] border-l-4 border-[#0029FF] p-4 rounded-r-lg">
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#0029FF] mb-1">
            What it is for
          </div>
          <p className="text-sm font-semibold text-[#1E293B] leading-relaxed">
            {currentStage.purpose}
          </p>
          <div className="mt-2 text-xs text-[#64748B] flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span><strong className="text-slate-700">Caller Focus:</strong> {currentStage.caller_focus}</span>
          </div>
        </div>
      </div>

      {/* 3. The Two-Column Workspace (Reference Screen structure) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What prospects tend to say at this point (45% width) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#0029FF]" />
                <h3 className="text-sm font-black uppercase tracking-wide text-[#0F172A]">
                  Prospects Tend to Say
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                100 Transcripts Data
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Real utterances from 100 Indian company calls. Hear them without surprise.
            </p>

            <div className="space-y-3 flex-1">
              {currentStage.may_say.map((quoteObj, idx) => (
                <div
                  key={idx}
                  className="group relative bg-[#F8FAFC] hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-lg p-3 transition-all text-left"
                >
                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {quoteObj.quote}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span className="italic">{quoteObj.context}</span>
                    <button
                      onClick={() => handleCopyQuote(quoteObj.quote, idx)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[#0029FF] hover:underline font-bold transition-opacity"
                      title="Insert as prospect's words"
                    >
                      {copiedQuoteIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Use text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Objection Coach / Live Assistant */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0029FF]" />
                  <span>AI Copilot (Gemini / LLM)</span>
                </span>
                <button
                  onClick={handleAskAi}
                  disabled={isAiLoading}
                  className="text-[11px] font-bold text-[#0029FF] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                >
                  {isAiLoading ? 'Analyzing...' : currentStage.number === 5 ? 'Extract Strategic Need' : 'Get Calm Pivot'}
                </button>
              </div>

              {aiSuggestion ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-950 leading-relaxed animate-in fade-in">
                  <p className="font-semibold text-[#0029FF] mb-1">
                    {currentStage.number === 5 ? 'Strategic Need Breakdown:' : 'Recommended Spoken Pivot:'}
                  </p>
                  <p>{aiSuggestion}</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Tap "Get Calm Pivot" mid-call if the prospect pushes back or raises an unexpected barrier.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Caller Active Workspace (55% width) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Action 1: "What happened" (Four tactile taps) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black uppercase tracking-wide text-[#0F172A]">
                What Happened
              </h3>
              <span className="text-xs text-slate-400">
                1-tap selection (fewer words typed = more heard)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              {currentStage.taps.map((tap) => {
                const isSelected = selectedTap === tap.label;
                return (
                  <button
                    key={tap.id}
                    onClick={() => handleTapSelect(tap.label)}
                    className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#0029FF] bg-blue-50/80 shadow-sm ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black ${
                          isSelected ? 'text-[#0029FF]' : 'text-[#0F172A]'
                        }`}
                      >
                        {tap.label}
                      </span>
                      <span
                        className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#0029FF] bg-[#0029FF]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B] mt-1 leading-snug">
                      {tap.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action 2: Prospect's own words (The one free text box) */}
          <div
            className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
              currentStage.number === 5
                ? 'border-[#0029FF] ring-2 ring-blue-500/10'
                : 'border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0029FF]" />
                <h3 className="text-sm font-black uppercase tracking-wide text-[#0F172A]">
                  {currentStage.number === 5 ? "Their Need · Verbatim Words" : "Prospect's Own Words"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectStage}
                  disabled={isDetectingStage || !prospectWords.trim()}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0029FF] hover:bg-blue-50 px-2.5 py-1 rounded border border-blue-200 transition-colors disabled:opacity-40"
                  title="Use LLM to suggest which stage this belongs to"
                >
                  <Sparkles className="w-3 h-3 text-[#0029FF]" />
                  <span>{isDetectingStage ? 'Detecting Stage...' : 'Detect Stage'}</span>
                </button>
                {currentStage.number === 5 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-[#0029FF] text-white">
                    CRITICAL STAGE
                  </span>
                )}
              </div>
            </div>

            {currentStage.number === 5 ? (
              <p className="text-xs font-semibold text-[#0029FF] mb-2">
                This is the one stage where the caller writes down exactly what was said. Do not paraphrase.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mb-2">
                The only free text on the screen. Type what you heard in their literal words.
              </p>
            )}

            {stageSuggestion && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="font-bold">💡 AI Stage Suggestion:</span>
                  <span>Prospect words indicate <strong>Stage {stageSuggestion.suggested_stage} ({stageSuggestion.stage_name})</strong> — {stageSuggestion.reason}</span>
                </div>
                {onSelectStage && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStage(stageSuggestion.suggested_stage);
                      setStageSuggestion(null);
                    }}
                    className="ml-2 px-3 py-1 bg-[#0029FF] text-white rounded text-[11px] font-bold shrink-0 hover:bg-blue-700 transition-colors"
                  >
                    Switch to Stage {stageSuggestion.suggested_stage}
                  </button>
                )}
              </div>
            )}


            <textarea
              rows={currentStage.number === 5 ? 4 : 3}
              value={prospectWords}
              onChange={handleWordsChange}
              placeholder={
                currentStage.number === 5
                  ? "e.g., 'Capacity utilization in our Bharuch plant is lagging at 65%, struggling to find steady B2B accounts in North India...'"
                  : "Type what the prospect said in their own words..."
              }
              className={`w-full p-3 text-xs sm:text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0029FF] transition-all bg-[#FAFAFA] ${
                currentStage.number === 5 ? 'border-blue-300' : 'border-slate-200'
              }`}
            />

            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>{prospectWords.length} characters captured</span>
              {currentStage.number === 5 && (
                <span className="font-semibold text-slate-600">
                  This verbatim record is preserved for the next call
                </span>
              )}
            </div>
          </div>

          {/* 4. Bottom Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onPrevStage}
              disabled={currentStage.number === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Stage</span>
            </button>

            <div className="flex items-center gap-3">
              {nextStageObj ? (
                <button
                  onClick={onNextStage}
                  className="flex items-center gap-2 bg-[#0029FF] hover:bg-blue-700 text-white text-xs font-black px-6 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <span>Next: {nextStageObj.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onEndCallEarly}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Complete Call & Save</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

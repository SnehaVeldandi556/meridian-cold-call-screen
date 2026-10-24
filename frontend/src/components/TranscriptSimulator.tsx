import React, { useState, useEffect } from 'react';
import { TranscriptSummary, TranscriptDetail, Call } from '../types';
import { fetchTranscripts, fetchTranscriptDetail } from '../api';
import {
  FileText,
  Search,
  Filter,
  Play,
  ArrowRight,
  Clock,
  Building,
  User,
  CheckCircle,
  HelpCircle,
  PhoneForwarded
} from 'lucide-react';

interface TranscriptSimulatorProps {
  onLoadTranscriptIntoCaller: (prospect: Partial<Call>, dialogue?: Array<{ speaker: string; text: string }>) => void;
}

export const TranscriptSimulator: React.FC<TranscriptSimulatorProps> = ({
  onLoadTranscriptIntoCaller
}) => {
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTranscriptId, setActiveTranscriptId] = useState<string>('T001');
  const [transcriptDetail, setTranscriptDetail] = useState<TranscriptDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    loadList();
  }, [selectedOutcome]);

  useEffect(() => {
    if (activeTranscriptId) {
      loadDetail(activeTranscriptId);
    }
  }, [activeTranscriptId]);

  const loadList = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTranscripts({
        outcome: selectedOutcome !== 'all' ? selectedOutcome : undefined,
        search: searchQuery || undefined
      });
      setTranscripts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const data = await fetchTranscriptDetail(id);
      setTranscriptDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handlePracticeClick = () => {
    if (!transcriptDetail) return;
    const header = transcriptDetail.header;
    const callData: Partial<Call> = {
      prospect_name: header.company ? `Executive at ${header.company.replace(' (fictional)', '')}` : 'Prospect Executive',
      prospect_role: header.prospect_role || 'Director',
      company: header.company || 'Indian Enterprise',
      company_kind: header.company_kind || 'mid-size private company',
      caller_name: header.caller || 'Priya, Meridian Growth Partners',
      status: 'in_progress',
      current_stage: 1,
      stage_reached: 1,
      outcome: 'not_logged',
      duration_seconds: 0
    };
    onLoadTranscriptIntoCaller(callData, transcriptDetail.dialogue);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#0029FF]">
                Reading 3 Data · 100 Cold Call Transcripts
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mt-1">
              Transcripts Explorer & Call Simulator
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              100 real cold calls made by Meridian Growth Partners to Indian business owners.
              Select any transcript to analyze what prospects say stage by stage, or load it into the caller screen to practice!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePracticeClick}
              disabled={!transcriptDetail}
              className="flex items-center gap-2 bg-[#0029FF] hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Practice on {activeTranscriptId}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search transcript by company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadList()}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0029FF]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="w-full sm:w-64 p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0029FF]"
          >
            <option value="all">All Outcomes (100 calls)</option>
            <option value="next_step_agreed">next_step_agreed</option>
            <option value="agreed_to_receive_report">agreed_to_receive_report</option>
            <option value="interested">interested</option>
            <option value="follow_up">follow_up</option>
            <option value="not_interested">not_interested</option>
            <option value="do_not_call">do_not_call</option>
            <option value="wrong_person">wrong_person</option>
            <option value="moved_company">moved_company</option>
            <option value="not_logged">not_logged</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout: List on Left, Full Transcript Dialogue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Transcript Cards (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 font-mono">
            <span>TRANSCRIPT ID</span>
            <span>OUTCOME & DURATION</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading transcripts...</div>
            ) : transcripts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No transcripts found.</div>
            ) : (
              transcripts.map((t) => {
                const isActive = t.id === activeTranscriptId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTranscriptId(t.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isActive ? 'bg-blue-50/80 border-l-4 border-l-[#0029FF]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-slate-900">
                        {t.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {t.duration_seconds}s · {t.turns} turns
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                      {t.company}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span className="truncate max-w-[180px]">{t.prospect_role}</span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {t.outcome}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Full Transcript Detail (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col h-[700px]">
          {isLoadingDetail ? (
            <div className="m-auto text-xs text-slate-400 font-mono">
              Loading {activeTranscriptId} dialogue...
            </div>
          ) : !transcriptDetail ? (
            <div className="m-auto text-xs text-slate-400">
              Select a transcript on the left to inspect turns.
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-[#0029FF]">
                      #{transcriptDetail.header.id || activeTranscriptId}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {transcriptDetail.header.duration_seconds}s
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {transcriptDetail.header.company_kind}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#0F172A] mt-1">
                    {transcriptDetail.header.company}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prospect: {transcriptDetail.header.prospect_role} | Caller: {transcriptDetail.header.caller}
                  </p>
                </div>

                <button
                  onClick={handlePracticeClick}
                  className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-[#0029FF] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <PhoneForwarded className="w-3.5 h-3.5" />
                  <span>Practice this call</span>
                </button>
              </div>

              {/* Dialogue Turns */}
              <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3 font-sans text-xs">
                {transcriptDetail.dialogue.map((turn, idx) => {
                  const isCaller = turn.speaker === 'CALLER';
                  const isProspect = turn.speaker === 'PROSPECT';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        isCaller
                          ? 'bg-blue-50/50 border-blue-100 ml-4'
                          : isProspect
                          ? 'bg-slate-50 border-slate-200 mr-4'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span className={isCaller ? 'text-[#0029FF]' : isProspect ? 'text-slate-900' : 'text-amber-800'}>
                          {turn.speaker}
                        </span>
                        <span className="text-slate-400 font-normal">Turn {idx + 1}</span>
                      </div>
                      <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">
                        {turn.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

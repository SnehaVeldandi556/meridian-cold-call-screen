import React, { useState, useEffect } from 'react';
import { Call, OutcomeDefinition, StageConfig } from '../types';
import { fetchCalls } from '../api';
import {
  History,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  CheckCircle,
  Tag
} from 'lucide-react';

interface PastCallsScreenProps {
  stages: StageConfig[];
  outcomes: OutcomeDefinition[];
  onSelectCallForPractice?: (call: Call) => void;
}

export const PastCallsScreen: React.FC<PastCallsScreenProps> = ({
  stages,
  outcomes,
  onSelectCallForPractice
}) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const loadCalls = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCalls({
        stage: stageFilter !== 'all' ? parseInt(stageFilter) : undefined,
        outcome: outcomeFilter !== 'all' ? outcomeFilter : undefined,
        search: searchQuery || undefined
      });
      setCalls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [stageFilter, outcomeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCalls();
  };

  const getStageName = (stageNumber: number) => {
    const s = stages.find(st => st.number === stageNumber);
    return s ? s.name : `Stage ${stageNumber}`;
  };

  const getOutcomeBadge = (outcomeVal: string) => {
    switch (outcomeVal) {
      case 'next_step_agreed':
      case 'agreed_to_receive_report':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'interested':
      case 'follow_up':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'call_again':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'not_interested':
      case 'do_not_call':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'wrong_person':
      case 'moved_company':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Screen Explanation */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#0029FF]">
                Screen 2 of 2 · Call History & Analytics
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight mt-1">
              Past Calls & Stages Reached
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              After a call is saved, it appears here with the stage it reached. A list like this is how a caller sees where their calls end.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
              Total Logged: {calls.length} calls
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
            <input
              type="text"
              placeholder="Search by company or prospect name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0029FF]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <div className="sm:col-span-3">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0029FF]"
            >
              <option value="all">All Stages (1-8)</option>
              {stages.map(s => (
                <option key={s.number} value={s.number.toString()}>
                  Stage {s.number} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0029FF]"
            >
              <option value="all">All Outcomes</option>
              {outcomes.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calls List (Reference Screen Format) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="font-mono text-xs font-bold text-slate-600 uppercase tracking-wider">
            Call Record & Prospect
          </span>
          <div className="flex items-center gap-8 font-mono text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span className="hidden md:inline">Stage Reached</span>
            <span>Outcome & Next Step</span>
            <span>Time</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading call records from database...
          </div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No calls matched the selected filters. Start a new call or clear filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {calls.map((call) => {
              const isExpanded = expandedCallId === call.id;
              const outcomeLabel = outcomes.find(o => o.value === call.outcome)?.label || call.outcome;

              return (
                <div key={call.id} className="transition-colors hover:bg-slate-50/70">
                  <div
                    onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                    className="p-5 flex items-center justify-between cursor-pointer"
                  >
                    {/* Left: Prospect & Company */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#0F172A]">
                          {call.prospect_name}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">,</span>
                        <span className="text-xs font-bold text-slate-700">
                          {call.company}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{call.prospect_role || 'Executive'}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400 text-[11px]">{call.company_kind}</span>
                      </div>

                      {/* Snippet of next step or words */}
                      {call.next_step_details && (
                        <p className="text-xs text-slate-600 font-medium italic mt-1">
                          "{call.next_step_details}"
                        </p>
                      )}
                    </div>

                    {/* Right: Stage Badge, Outcome, Timestamp */}
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      {/* Stage Reached Badge */}
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-black bg-blue-50 text-[#0029FF] border border-blue-200">
                          <span>Stage {call.stage_reached}</span>
                          <span className="text-blue-300">·</span>
                          <span className="font-sans font-bold">{getStageName(call.stage_reached)}</span>
                        </span>
                      </div>

                      {/* Outcome Badge */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getOutcomeBadge(call.outcome)}`}>
                        {outcomeLabel}
                      </span>

                      {/* Timestamp */}
                      <div className="text-right text-xs font-mono text-slate-400">
                        {formatTimestamp(call.created_at)}
                      </div>

                      {/* Expand Chevron */}
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Stage-by-Stage Audit Trail */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <h4 className="font-mono text-[10px] uppercase font-bold text-slate-400">
                            Prospect Need / Stage 5 Verbatim
                          </h4>
                          <div className="bg-white border border-slate-200 p-3 rounded-lg font-mono text-slate-800">
                            {call.stage_5_need_verbatim || 'No verbatim notes recorded at Stage 5.'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-mono text-[10px] uppercase font-bold text-slate-400">
                            Agreed Next Step & AI Summary
                          </h4>
                          <div className="bg-white border border-slate-200 p-3 rounded-lg text-slate-800 space-y-1">
                            <p><strong>Next Step:</strong> {call.next_step_details || 'None'}</p>
                            {call.ai_summary && (
                              <p className="text-slate-600"><strong>AI Summary:</strong> {call.ai_summary}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stage progression cards if available */}
                      {call.stages && call.stages.length > 0 && (
                        <div>
                          <h4 className="font-mono text-[10px] uppercase font-bold text-slate-400 mb-2">
                            Stage Progression Audit Log
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {call.stages.map((stg, i) => (
                              <div key={i} className="bg-white border border-slate-200 rounded p-2.5 text-[11px]">
                                <div className="font-bold text-[#0029FF] flex justify-between">
                                  <span>Stage {stg.stage_number}: {stg.stage_name}</span>
                                </div>
                                <div className="text-slate-700 font-medium mt-1">
                                  Tap: <span className="font-semibold text-slate-900">{stg.tap_result}</span>
                                </div>
                                {stg.prospect_words && (
                                  <div className="text-slate-500 font-mono italic mt-1 truncate">
                                    "{stg.prospect_words}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {call.whatsapp_draft && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs">
                          <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                            <span>WhatsApp Follow-up Dispatched:</span>
                          </div>
                          <p className="font-mono text-emerald-950">{call.whatsapp_draft}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

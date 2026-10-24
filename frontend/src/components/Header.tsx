import React from 'react';
import { Phone, PhoneCall, History, FileText, PlusCircle, Clock, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentTab: 'caller' | 'history' | 'transcripts';
  onTabChange: (tab: 'caller' | 'history' | 'transcripts') => void;
  callDuration: number;
  isCallActive: boolean;
  onNewCallClick: () => void;
  prospectName?: string;
  companyName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  callDuration,
  isCallActive,
  onNewCallClick,
  prospectName,
  companyName
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#0F172A]">
                Deep<span className="text-[#0029FF]">Thought</span>
              </span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-xs tracking-wide text-slate-600 hidden sm:inline">
                Meridian Growth Partners
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => onTabChange('caller')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  currentTab === 'caller'
                    ? 'bg-[#0029FF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Live Caller Screen</span>
                {isCallActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('history')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  currentTab === 'history'
                    ? 'bg-[#0029FF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Past Calls (Screen 2)</span>
              </button>

              <button
                onClick={() => onTabChange('transcripts')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  currentTab === 'transcripts'
                    ? 'bg-[#0029FF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>100 Transcripts</span>
              </button>
            </nav>
          </div>

          {/* Right side: Live Timer & New Call */}
          <div className="flex items-center gap-3">
            {isCallActive ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-[#0029FF] animate-pulse" />
                  <span>{formatTime(callDuration)}</span>
                </div>
                {companyName && (
                  <div className="hidden md:block text-xs text-slate-500 font-medium truncate max-w-[150px]">
                    {companyName}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                <span>Standby</span>
              </div>
            )}

            <button
              onClick={onNewCallClick}
              className="flex items-center gap-1.5 bg-[#0F172A] hover:bg-[#0029FF] text-white text-xs font-bold px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start Call</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Call } from '../types';
import { X, PhoneCall, Sparkles, User, Building, Phone } from 'lucide-react';

interface NewCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (callData: Partial<Call>) => void;
}

const PRESET_CALLS = [
  {
    name: 'Dev Sharma',
    role: 'Technical Services Director',
    company: 'Kalpana Chem Supplies (fictional)',
    kind: 'mid-size private company',
    phone: '+91 98201 44102',
    notes: 'T001: Sent teaser report earlier, following up on chemical processing unit costs.'
  },
  {
    name: 'Leonard Rozario',
    role: 'CEO and CTO',
    company: 'Orbit Automation (fictional)',
    kind: 'startup',
    phone: '+91 99304 88219',
    notes: 'T002: Early-stage startup founder; sensitive to time, expects 30-min callback.'
  },
  {
    name: 'Manpreet Singh',
    role: 'Associate Director',
    company: 'Novara Foods India (fictional)',
    kind: 'India arm of a multinational',
    phone: '+91 98110 33819',
    notes: 'T003: India GCC back-office captive unit. Fast test of qualification barrier.'
  },
  {
    name: 'Dr. Raghuveer Varma',
    role: 'Chief Executive Officer',
    company: 'Cyra Pharma (fictional)',
    kind: 'listed Indian company',
    phone: '+91 94440 18832',
    notes: 'T081: High-intent pharma CEO; works purely with government tender procurement.'
  }
];

export const NewCallModal: React.FC<NewCallModalProps> = ({
  isOpen,
  onClose,
  onStartCall
}) => {
  const [prospectName, setProspectName] = useState('Dev Sharma');
  const [prospectRole, setProspectRole] = useState('Technical Services Director');
  const [company, setCompany] = useState('Kalpana Chem Supplies (fictional)');
  const [companyKind, setCompanyKind] = useState('mid-size private company');
  const [callerName, setCallerName] = useState('Priya, Meridian Growth Partners');
  const [phone, setPhone] = useState('+91 98201 44102');

  if (!isOpen) return null;

  const handleSelectPreset = (p: typeof PRESET_CALLS[0]) => {
    setProspectName(p.name);
    setProspectRole(p.role);
    setCompany(p.company);
    setCompanyKind(p.kind);
    setPhone(p.phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCall({
      prospect_name: prospectName,
      prospect_role: prospectRole,
      company: company,
      company_kind: companyKind,
      caller_name: callerName,
      phone: phone
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#0029FF] text-white">
              <PhoneCall className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Launch Live Cold Call
              </h3>
              <p className="text-xs text-slate-400">
                Setup prospect record to open caller screen
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2">
              Quick Pick from Transcripts
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_CALLS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    company === p.company
                      ? 'border-[#0029FF] bg-blue-50/70 font-semibold'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-900 truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{p.company}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prospect Name
              </label>
              <input
                type="text"
                required
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Designation / Role
              </label>
              <input
                type="text"
                value={prospectRole}
                onChange={(e) => setProspectRole(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Kind
              </label>
              <select
                value={companyKind}
                onChange={(e) => setCompanyKind(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
              >
                <option value="mid-size private company">mid-size private company</option>
                <option value="mid-size private manufacturer">mid-size private manufacturer</option>
                <option value="India arm of a multinational">India arm of a multinational</option>
                <option value="listed Indian company">listed Indian company</option>
                <option value="startup">startup</option>
                <option value="large private company">large private company</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Caller Identity
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#0029FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#0029FF] hover:bg-blue-700 text-white text-xs font-black px-6 py-2 rounded-lg transition-colors shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Open Caller Screen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

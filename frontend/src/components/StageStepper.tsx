import React from 'react';
import { StageConfig } from '../types';
import { Check } from 'lucide-react';

interface StageStepperProps {
  stages: StageConfig[];
  currentStageNumber: number;
  highestStageReached: number;
  onSelectStage: (stageNumber: number) => void;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  stages,
  currentStageNumber,
  highestStageReached,
  onSelectStage,
}) => {
  return (
    <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between overflow-x-auto pb-1 sm:pb-0 scrollbar-none gap-2">
          {stages.map((stage) => {
            const isCurrent = stage.number === currentStageNumber;
            const isCompleted = stage.number < currentStageNumber;
            const isReachable = stage.number <= highestStageReached + 1;

            return (
              <button
                key={stage.number}
                onClick={() => onSelectStage(stage.number)}
                className={`flex-1 min-w-[105px] sm:min-w-0 flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                  isCurrent
                    ? 'border-[#0029FF] bg-blue-50/60 ring-2 ring-blue-500/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30 hover:bg-slate-50'
                    : isReachable
                    ? 'border-slate-200 bg-white hover:bg-slate-50'
                    : 'border-slate-100 bg-slate-50/50 opacity-60'
                }`}
              >
                {/* Stage Number / Icon */}
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-[#0029FF] text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stage.number}
                </span>

                {/* Stage Title */}
                <div className="truncate">
                  <div
                    className={`text-xs font-bold truncate ${
                      isCurrent
                        ? 'text-[#0029FF]'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {stage.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate hidden lg:block">
                    {stage.number === 5 ? 'Verbatim' : `Stage ${stage.number}`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

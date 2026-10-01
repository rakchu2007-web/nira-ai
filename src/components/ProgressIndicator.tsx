import React from 'react';
import { NavigatorStep } from '../types';

interface ProgressIndicatorProps {
  currentStep: NavigatorStep;
  onStepClick?: (step: NavigatorStep) => void;
  highContrast: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  onStepClick,
  highContrast,
}) => {
  const steps: { number: NavigatorStep; titleTa: string; descTa: string }[] = [
    { number: 1, titleTa: 'புரிந்துகொள்', descTa: 'தேவை அறிதல்' },
    { number: 2, titleTa: 'கேள்விகள்', descTa: 'எளிய 1-கேள்வி' },
    { number: 3, titleTa: 'பொருத்தமான திட்டங்கள்', descTa: 'தகுதியானவை' },
    { number: 4, titleTa: 'அடுத்த படி', descTa: 'விண்ணப்ப முறை' },
  ];

  return (
    <div
      role="progressbar"
      aria-label="திட்ட வழிகாட்டி படிநிலை முன்னேற்றம்"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={4}
      className={`border-b transition-colors px-4 py-2.5 ${
        highContrast ? 'bg-zinc-900 border-amber-500 text-white' : 'bg-white/80 border-rose-100 text-slate-800'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((s, idx) => {
          const isActive = currentStep === s.number;
          const isDone = currentStep > s.number;

          return (
            <React.Fragment key={s.number}>
              <button
                type="button"
                onClick={() => onStepClick && onStepClick(s.number)}
                disabled={!onStepClick}
                className={`flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl transition cursor-pointer text-left ${
                  isActive
                    ? highContrast
                      ? 'text-amber-300 font-bold'
                      : 'text-rose-700 font-bold'
                    : isDone
                    ? highContrast
                      ? 'text-emerald-400'
                      : 'text-emerald-700'
                    : highContrast
                    ? 'text-zinc-500'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition flex-shrink-0 ${
                    isActive
                      ? highContrast
                        ? 'bg-amber-400 text-black ring-2 ring-amber-300'
                        : 'bg-rose-600 text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : highContrast
                      ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {isDone ? '✓' : s.number}
                </div>
                <div className="hidden xs:block">
                  <span className="text-xs sm:text-sm block leading-tight font-semibold">
                    {s.titleTa}
                  </span>
                  <span className="text-[10px] hidden sm:block opacity-75">
                    {s.descTa}
                  </span>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 max-w-[28px] sm:max-w-[48px] rounded transition ${
                    isDone
                      ? 'bg-emerald-500'
                      : highContrast
                      ? 'bg-zinc-800'
                      : 'bg-rose-100'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

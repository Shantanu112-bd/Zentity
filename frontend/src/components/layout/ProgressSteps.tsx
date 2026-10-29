/**
 * frontend/src/components/layout/ProgressSteps.tsx
 * 
 * Reusable Multi-Step Flow Indicator
 * - Desktop: horizontal progression with status icons and step numbers
 * - Mobile: compact progress bar with current step name
 * - Accessible: aria-current="step"
 */

import React from "react";
import { Check } from "lucide-react";

export interface StepItem {
  id: string | number;
  label: string;
  description?: string;
}

export interface ProgressStepsProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Stepper (compact) */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-white/50 tracking-wider uppercase">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="font-medium text-white">
            {steps[currentStepIndex]?.label}
          </span>
        </div>
        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-300 ease-out"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop Stepper */}
      <nav aria-label="Progress" className="hidden md:block">
        <ol className="flex items-center justify-between gap-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const canClick = isCompleted && Boolean(onStepClick);

            return (
              <li
                key={step.id}
                className="relative flex-1 flex items-center"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  onClick={() => canClick && onStepClick?.(index)}
                  className={`group flex items-center gap-3 w-full p-2 rounded-xl transition-all ${
                    canClick ? "cursor-pointer hover:bg-white/5" : ""
                  }`}
                >
                  {/* Step Circle / Badge */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all flex-shrink-0 ${
                      isCompleted
                        ? "bg-white text-black"
                        : isCurrent
                        ? "border-2 border-white text-white bg-white/20 shadow-md shadow-white/10"
                        : "border border-white/20 text-white/40 bg-white/5"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : index + 1}
                  </span>

                  {/* Step Label */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs font-medium tracking-tight truncate ${
                        isCurrent
                          ? "text-white"
                          : isCompleted
                          ? "text-white/80"
                          : "text-white/40"
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.description && (
                      <span className="text-[10px] text-white/40 truncate hidden lg:inline">
                        {step.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Connecting Line (except for last step) */}
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block h-px flex-1 mx-2 transition-colors ${
                      index < currentStepIndex ? "bg-white/40" : "bg-white/10"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default ProgressSteps;

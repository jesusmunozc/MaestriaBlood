import { Check } from "lucide-react";
import { Fragment } from "react";

interface Step {
  label: string;
}

interface Props {
  steps: Step[];
  currentStep: number; // 1-based
}

// ─── StepIndicator — SRP: renders only multi-step progress UI ─────────────────
// Layout: [step-flex1] [connector-flex1] [step-flex1] [connector-flex1] [step-flex1]
// Each step is centered in its flex-1 column → circles distribute evenly
export default function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-start w-full mb-6">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isLast = i === steps.length - 1;

        return (
          <Fragment key={i}>
            {/* Step column — flex-1 ensures equal distribution */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${isDone ? "bg-blood-600 text-white" : ""}
                  ${isActive ? "bg-blood-600/20 border-2 border-blood-500 text-blood-500" : ""}
                  ${!isDone && !isActive ? "bg-app-border/10 text-app-text/40" : ""}
                `}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span
                className={`text-[9px] font-medium text-center whitespace-nowrap ${
                  isActive
                    ? "text-blood-500"
                    : isDone
                      ? "text-app-text/60"
                      : "text-app-text/30"
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector — flex-1 fills space between circles; mt-[15px] centers 2px line with 32px circle */}
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mt-[15px] rounded transition-colors ${
                  isDone ? "bg-blood-600" : "bg-app-border/20"
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

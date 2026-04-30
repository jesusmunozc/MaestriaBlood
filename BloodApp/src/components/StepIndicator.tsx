import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface Props {
  steps: Step[];
  currentStep: number; // 1-based
}

// ─── StepIndicator — SRP: renders only multi-step progress UI ─────────────────
export default function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center gap-0 w-full mb-6">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${isDone ? "bg-blood-600 text-app-text" : ""}
                  ${isActive ? "bg-blood-600/20 border-2 border-blood-500 text-blood-400" : ""}
                  ${!isDone && !isActive ? "bg-app-border/10 text-app-text/30" : ""}
                `}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span
                className={`text-[9px] font-medium text-center whitespace-nowrap ${
                  isActive
                    ? "text-blood-400"
                    : isDone
                      ? "text-app-text/50"
                      : "text-app-text/20"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-colors ${
                  stepNum < currentStep ? "bg-blood-600" : "bg-app-border/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

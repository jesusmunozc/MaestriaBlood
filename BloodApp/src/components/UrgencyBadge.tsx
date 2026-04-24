import type { Urgency } from "../types";
import { Zap, Clock, AlertTriangle } from "lucide-react";
import { urgencyLabel } from "../lib/utils";

interface Props {
  urgency: Urgency;
  size?: "sm" | "md";
}

const URGENCY_STYLES: Record<
  Urgency,
  { bg: string; text: string; icon: typeof Zap; pulse: boolean }
> = {
  urgent: {
    bg: "bg-red-600/20 border border-red-500/40",
    text: "text-red-400",
    icon: Zap,
    pulse: true,
  },
  medium: {
    bg: "bg-amber-500/20 border border-amber-500/40",
    text: "text-amber-400",
    icon: AlertTriangle,
    pulse: false,
  },
  low: {
    bg: "bg-emerald-500/20 border border-emerald-500/40",
    text: "text-emerald-400",
    icon: Clock,
    pulse: false,
  },
};

// ─── UrgencyBadge — OCP: urgency logic lives in URGENCY_STYLES, not JSX ───────
export default function UrgencyBadge({ urgency, size = "md" }: Props) {
  const { bg, text, icon: Icon, pulse } = URGENCY_STYLES[urgency];
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full font-semibold
        ${bg} ${text} ${padding}
        ${pulse ? "urgent-pulse" : ""}
      `}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {urgencyLabel(urgency)}
    </span>
  );
}

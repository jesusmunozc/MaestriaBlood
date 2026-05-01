import type { BloodType } from "../types";

interface Props {
  type: BloodType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px] font-bold rounded-lg",
  sm: "w-8 h-8 text-xs font-bold",
  md: "w-12 h-12 text-sm font-bold",
  lg: "w-16 h-16 text-lg font-extrabold",
  xl: "w-24 h-24 text-3xl font-extrabold",
};

// ─── BloodTypeBadge — OCP: new props extend, never modify core rendering ───────
export default function BloodTypeBadge({
  type,
  size = "md",
  glow = false,
  className = "",
}: Props) {
  return (
    <div
      className={`
        ${SIZE_MAP[size]}
        ${size !== "xs" ? "rounded-2xl" : ""}
        bg-gradient-to-br from-blood-600 to-blood-800
        flex items-center justify-center
        text-white
        ${glow ? "blood-badge-glow" : ""}
        select-none
        ${className}
      `}
    >
      {type}
    </div>
  );
}

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

// ─── Card — Reusable card container with hover effect ─────────────────────────
export default function Card({ children, onClick, className = "" }: Props) {
  return (
    <div
      onClick={onClick}
      className={`
        card-hover
        bg-[#1a1a2e]/80
        border border-white/8
        rounded-2xl
        ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

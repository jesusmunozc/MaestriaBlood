import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
  className?: string;
}

// ─── PageHeader — SRP: only handles top nav bar layout ────────────────────────
export default function PageHeader({
  title,
  onBack,
  right,
  transparent = false,
  className = "",
}: Props) {
  const navigate = useNavigate();

  return (
    <header
      className={`
        safe-top
        sticky top-0 z-40
        flex items-center gap-3
        px-4 py-3
        ${transparent ? "bg-transparent" : "bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5"}
        ${className}
      `}
    >
      {(onBack !== undefined || onBack === undefined) && (
        <button
          onClick={onBack ?? (() => navigate(-1))}
          className="p-2 -ml-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {title && (
        <h1 className="flex-1 text-base font-semibold text-white truncate">
          {title}
        </h1>
      )}

      {right && <div className="ml-auto">{right}</div>}
    </header>
  );
}

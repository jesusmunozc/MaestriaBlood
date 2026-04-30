import type { ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
  /** "sheet" slides up from bottom, "center" is centered */
  variant?: "sheet" | "center";
}

// ─── Modal — SRP: only handles overlay/presentation, not content ──────────────
export default function Modal({
  open,
  isOpen,
  onClose,
  children,
  title,
  variant = "center",
}: Props) {
  if (!open && !isOpen) return null;

  return (
    <div
      className="modal-overlay-bg fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className={`
          modal-sheet
          bg-app-card
          border border-app-border/10
          w-full max-w-[430px]
          rounded-t-3xl sm:rounded-3xl
          p-6 modal-sheet-bottom
          relative
          ${variant === "center" ? "sm:mx-4" : ""}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-app-text">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-app-border/10 text-app-text/60 hover:text-app-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

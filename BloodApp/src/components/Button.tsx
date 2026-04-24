import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-blood-600 to-blood-700 hover:from-blood-500 hover:to-blood-600 text-white shadow-md shadow-blood-600/30",
  secondary: "bg-white/10 hover:bg-white/15 text-white border border-white/10",
  outline:
    "border border-blood-600/60 hover:border-blood-500 text-blood-400 hover:text-blood-300",
  danger:
    "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/40",
  ghost: "text-white/60 hover:text-white hover:bg-white/5",
};

const SIZE_STYLES: Record<string, string> = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-5 py-3 text-sm rounded-2xl",
  lg: "px-6 py-4 text-base rounded-2xl",
};

// ─── Button — OCP: new variants added to VARIANT_STYLES without touching JSX ──
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        font-semibold
        flex items-center justify-center gap-2
        transition-all duration-200
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {!loading && children}
      {loading && <span>Cargando...</span>}
    </button>
  );
}

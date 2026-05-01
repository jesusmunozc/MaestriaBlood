import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import type { LucideIcon } from "lucide-react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  charCount?: number;
}

// ─── InputField ────────────────────────────────────────────────────────────────
export function InputField({
  label,
  icon: Icon,
  error,
  hint,
  rightElement,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-app-text/70">{label}</label>
      )}
      <div
        className={`
          flex items-center gap-3
          bg-app-card-alt
          border ${error ? "border-red-500/60" : "border-app-border/10 focus-within:border-blood-500/60"}
          rounded-xl
          px-4 py-3.5
          transition-colors
        `}
      >
        {Icon && <Icon className="w-4 h-4 text-app-text/40 shrink-0" />}
        <input
          {...props}
          className={`flex-1 min-w-0 bg-transparent text-app-text text-sm placeholder-app-text/30 focus:outline-none
            [&::-webkit-calendar-picker-indicator]:opacity-0
            [&::-webkit-calendar-picker-indicator]:absolute
            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-datetime-edit-fields-wrapper]:p-0
            ${className}`}
        />
        {rightElement}
      </div>
      {hint && !error && <span className="text-xs text-app-text/40">{hint}</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────
export function SelectField({
  label,
  icon: Icon,
  error,
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-app-text/70">{label}</label>
      )}
      <div
        className={`
          flex items-center gap-3
          bg-app-card-alt
          border ${error ? "border-red-500/60" : "border-app-border/10 focus-within:border-blood-500/60"}
          rounded-xl
          px-4 py-3.5
          transition-colors
        `}
      >
        {Icon && <Icon className="w-4 h-4 text-app-text/40 shrink-0" />}
        <select
          {...props}
          className={`w-full bg-transparent text-app-text text-sm appearance-none ${className}`}
        >
          {children}
        </select>
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ─── TextareaField ────────────────────────────────────────────────────────────
export function TextareaField({
  label,
  error,
  maxLength,
  charCount,
  className = "",
  ...props
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-app-text/70">{label}</label>
      )}
      <div
        className={`
          bg-app-card-alt
          border ${error ? "border-red-500/60" : "border-app-border/10 focus-within:border-blood-500/60"}
          rounded-xl
          px-4 py-3.5
          transition-colors
        `}
      >
        <textarea
          {...props}
          maxLength={maxLength}
          className={`w-full bg-transparent text-app-text text-sm placeholder-app-text/30 resize-none min-h-[80px] ${className}`}
        />
        {maxLength && charCount !== undefined && (
          <span className="block text-right text-xs text-app-text/30 mt-1">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

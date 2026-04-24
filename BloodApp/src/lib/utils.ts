import type { BloodType } from "../types";
import { BLOOD_COMPATIBILITY } from "../types";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ─── Date utils ────────────────────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    return "";
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return "";
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMM yyyy", { locale: es });
  } catch {
    return "";
  }
}

export function formatTime(timeStr: string): string {
  // timeStr = "08:00:00" → "8:00 AM"
  try {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// ─── Blood compatibility ───────────────────────────────────────────────────────
export function canDonateTo(
  donorType: BloodType,
  recipientType: BloodType,
): boolean {
  return BLOOD_COMPATIBILITY[donorType]?.includes(recipientType) ?? false;
}

export function getCompatibleTypes(donorType: BloodType): BloodType[] {
  return BLOOD_COMPATIBILITY[donorType] ?? [];
}

// ─── Password strength ─────────────────────────────────────────────────────────
export function getPasswordStrength(password: string): {
  score: number; // 0-3
  label: string;
  className: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Muy débil", className: "strength-weak" },
    { label: "Débil", className: "strength-weak" },
    { label: "Media", className: "strength-medium" },
    { label: "Fuerte", className: "strength-strong" },
    { label: "Muy fuerte", className: "strength-strong" },
  ];

  return { score, ...levels[Math.min(score, 4)] };
}

// ─── ID generation ─────────────────────────────────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID();
}

// ─── Aptitude evaluation ───────────────────────────────────────────────────────
export function evaluateAptitude(
  answers: import("../types").AptitudeSurveyAnswers,
): {
  isEligible: boolean;
  message: string;
} {
  const disqualifying =
    !answers.q1_age_range ||
    !answers.q2_weight ||
    answers.q3_recent_donation ||
    answers.q4_infectious ||
    answers.q5_medication ||
    answers.q6_vaccine ||
    answers.q7_risk_behavior ||
    !answers.q8_good_health;

  if (!disqualifying) {
    return {
      isEligible: true,
      message:
        "¡Perfecto! Parece que podrías ser un donante. Cuando veas una solicitud compatible, anímate a ayudar.",
    };
  }

  return {
    isEligible: false,
    message:
      "Gracias por responder. Algunos de tus datos sugieren que por ahora no podrías donar, pero puedes participar de otras formas en la comunidad.",
  };
}

// ─── Urgency label ─────────────────────────────────────────────────────────────
export function urgencyLabel(urgency: string): string {
  const map: Record<string, string> = {
    low: "Baja",
    medium: "Media",
    urgent: "Urgente",
  };
  return map[urgency] ?? urgency;
}

export function urgencyColor(urgency: string): string {
  const map: Record<string, string> = {
    low: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    urgent: "bg-red-600/20 text-red-400 border border-red-500/30",
  };
  return map[urgency] ?? "";
}

export function urgencyDotColor(urgency: string): string {
  const map: Record<string, string> = {
    low: "bg-emerald-400",
    medium: "bg-amber-400",
    urgent: "bg-red-500",
  };
  return map[urgency] ?? "bg-slate-400";
}

// ─── Truncate text ─────────────────────────────────────────────────────────────
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ─── Blood type badge color ────────────────────────────────────────────────────
export function bloodTypeColor(type: BloodType): string {
  return "bg-blood-600 text-white";
}

// ─── Penalty check ────────────────────────────────────────────────────────────
export function isPenalized(penaltyUntil: string | null): boolean {
  if (!penaltyUntil) return false;
  return new Date(penaltyUntil) > new Date();
}

export function penaltyDaysLeft(penaltyUntil: string | null): number {
  if (!penaltyUntil) return 0;
  const diff = new Date(penaltyUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

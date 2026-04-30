import { Droplets } from "lucide-react";

// ─── LoadingScreen — SRP: only full-screen loading overlay ────────────────────
export default function LoadingScreen({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg gap-4">
      <div className="relative">
        <Droplets className="w-16 h-16 text-blood-600 blood-drop-animate" />
      </div>
      <p className="text-app-text/40 text-sm">{message}</p>
    </div>
  );
}

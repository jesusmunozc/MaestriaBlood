import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Droplets, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import Button from "../components/Button";

// ─── Reset Password page ──────────────────────────────────────────────────────
// Supabase redirects here after the user clicks the email link with:
//   #access_token=...&refresh_token=...&type=recovery
// We parse the hash manually because detectSessionInUrl is false (mobile app).
export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // ── Parse recovery token from URL hash on mount ───────────────────────────
  useEffect(() => {
    const raw = window.location.hash
      ? window.location.hash.substring(1)
      : window.location.search.substring(1);

    const params = new URLSearchParams(raw);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type === "recovery" && accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: sessionError }) => {
          if (sessionError) {
            setInitError(
              "El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.",
            );
          } else {
            setSessionReady(true);
            // Remove tokens from the URL bar
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          }
        });
    } else {
      setInitError(
        "Enlace de recuperación inválido. Por favor solicita uno nuevo.",
      );
    }
  }, []);

  // ── Submit new password ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(
        updateError.message === "Auth session missing!"
          ? "Sesión expirada. Solicita un nuevo enlace de recuperación."
          : "No se pudo actualizar la contraseña. Intenta de nuevo.",
      );
      return;
    }

    setDone(true);
    // Sign out so the user logs in fresh with the new password
    await supabase.auth.signOut();
    setTimeout(() => navigate("/login"), 3000);
  }

  // ── Invalid / expired link ─────────────────────────────────────────────────
  if (initError) {
    return (
      <div className="min-h-screen flex flex-col gradient-blood page-enter">
        <div className="flex-1 flex flex-col justify-center items-center px-8 pb-10">
          <div className="w-16 h-16 rounded-full bg-red-600/15 border border-red-500/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-app-text mb-2 text-center">
            Enlace inválido
          </h1>
          <p className="text-app-text/50 text-sm text-center mb-8">
            {initError}
          </p>
          <Button variant="outline" onClick={() => navigate("/forgot-password")}>
            Solicitar nuevo enlace
          </Button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col gradient-blood page-enter">
        <div className="flex-1 flex flex-col justify-center items-center px-8 pb-10">
          <div className="w-16 h-16 rounded-full bg-green-600/15 border border-green-500/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-app-text mb-2 text-center">
            ¡Contraseña actualizada!
          </h1>
          <p className="text-app-text/50 text-sm text-center">
            Tu contraseña fue restablecida con éxito.
            <br />
            Redirigiendo al inicio de sesión…
          </p>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col gradient-blood page-enter">
      <div className="flex-1 flex flex-col justify-center px-8 pb-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full bg-blood-600/15 border border-blood-500/30 flex items-center justify-center mb-4">
            <Droplets className="w-8 h-8 text-blood-400" />
          </div>
          <h1 className="text-2xl font-bold text-app-text">Nueva contraseña</h1>
          <p className="text-app-text/50 text-sm mt-1 text-center">
            Elige una contraseña segura para tu cuenta.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-app-text/60 mb-1 pl-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text/30 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full bg-app-border/10 border border-app-border/30 rounded-xl pl-10 pr-11 py-3.5 text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-blood-500/60 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-text/40 p-1"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-app-text/60 mb-1 pl-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text/30 pointer-events-none" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                className="w-full bg-app-border/10 border border-app-border/30 rounded-xl pl-10 pr-11 py-3.5 text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-blood-500/60 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-text/40 p-1"
                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-600/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            disabled={!sessionReady || !password || !confirm}
            fullWidth
            className="mt-2"
          >
            Actualizar contraseña
          </Button>
        </form>
      </div>
    </div>
  );
}

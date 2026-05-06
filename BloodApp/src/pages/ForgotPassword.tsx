import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Droplets, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { sendPasswordReset } from "../lib/auth";
import { supabase } from "../lib/supabase";
import {
  extractRecoveryPayloadFromLocation,
  establishRecoverySession,
  sanitizeRecoveryUrl,
  type RecoveryPayload,
} from "../lib/auth-recovery";
import { InputField } from "../components/FormFields";
import Button from "../components/Button";

// ─── Forgot Password page ─────────────────────────────────────────────────────
// Maneja dos modos:
//   1. Modo normal — el usuario ingresa su correo para pedir el enlace.
//   2. Modo reset  — llega desde un enlace de Supabase y muestra el formulario
//                    para establecer la nueva contraseña.
//
// Se aceptan callbacks con:
//   • hash access/refresh tokens (implicit)
//   • code PKCE
//   • token_hash / token OTP de recuperación
export default function ForgotPassword() {
  const navigate = useNavigate();

  // ── Modo solicitud ────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Modo reset (token en URL) ─────────────────────────────────────────────
  const [resetMode, setResetMode] = useState(false);
  // sessionStatus: 'loading' → 'ready' | 'error'
  const [sessionStatus, setSessionStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sessionInitError, setSessionInitError] = useState<string | null>(null);
  // Persiste la carga útil del enlace de recuperación entre montajes.
  const recoveryPayloadRef = useRef<RecoveryPayload | null>(null);
  // Evita procesar el enlace dos veces (el token de refresh o code es de un uso)
  const exchangeStartedRef = useRef(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // ── Detectar y procesar el enlace de recuperación ───────────────────────
  // Soporta todos los formatos habituales de Supabase:
  //   1) #access_token=...&refresh_token=...&type=recovery  (implicit)
  //   2) ?code=...&type=recovery                            (PKCE)
  //   3) ?token_hash=...&type=recovery                      (OTP hash)
  //      y ?token=... como alias legado.
  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    const parsed = extractRecoveryPayloadFromLocation();

    if (!recoveryPayloadRef.current && parsed.payload) {
      recoveryPayloadRef.current = parsed.payload;
    }

    const payload = recoveryPayloadRef.current;

    if (parsed.shouldSanitizeUrl) {
      sanitizeRecoveryUrl();
    }

    if (parsed.error) {
      setResetMode(true);
      setSessionInitError(parsed.error);
      setSessionStatus("error");
      return;
    }

    if (!payload) {
      if (parsed.hadRecoveryHint) {
        setResetMode(true);
        setSessionInitError(
          "El enlace no contiene credenciales de recuperación válidas. Solicita uno nuevo. Si persiste, configura la plantilla de Supabase para enviar token_hash a /forgot-password.",
        );
        setSessionStatus("error");
      }
      return;
    }

    const recoveryPayload = payload;

    setResetMode(true);

    // Suscribirse ANTES de intercambiar/validar el token.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled || resolved) return;
        if (
          session &&
          (event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "PASSWORD_RECOVERY")
        ) {
          resolved = true;
          setSessionStatus("ready");
        }
      },
    );

    async function runRecoveryExchange() {
      if (!exchangeStartedRef.current) {
        exchangeStartedRef.current = true;

        const { error: exchangeError } = await establishRecoverySession(recoveryPayload);
        if (cancelled || resolved) return;

        if (exchangeError) {
          resolved = true;
          setSessionInitError(
            "El enlace de recuperación no es válido o ya expiró. Por favor solicita uno nuevo.",
          );
          setSessionStatus("error");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled || resolved) return;

      if (session) {
        resolved = true;
        setSessionStatus("ready");
      }
    }

    void runRecoveryExchange();

    // Fallback: si después de 10 s aún no hay sesión, verificar una última vez
    const timer = setTimeout(async () => {
      if (resolved) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        resolved = true;
        if (session) {
          setSessionStatus("ready");
        } else {
          setSessionInitError(
            "El enlace de recuperación no es válido o ya expiró. Por favor solicita uno nuevo.",
          );
          setSessionStatus("error");
        }
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  // ── Enviar solicitud de reset ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: err } = await sendPasswordReset(trimmed);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setSent(true);
  }

  // ── Guardar nueva contraseña ───────────────────────────────────────────────
  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);

    if (password.length < 8) {
      setResetError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setResetError("Las contraseñas no coinciden.");
      return;
    }

    setResetLoading(true);
    try {
      // Verificar que la sesión de recuperación esté activa
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setResetError("El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        if (
          updateError.message === "Auth session missing!" ||
          updateError.message.toLowerCase().includes("session")
        ) {
          setResetError("El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo.");
        } else {
          setResetError("No se pudo actualizar la contraseña. Intenta de nuevo.");
        }
        return;
      }

      setResetDone(true);
      // Cerrar la sesión de recuperación para que el usuario inicie sesión con la nueva contraseña
      await supabase.auth.signOut({ scope: "local" });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("[handleResetSubmit]", err);
      setResetError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setResetLoading(false);
    }
  }

  // ── Render: modo reset ──────────────────────────────────────────────────────
  if (resetMode) {
    // ── Éxito: contraseña actualizada ────────────────────────────────────
    if (resetDone) {
      return (
        <div className="min-h-screen flex flex-col gradient-blood page-enter">
          <div className="flex-1 flex flex-col justify-center items-center px-8 pb-10">
            <div className="w-20 h-20 rounded-full bg-green-600/15 border border-green-500/30 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
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

    // ── Cargando: esperando que se establezca la sesión de recuperación ──────
    if (sessionStatus === "loading") {
      return (
        <div className="min-h-screen flex flex-col gradient-blood page-enter">
          <div className="flex-1 flex flex-col justify-center items-center px-8 pb-10 gap-4">
            <div className="w-16 h-16 rounded-full bg-blood-600/15 border border-blood-500/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-blood-400 animate-pulse" />
            </div>
            <p className="text-app-text/60 text-sm text-center">
              Verificando enlace de recuperación…
            </p>
          </div>
        </div>
      );
    }

    // ── Error: enlace inválido o expirado ─────────────────────────────────────
    if (sessionStatus === "error") {
      return (
        <div className="min-h-screen flex flex-col gradient-blood page-enter">
          <div className="flex-1 flex flex-col justify-center items-center px-8 pb-10 gap-5">
            <div className="w-16 h-16 rounded-full bg-red-600/15 border border-red-500/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-app-text mb-2">
                Enlace no válido
              </h2>
              <p className="text-app-text/50 text-sm leading-relaxed">
                {sessionInitError}
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setResetMode(false);
                setSessionStatus("loading");
                setSessionInitError(null);
                exchangeStartedRef.current = false;
                recoveryPayloadRef.current = null;
              }}
            >
              Solicitar nuevo enlace
            </Button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-app-text/40 text-sm hover:text-app-text/70 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      );
    }

    // ── Formulario: sesión lista, mostrar campos para nueva contraseña ────────
    return (
      <div className="min-h-screen flex flex-col gradient-blood page-enter">
        <div className="flex-1 flex flex-col justify-center px-8 pb-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-full bg-blood-600/15 border border-blood-500/30 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blood-400" />
            </div>
            <h1 className="text-2xl font-bold text-app-text">
              Nueva contraseña
            </h1>
            <p className="text-app-text/50 text-sm mt-1 text-center">
              Elige una contraseña segura para tu cuenta.
            </p>
          </div>

          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            {/* Nueva contraseña */}
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
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
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
                  aria-label={showConfirm ? "Ocultar" : "Mostrar"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {resetError && (
              <div className="bg-red-600/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm text-center">{resetError}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={resetLoading}
              disabled={!password || !confirm}
              fullWidth
              className="mt-2"
            >
              Actualizar contraseña
            </Button>

            {resetError && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setResetMode(false);
                  setResetError(null);
                  setSessionStatus("loading");
                  setSessionInitError(null);
                  exchangeStartedRef.current = false;
                  recoveryPayloadRef.current = null;
                }}
                fullWidth
              >
                Solicitar nuevo enlace
              </Button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ── Render: formulario solicitar enlace ───────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col gradient-blood page-enter">
      {/* Back button */}
      <div className="safe-top pt-4 px-4">
        <button
          onClick={() => navigate("/login")}
          className="p-2 rounded-full bg-app-border/10 text-app-text/70 active:scale-95 transition-transform"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 pb-10">
        {!sent ? (
          <>
            {/* Header */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-full bg-blood-600/15 border border-blood-500/30 flex items-center justify-center mb-4">
                <Droplets className="w-8 h-8 text-blood-400" />
              </div>
              <h1 className="text-2xl font-bold text-app-text">
                Recuperar contraseña
              </h1>
              <p className="text-app-text/50 text-sm mt-1 text-center">
                Ingresa el correo asociado a tu cuenta y te enviaremos un
                enlace para restablecer tu contraseña.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <InputField
                label="Correo electrónico"
                icon={Mail}
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
              />

              {error && (
                <div className="bg-red-600/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                className="mt-2"
              >
                Enviar enlace
              </Button>
            </form>

            <p className="text-center text-app-text/40 text-sm mt-6">
              ¿Recordaste tu contraseña?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blood-400 font-semibold hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </>
        ) : (
          /* Success state */
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-green-600/15 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-text">
                Revisa tu correo
              </h2>
              <p className="text-app-text/50 text-sm mt-2 leading-relaxed">
                Si existe una cuenta asociada a{" "}
                <span className="text-app-text/80 font-medium">{email}</span>,
                recibirás un enlace para restablecer tu contraseña en breve.
              </p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => navigate("/login")}
              className="mt-4"
            >
              Volver al inicio de sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

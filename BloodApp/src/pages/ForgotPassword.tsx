import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Droplets, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { sendPasswordReset } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { InputField } from "../components/FormFields";
import Button from "../components/Button";

// ─── Forgot Password page ─────────────────────────────────────────────────────
// Maneja dos modos:
//   1. Modo normal   — el usuario ingresa su correo para pedir el enlace.
//   2. Modo reset    — Supabase redirigió aquí con #access_token=...&type=recovery;
//                      se muestra el formulario para establecer la nueva contraseña.
export default function ForgotPassword() {
  const navigate = useNavigate();

  // ── Modo solicitud ────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Modo reset (token en URL) ─────────────────────────────────────────────
  const [resetMode, setResetMode] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const sessionPromiseRef = useRef<Promise<boolean>>(Promise.resolve(false));
  // Evita que React StrictMode ejecute el intercambio de código dos veces
  const exchangeStartedRef = useRef(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // ── Detectar y procesar el enlace de recuperación ───────────────────────
  // detectSessionInUrl está en false, así que el ?code= NO es consumido por
  // Supabase al inicializar — lo intercambiamos aquí manualmente para tener
  // control total. Soporta ambos formatos que Supabase puede enviar:
  //   PKCE (v2 por defecto): ?code=xxx
  //   Implícito (legacy):    #access_token=xxx&refresh_token=xxx&type=recovery
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams  = new URLSearchParams(
      window.location.hash ? window.location.hash.substring(1) : "",
    );

    const code         = queryParams.get("code");
    const accessToken  = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const typeHash     = hashParams.get("type");

    // ── Flujo PKCE: ?code=xxx ──────────────────────────────────────────────
    if (code) {
      // Guardia StrictMode: los refs persisten entre las dos ejecuciones del
      // efecto en desarrollo. Si ya iniciamos el intercambio, no repetirlo.
      if (exchangeStartedRef.current) return;
      exchangeStartedRef.current = true;

      setResetMode(true);
      // Limpiar la URL de inmediato para que la segunda ejecución StrictMode
      // no encuentre el ?code= y no intente intercambiarlo nuevamente.
      window.history.replaceState({}, document.title, window.location.pathname);

      sessionPromiseRef.current = supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error: sessionError }) => {
          if (sessionError) {
            console.warn("[ForgotPassword] exchangeCodeForSession:", sessionError.message);
            return false;
          }
          setSessionReady(true);
          return true;
        })
        .catch((err) => {
          console.warn("[ForgotPassword] exchangeCodeForSession threw:", err);
          return false;
        });
      return;
    }

    // ── Flujo implícito: #access_token=...&type=recovery ──────────────────
    if (typeHash === "recovery" && accessToken && refreshToken) {
      if (exchangeStartedRef.current) return;
      exchangeStartedRef.current = true;

      setResetMode(true);
      window.history.replaceState({}, document.title, window.location.pathname);

      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: sessionError }) => {
          if (sessionError) {
            console.warn("[ForgotPassword] setSession:", sessionError.message);
            // No establecer error aquí — handleResetSubmit lo detectará via getSession()
          } else {
            setSessionReady(true);
          }
        });
    }
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
      // Esperar a que el intercambio PKCE/implícito termine (puede estar en curso)
      await sessionPromiseRef.current;

      // Verificar sesión real desde localStorage — evita falsos negativos por
      // React StrictMode que puede resetear el estado sessionReady.
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
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("[handleResetSubmit]", err);
      setResetError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setResetLoading(false);
    }
  }

  // ── Render: nueva contraseña guardada ─────────────────────────────────────
  if (resetMode && resetDone) {
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

  // ── Render: formulario nueva contraseña ───────────────────────────────────
  if (resetMode) {
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

          {/* El formulario siempre se muestra; los errores se muestran inline */}
          {(
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
                  onClick={() => { setResetMode(false); setResetError(null); }}
                  fullWidth
                >
                  Solicitar nuevo enlace
                </Button>
              )}
            </form>
          )}
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

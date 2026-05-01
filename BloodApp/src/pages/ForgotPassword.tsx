import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Droplets, CheckCircle2 } from "lucide-react";
import { sendPasswordReset } from "../lib/auth";
import { InputField } from "../components/FormFields";
import Button from "../components/Button";

// ─── Forgot Password page ─────────────────────────────────────────────────────
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    // Basic email format validation
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

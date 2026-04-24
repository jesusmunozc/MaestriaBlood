import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Droplets } from "lucide-react";
import { signIn } from "../lib/auth";
import { useApp } from "../contexts/AppContext";
import { InputField } from "../components/FormFields";
import Button from "../components/Button";

// ─── Login page — matches mockup design ───────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);

    const { error: err } = await signIn(username.trim(), password);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    refreshUser();
    navigate("/home", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col gradient-blood page-enter">
      {/* Back */}
      <div className="safe-top pt-4 px-4">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-white/10 text-white/70 active:scale-95 transition-transform"
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
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full bg-blood-600/15 border border-blood-500/30 flex items-center justify-center mb-4">
            <Droplets className="w-8 h-8 text-blood-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="text-white/50 text-sm mt-1">Ingresa a tu cuenta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <InputField
            label="Usuario o correo"
            icon={User}
            type="text"
            placeholder="tu_usuario o email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <InputField
            label="Contraseña"
            icon={Lock}
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-white/40 hover:text-white/70"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />

          <button
            type="button"
            className="text-blood-400 text-xs text-right hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>

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
            Iniciar Sesión
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-6">
          ¿No tienes cuenta?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-blood-400 font-semibold hover:underline"
          >
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Droplets } from "lucide-react";
import Button from "../components/Button";

// ─── Splash Screen — matches mockup exactly ───────────────────────────────────
export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-8 py-16 gradient-blood page-enter">
      {/* Logo section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          {/* Glow rings */}
          <div className="absolute inset-0 rounded-full bg-blood-600/20 blur-2xl scale-150" />
          <div className="relative w-28 h-28 rounded-full bg-blood-600/10 border border-blood-500/30 flex items-center justify-center">
            <Droplets className="w-14 h-14 text-blood-400 blood-drop-animate drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            <span className="text-blood-500">!</span>Blood
          </h1>
          <p className="text-white/60 text-base mt-2 font-medium">
            Dona vida, recibe vida
          </p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="w-full flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate("/login")}
        >
          Iniciar Sesión
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => navigate("/register")}
        >
          Registrarme
        </Button>

        <p className="text-center text-white/30 text-xs mt-2 leading-relaxed">
          Juntos creamos una comunidad
          <br />
          que salva vidas
        </p>
      </div>
    </div>
  );
}

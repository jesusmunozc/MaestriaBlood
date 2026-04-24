import { useNavigate } from "react-router-dom";
import { XCircle, Clock, AlertTriangle } from "lucide-react";
import Button from "../components/Button";

// ─── DonationCancelled ────────────────────────────────────────────────────────
export default function DonationCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-6 page-enter">
      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-red-900/20 border-2 border-red-700/40 flex items-center justify-center">
          <XCircle className="w-14 h-14 text-red-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
      </div>

      <h1 className="text-white text-2xl font-extrabold mb-3 text-center">
        Donación cancelada
      </h1>
      <p className="text-white/50 text-center text-sm leading-relaxed mb-6 max-w-xs">
        Lamentamos que hayas cancelado. Esperamos que en un futuro puedas ser
        parte de nuestra comunidad de donantes.
      </p>

      {/* Penalty card */}
      <div className="w-full max-w-xs bg-amber-900/20 border border-amber-600/30 rounded-2xl p-4 mb-10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-900/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300 font-semibold text-sm mb-1">
              Penalización activa
            </p>
            <p className="text-amber-400/70 text-xs leading-relaxed">
              Tu cuenta ha sido penalizada por{" "}
              <span className="font-semibold text-amber-300">30 días</span>.
              Durante este tiempo no podrás confirmar nuevas donaciones.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate("/explore")}
        >
          Ver otras solicitudes
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => navigate("/home")}
        >
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}

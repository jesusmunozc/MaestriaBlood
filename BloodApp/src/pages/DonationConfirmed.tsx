import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Heart, ArrowRight } from "lucide-react";
import Button from "../components/Button";

// ─── DonationConfirmed ────────────────────────────────────────────────────────
export default function DonationConfirmed() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-6 page-enter">
      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-emerald-900/30 border-2 border-emerald-600/50 flex items-center justify-center animate-[fade-in_0.5s_ease-out]">
          <CheckCircle className="w-14 h-14 text-emerald-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blood-600 flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        {/* rings */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 scale-125 animate-ping" />
      </div>

      <h1 className="text-white text-2xl font-extrabold mb-3 text-center">
        ¡Donación confirmada!
      </h1>
      <p className="text-white/50 text-center text-sm leading-relaxed mb-10 max-w-xs">
        Gracias por tu generosidad. Has confirmado tu intención de donar. El
        solicitante y el personal médico te están esperando.
      </p>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-3 mb-10">
        {[
          "Dirígete al centro médico indicado",
          "Presenta tu documento de identidad",
          "Completa el proceso de donación",
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blood-900/50 border border-blood-700/40 flex items-center justify-center text-blood-400 text-xs font-bold shrink-0">
              {i + 1}
            </div>
            <p className="text-white/60 text-sm">{step}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate(`/request/${id}`)}
        >
          Ver solicitud
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

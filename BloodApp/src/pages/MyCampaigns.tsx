import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, Clock, Users, Calendar, ChevronRight, Megaphone } from "lucide-react";
import PageHeader from "../components/PageHeader";
import BottomNav from "../components/BottomNav";
import Button from "../components/Button";
import { getOrganizerCampaigns } from "../lib/campaigns";
import { useApp } from "../contexts/AppContext";
import type { Campaign } from "../types";
import { formatDate, formatTime } from "../lib/utils";

// ─── Status helpers ────────────────────────────────────────────────────────────
function getStatus(c: Campaign): { label: string; color: string; bg: string } {
  const today = new Date().toISOString().split("T")[0];
  if (c.status === "cancelled")
    return { label: "Cancelada", color: "text-red-400", bg: "bg-red-500/10 border-red-400/20" };
  if (c.registered_slots >= c.total_slots)
    return { label: "Sin cupos", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" };
  if (c.date > today)
    return { label: "Próxima", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" };
  if (c.date === today)
    return { label: "Activa hoy", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-400/20" };
  return { label: "Finalizada", color: "text-app-text/40", bg: "bg-app-border/5 border-app-border/10" };
}

// ─── MyCampaigns ───────────────────────────────────────────────────────────────
export default function MyCampaigns() {
  const navigate = useNavigate();
  const { authUser, profile } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.id) return;
    getOrganizerCampaigns(authUser.id).then(({ data }) => {
      setCampaigns(data);
      setLoading(false);
    });
  }, [authUser?.id]);

  if (profile?.user_type !== "professional") {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-6 text-center">
        <p className="text-app-text/40 text-sm mb-4">
          Solo disponible para profesionales de salud.
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-app-bg pb-20 page-enter">
      <PageHeader
        title="Mis campañas"
        onBack={() => navigate("/home")}
        right={
          <button
            onClick={() => navigate("/create-campaign")}
            className="w-8 h-8 rounded-full bg-blood-600 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-app-border/5 animate-pulse"
              />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-blood-600/10 flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-blood-400/50" />
            </div>
            <p className="text-app-text/60 text-sm font-medium mb-2">
              Aún no has creado campañas
            </p>
            <p className="text-app-text/30 text-xs mb-6 leading-relaxed">
              Publica tu primera campaña para conectar con donantes disponibles.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/create-campaign")}
            >
              Crear primera campaña
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {campaigns.map((c) => {
              const st = getStatus(c);
              const progress = Math.min(100, (c.registered_slots / c.total_slots) * 100);
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/campaign/${c.id}`)}
                  className="bg-app-card border border-app-border/8 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
                >
                  {/* Cabecera con color sólido para contraste en modo claro */}
                  <div className="bg-blood-600 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatDate(c.date)}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 border border-white/20 text-white">
                      {st.label}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-app-text font-bold text-sm leading-snug flex-1">
                        {c.name}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-app-text/25 shrink-0 mt-0.5" />
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-app-text/60 text-xs">
                        <MapPin className="w-3 h-3 shrink-0 text-blood-500" />
                        <span className="truncate">{c.location}</span>
                      </div>
                      {(c.start_time || c.end_time) && (
                        <div className="flex items-center gap-2 text-app-text/60 text-xs">
                          <Clock className="w-3 h-3 shrink-0 text-blood-500" />
                          <span>
                            {c.start_time ? formatTime(c.start_time) : "—"} —{" "}
                            {c.end_time ? formatTime(c.end_time) : "—"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-app-text/60 text-xs">
                        <Users className="w-3 h-3 shrink-0 text-blood-500" />
                        <span>
                          {c.registered_slots}/{c.total_slots} cupos
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="h-1.5 bg-app-border/[0.12] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress >= 100 ? "bg-red-500" : progress > 70 ? "bg-orange-500" : "bg-blood-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}


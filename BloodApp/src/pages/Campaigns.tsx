import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Users, Clock, Megaphone } from "lucide-react";
import BottomNav from "../components/BottomNav";
import PageHeader from "../components/PageHeader";
import BloodTypeBadge from "../components/BloodTypeBadge";
import { getCampaigns } from "../lib/campaigns";
import type { Campaign } from "../types";
import { formatDate, formatTime } from "../lib/utils";

type Chip = "all" | "upcoming";

// ─── Status helper ─────────────────────────────────────────────────────────────
function getStatus(c: Campaign): { label: string; color: string; bg: string } {
  const today = new Date().toISOString().split("T")[0];
  if (c.registered_slots >= c.total_slots)
    return { label: "Sin cupos", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-400/20" };
  if (c.date > today)
    return { label: "Próxima", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-400/20" };
  if (c.date === today)
    return { label: "Activa hoy", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-400/20" };
  return { label: "Finalizada", color: "text-app-text/40", bg: "bg-app-border/5 border-app-border/10" };
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<Chip>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns()
      .then(({ data, error }) => {
        if (error) console.error("[Campaigns] Error:", error);
        setCampaigns(data);
        setFiltered(data);
      })
      .catch((e) => console.error("[Campaigns] Excepción:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let r = [...campaigns];
    if (chip === "upcoming")
      r = r.filter((c) => new Date(c.date) >= new Date());
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q),
      );
    }
    setFiltered(r);
  }, [campaigns, chip, search]);

  const CHIPS: { id: Chip; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "upcoming", label: "Próximas" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-app-bg pb-20 page-enter">
      <PageHeader title="Campañas" />

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-24">
        {/* Buscador */}
        <div className="flex items-center gap-3 bg-app-card-alt border border-app-border/10 rounded-2xl px-4 py-3 mb-4">
          <Search className="w-4 h-4 text-app-text/30 shrink-0" />
          <input
            type="text"
            placeholder="Buscar campaña o ciudad"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-app-text text-sm placeholder-app-text/30 focus:outline-none"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          {CHIPS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setChip(id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                ${chip === id ? "chip-active" : "bg-app-border/8 text-app-text/50 border border-app-border/10"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-app-border/5 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-blood-600/10 flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-blood-400/50" />
            </div>
            <p className="text-app-text/60 text-sm font-medium mb-2">
              No hay campañas disponibles
            </p>
            <p className="text-app-text/30 text-xs leading-relaxed">
              No hay campañas disponibles por ahora. Vuelve a revisar más tarde
              o explora solicitudes de donación activas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onClick={() => navigate(`/campaign/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ─── CampaignCard ─────────────────────────────────────────────────────────────
function CampaignCard({
  campaign: c,
  onClick,
}: {
  campaign: Campaign;
  onClick: () => void;
}) {
  const isFull = c.registered_slots >= c.total_slots;
  const status = getStatus(c);
  const progress = Math.min(100, (c.registered_slots / c.total_slots) * 100);

  return (
    <div
      onClick={onClick}
      className="bg-app-card border border-app-border/[0.12] rounded-2xl overflow-hidden card-hover cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
    >
      {/* Banner fecha — usa blood-600 sólido para contraste en modo claro */}
      <div className="bg-blood-600 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(c.date)}</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-white/15 border-white/20 text-white`}
        >
          {status.label}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-app-text font-bold text-sm mb-2 line-clamp-2 leading-snug">
          {c.name}
        </h3>

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
        </div>

        {/* Tipos de sangre */}
        {c.blood_types_needed && c.blood_types_needed.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {c.blood_types_needed.slice(0, 6).map((t) => (
              <BloodTypeBadge key={t} type={t} size="xs" />
            ))}
            {c.blood_types_needed.length > 6 && (
              <span className="text-[10px] text-app-text/40 self-center">
                +{c.blood_types_needed.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Barra cupos */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-app-text/50 mb-1">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Cupos</span>
            </div>
            <span className="font-semibold text-app-text/70">
              {c.registered_slots}/{c.total_slots}
            </span>
          </div>
          <div className="h-1.5 bg-app-border/[0.12] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? "bg-red-500" : progress > 70 ? "bg-orange-500" : "bg-blood-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


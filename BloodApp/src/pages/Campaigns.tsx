import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Users } from "lucide-react";
import BottomNav from "../components/BottomNav";
import PageHeader from "../components/PageHeader";
import { getCampaigns } from "../lib/campaigns";
import type { Campaign } from "../types";
import { formatDate } from "../lib/utils";

type Chip = "all" | "upcoming" | "registered";

// ─── Campaigns ────────────────────────────────────────────────────────────────
export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<Chip>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns().then(({ data }) => {
      setCampaigns(data);
      setFiltered(data);
      setLoading(false);
    });
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
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] pb-20 page-enter">
      <PageHeader title="Campañas" />

      <div className="flex-1 overflow-y-auto px-5 pt-3">
        {/* Search */}
        <div className="flex items-center gap-3 bg-[#1e1e2e] border border-white/10 rounded-2xl px-4 py-3 mb-4">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Buscar campaña o ciudad"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30"
          />
        </div>

        {/* Chips */}
        <div className="flex gap-2 mb-4">
          {CHIPS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setChip(id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                ${chip === id ? "chip-active" : "bg-white/8 text-white/50 border border-white/10"}`}
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
                className="h-36 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-white/30 text-sm">No hay campañas disponibles</p>
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

function CampaignCard({
  campaign: c,
  onClick,
}: {
  campaign: Campaign;
  onClick: () => void;
}) {
  const isFull = c.registered_slots >= c.total_slots;

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a2e] border border-white/8 rounded-2xl overflow-hidden card-hover cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Date banner */}
      <div className="bg-gradient-to-r from-blood-700/40 to-blood-900/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blood-300 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(c.date)}</span>
        </div>
        {isFull && (
          <span className="text-[10px] font-bold text-red-400 bg-red-900/30 border border-red-700/30 rounded-full px-2 py-0.5">
            LLENO
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">
          {c.name}
        </h3>
        <div className="flex items-center gap-2 text-white/40 text-xs mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{c.location}</span>
        </div>

        {/* Slots bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-white/30 mb-1">
            <span>Cupos</span>
            <span className="text-white/50 font-semibold">
              {c.registered_slots}/{c.total_slots}
            </span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-blood-600 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (c.registered_slots / c.total_slots) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

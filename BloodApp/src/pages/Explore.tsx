import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Zap, AlertTriangle, Clock } from "lucide-react";
import BottomNav from "../components/BottomNav";
import BloodTypeBadge from "../components/BloodTypeBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import PageHeader from "../components/PageHeader";
import Card from "../components/Card";
import { getBloodRequests } from "../lib/blood-requests";
import type { BloodRequest, Urgency } from "../types";
import { timeAgo } from "../lib/utils";

type FilterChip = "all" | "urgent" | "compatible" | "nearby";

// ─── Explore (requests list) — matches mockup ─────────────────────────────────
export default function Explore() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filtered, setFiltered] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<FilterChip>("all");

  useEffect(() => {
    getBloodRequests()
      .then(({ data, error }) => {
        if (error) console.error("[Explore] Error:", error);
        setRequests(data);
        setFiltered(data);
      })
      .catch((e) => console.error("[Explore] Excepción:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...requests];

    if (chip === "urgent")
      result = result.filter((r) => r.urgency === "urgent");
    if (chip === "nearby") result = result.sort(() => Math.random() - 0.5); // placeholder

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.profile?.full_name?.toLowerCase().includes(q) ||
          r.blood_type.toLowerCase().includes(q) ||
          r.health_center.toLowerCase().includes(q),
      );
    }

    setFiltered(result);
  }, [requests, chip, search]);

  const CHIPS: { id: FilterChip; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "urgent", label: "Urgentes" },
    { id: "compatible", label: "Compatible" },
    { id: "nearby", label: "Cercanas" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-app-bg pb-20 page-enter">
      <PageHeader
        title="Solicitudes"
        onBack={() => navigate("/home")}
        right={
          <button className="p-2 rounded-full bg-app-border/8 text-app-text/60 active:scale-95 transition-transform">
            <Filter className="w-4 h-4" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-24">
        {/* Search */}
        <div className="flex items-center gap-3 bg-app-card-alt border border-app-border/10 rounded-2xl px-4 py-3 mb-4">
          <Search className="w-4 h-4 text-app-text/30 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o tipo de sangre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-app-text text-sm placeholder-app-text/30"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {CHIPS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setChip(id)}
              className={`
                shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                ${chip === id ? "chip-active" : "bg-app-border/8 text-app-text/50 border border-app-border/10"}
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Requests list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-app-border/5 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-app-text/20" />
            </div>
            <p className="text-app-text/30 text-sm">
              No se encontraron solicitudes
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onClick={() => navigate(`/request/${req.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ─── RequestCard sub-component ────────────────────────────────────────────────
function RequestCard({
  request: req,
  onClick,
}: {
  request: BloodRequest;
  onClick: () => void;
}) {
  const borderColor =
    req.urgency === "urgent"
      ? "border-red-600/40"
      : req.urgency === "medium"
        ? "border-amber-500/30"
        : "border-emerald-500/20";

  return (
    <div
      onClick={onClick}
      className={`bg-app-card border ${borderColor} rounded-2xl p-4 card-hover cursor-pointer active:scale-[0.98] transition-transform`}
    >
      <div className="flex items-start justify-between mb-3">
        <UrgencyBadge urgency={req.urgency} size="sm" />
        <span className="text-app-text/30 text-[10px]">
          {timeAgo(req.created_at)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-app-border/10 flex items-center justify-center text-app-text/60 font-semibold text-sm shrink-0">
          {req.profile?.full_name?.charAt(0) ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-app-text font-semibold text-sm">
            {req.profile?.full_name ?? "Usuario"}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-app-text/40 text-xs">
              Necesita:{" "}
              <span className="text-blood-400 font-semibold">
                {req.blood_type}
              </span>
            </span>
            <span className="text-app-text/40 text-xs">
              {req.units_needed}{" "}
              {req.units_needed === 1 ? "unidad" : "unidades"}
            </span>
          </div>
          <p className="text-app-text/30 text-xs mt-1 truncate">
            🏥 {req.health_center}
          </p>
        </div>
        <BloodTypeBadge type={req.blood_type} size="sm" />
      </div>

      {req.message && (
        <p className="text-app-text/30 text-xs mt-2 italic truncate">
          "{req.message}"
        </p>
      )}
    </div>
  );
}

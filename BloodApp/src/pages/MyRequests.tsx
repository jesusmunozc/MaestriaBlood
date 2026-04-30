import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import BottomNav from "../components/BottomNav";
import BloodTypeBadge from "../components/BloodTypeBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { getUserRequests, cancelBloodRequest } from "../lib/blood-requests";
import { useApp } from "../contexts/AppContext";
import type { BloodRequest } from "../types";
import { timeAgo } from "../lib/utils";

type Tab = "active" | "completed" | "cancelled";

// ─── MyRequests ────────────────────────────────────────────────────────────────
export default function MyRequests() {
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [tab, setTab] = useState<Tab>("active");
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    getUserRequests(authUser.id)
      .then(({ data, error }) => {
        if (error) console.error("[MyRequests] Error:", error);
        setRequests(data);
      })
      .catch((e) => console.error("[MyRequests] Excepción:", e))
      .finally(() => setLoading(false));
  }, [authUser?.id]);

  const filterMap: Record<Tab, string[]> = {
    active: ["open"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  };

  const visible = requests.filter((r) => filterMap[tab].includes(r.status));

  async function doCancelRequest() {
    if (!cancelId) return;
    setCancelling(true);
    await cancelBloodRequest(cancelId);
    setRequests((prev) =>
      prev.map((r) => (r.id === cancelId ? { ...r, status: "cancelled" } : r)),
    );
    setCancelling(false);
    setCancelId(null);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "active", label: "Activas" },
    { id: "completed", label: "Completadas" },
    { id: "cancelled", label: "Canceladas" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-app-bg pb-20 page-enter">
      <PageHeader
        title="Mis solicitudes"
        onBack={() => navigate("/home")}
        right={
          <button
            onClick={() => navigate("/create-request")}
            className="w-8 h-8 rounded-full bg-blood-600 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4 text-app-text" />
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-0 mx-5 mt-3 bg-app-border/5 rounded-xl p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${tab === id ? "bg-blood-600 text-app-text" : "text-app-text/40"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-app-border/5 animate-pulse"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-app-text/30 text-sm mb-4">
              No tienes solicitudes {tab === "active" ? "activas" : tab}
            </p>
            {tab === "active" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/create-request")}
              >
                Crear solicitud
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((req) => (
              <RequestItem
                key={req.id}
                request={req}
                onClick={() => navigate(`/request/${req.id}`)}
                onCancel={
                  tab === "active" ? () => setCancelId(req.id) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <Modal
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        variant="center"
      >
        <div className="text-center px-2">
          <h3 className="text-white font-bold text-lg mb-2">
            ¿Cancelar solicitud?
          </h3>
          <p className="text-app-text/50 text-sm mb-5">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setCancelId(null)}
            >
              No
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              loading={cancelling}
              onClick={doCancelRequest}
            >
              Sí, cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RequestItem({
  request: req,
  onClick,
  onCancel,
}: {
  request: BloodRequest;
  onClick: () => void;
  onCancel?: () => void;
}) {
  const progress =
    req.donors_needed > 0
      ? Math.min(100, ((req.donors_accepted ?? 0) / req.donors_needed) * 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className="bg-app-card border border-app-border/8 rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <BloodTypeBadge type={req.blood_type} size="sm" />
          <UrgencyBadge urgency={req.urgency} size="sm" />
        </div>
        <span className="text-app-text/30 text-[10px]">
          {timeAgo(req.created_at)}
        </span>
      </div>
      <p className="text-app-text/50 text-xs mb-2">🏥 {req.health_center}</p>

      {req.status === "open" && (
        <div>
          <div className="flex items-center justify-between text-[10px] text-app-text/30 mb-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> Donantes
            </span>
            <span>
              {req.donors_accepted ?? 0}/{req.donors_needed}
            </span>
          </div>
          <div className="h-1.5 bg-app-border/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-blood-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {onCancel && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="text-red-400 text-xs font-semibold active:scale-95 transition-transform"
          >
            Cancelar solicitud
          </button>
        </div>
      )}
    </div>
  );
}

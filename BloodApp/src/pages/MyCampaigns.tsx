import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import BottomNav from "../components/BottomNav";
import Button from "../components/Button";
import { getOrganizerCampaigns } from "../lib/campaigns";
import { useApp } from "../contexts/AppContext";
import type { Campaign } from "../types";
import { formatDate } from "../lib/utils";

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
            <Plus className="w-4 h-4 text-app-text" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-app-border/5 animate-pulse"
              />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-app-text/30 text-sm mb-4">
              Aún no has creado campañas
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
            {campaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/campaign/${c.id}`)}
                className="bg-app-card border border-app-border/8 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {c.name}
                  </p>
                  <p className="text-app-text/40 text-xs mt-0.5">
                    {formatDate(c.date)} · {c.registered_slots}/{c.total_slots}{" "}
                    cupos
                  </p>
                  <div className="h-1 bg-app-border/8 rounded-full mt-2">
                    <div
                      className="h-full bg-blood-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (c.registered_slots / c.total_slots) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-app-text/20 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

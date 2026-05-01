import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, User } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { getCampaignParticipants } from "../lib/campaigns";
import { formatDate } from "../lib/utils";

export default function CampaignParticipants() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<
    Array<{
      id: string;
      full_name: string;
      avatar_url: string | null;
      registered_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCampaignParticipants(id).then(({ data }) => {
      setParticipants(data);
      setLoading(false);
    });
  }, [id]);

  return (
    <div className="min-h-screen bg-app-bg page-enter">
      <PageHeader
        title="Participantes"
        onBack={() => navigate(`/campaign/${id}`)}
      />

      <div className="mx-5 mt-4 space-y-3 pb-8">
        {/* Contador */}
        <div className="flex items-center gap-2 px-1 mb-2">
          <Users className="w-4 h-4 text-blood-500" />
          <span className="text-sm font-semibold text-app-text/70">
            {loading ? "Cargando..." : `${participants.length} participante${participants.length !== 1 ? "s" : ""} registrado${participants.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-app-border/5 animate-pulse"
              />
            ))}
          </div>
        ) : participants.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-blood-600/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blood-400/50" />
            </div>
            <p className="text-app-text/60 text-sm font-medium mb-1">
              Sin participantes aún
            </p>
            <p className="text-app-text/30 text-xs leading-relaxed">
              Nadie se ha registrado en esta campaña todavía.
            </p>
          </div>
        ) : (
          participants.map((p, i) => (
            <div
              key={p.id}
              className="bg-app-card border border-app-border/[0.12] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
            >
              {/* Avatar o inicial */}
              <div className="w-10 h-10 rounded-full bg-blood-600 flex items-center justify-center shrink-0 overflow-hidden">
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={p.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {p.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Nombre y fecha */}
              <div className="flex-1 min-w-0">
                <p className="text-app-text font-semibold text-sm truncate">
                  {p.full_name}
                </p>
                <p className="text-app-text/40 text-xs">
                  Registrado el {formatDate(p.registered_at.split("T")[0])}
                </p>
              </div>

              {/* Número de orden */}
              <span className="text-xs font-bold text-blood-400 bg-blood-600/10 px-2 py-0.5 rounded-full shrink-0">
                #{i + 1}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

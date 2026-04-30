import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Users,
  Heart,
  AlertTriangle,
  Phone,
  CheckCircle,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import BloodTypeBadge from "../components/BloodTypeBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { getBloodRequestById } from "../lib/blood-requests";
import { getRequestDonors } from "../lib/donations";
import { useApp } from "../contexts/AppContext";
import type { BloodRequest, Profile } from "../types";
import { timeAgo, canDonateTo } from "../lib/utils";

// ─── RequestDetail ─────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authUser, profile } = useApp();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompatAlert, setShowCompatAlert] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getBloodRequestById(id), getRequestDonors(id)]).then(
      ([{ data: req }, { data: d }]) => {
        setRequest(req);
        setDonors(d ?? []);
        setLoading(false);
      },
    );
  }, [id]);

  const isCompatible =
    profile?.blood_type && request?.blood_type
      ? canDonateTo(profile.blood_type, request.blood_type)
      : false;
  const isOwner = request?.requester_id === authUser?.id;
  const alreadyDonating = donors.some((d) => (d as any).id === authUser?.id);

  function handleDonate() {
    if (!isCompatible) {
      setShowCompatAlert(true);
      return;
    }
    navigate(`/confirm-donation/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blood-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center">
        <p className="text-app-text/40">Solicitud no encontrada</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mt-4"
        >
          Volver
        </Button>
      </div>
    );
  }

  const accepted = donors.filter((d: any) => d.status === "confirmed").length;

  return (
    <div className="min-h-screen bg-app-bg pb-32 page-enter">
      <PageHeader title="Detalle de solicitud" onBack={() => navigate(-1)} />

      {/* Hero */}
      <div className="mx-5 mt-4 bg-gradient-to-br from-blood-900/60 to-app-card border border-blood-700/30 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <UrgencyBadge urgency={request.urgency} />
          <BloodTypeBadge type={request.blood_type} size="lg" glow />
        </div>
        <h1 className="text-white text-xl font-extrabold mb-1">
          Se necesita sangre{" "}
          <span className="text-blood-400">{request.blood_type}</span>
        </h1>
        <p className="text-app-text/50 text-sm">{timeAgo(request.created_at)}</p>

        <div className="flex gap-4 mt-3">
          <Stat label="Unidades" value={`${request.units_needed}`} />
          <Stat
            label="Donantes"
            value={`${accepted}/${request.donors_needed}`}
          />
        </div>
      </div>

      <div className="mx-5 mt-4 space-y-4">
        {/* Requester */}
        <SectionCard title="Solicitante">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-app-border/10 flex items-center justify-center text-white font-bold text-base">
              {request.profile?.full_name?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="text-white font-semibold">
                {request.profile?.full_name ?? "Usuario"}
              </p>
              <p className="text-app-text/40 text-xs">
                @{request.profile?.username ?? "—"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-amber-400 text-xs font-semibold">
              <span>★ {request.profile?.avg_rating?.toFixed(1) ?? "—"}</span>
            </div>
          </div>
        </SectionCard>

        {/* Hospital */}
        <SectionCard title="Centro médico">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blood-900/40 border border-blood-700/30 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-blood-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {request.health_center}
              </p>
              {request.address && (
                <p className="text-app-text/40 text-xs mt-0.5">
                  {request.address}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Message */}
        {request.message && (
          <SectionCard title="Mensaje del solicitante">
            <p className="text-app-text/60 text-sm italic">"{request.message}"</p>
          </SectionCard>
        )}

        {/* Compatibility notice */}
        {profile?.blood_type && (
          <div
            className={`rounded-2xl p-3 border flex items-start gap-2.5 text-xs
            ${
              isCompatible
                ? "bg-emerald-900/20 border-emerald-600/30 text-emerald-400"
                : "bg-red-900/20 border-red-700/30 text-red-400"
            }`}
          >
            {isCompatible ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>
              {isCompatible
                ? `Tu sangre ${profile.blood_type} es compatible con ${request.blood_type}. ¡Puedes donar!`
                : `Tu sangre ${profile.blood_type} no es compatible con ${request.blood_type}.`}
            </span>
          </div>
        )}

        {/* Donors progress */}
        {accepted > 0 && (
          <SectionCard title={`Donantes confirmados (${accepted})`}>
            <div className="flex gap-2 flex-wrap">
              {donors.slice(0, 8).map((d: any) => (
                <div
                  key={d.id}
                  className="w-9 h-9 rounded-full bg-blood-800/40 border border-blood-600/30 flex items-center justify-center text-xs font-semibold text-app-text"
                >
                  {d.full_name?.charAt(0) ?? "?"}
                </div>
              ))}
              {donors.length > 8 && (
                <div className="w-9 h-9 rounded-full bg-app-border/8 flex items-center justify-center text-xs text-app-text/50">
                  +{donors.length - 8}
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Donate CTA */}
      {!isOwner && request.status === "open" && (
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-app-bg/95 backdrop-blur-xl border-t border-app-border/8">
          {alreadyDonating ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-900/30 border border-emerald-600/30 text-emerald-400 font-semibold text-sm">
              <CheckCircle className="w-4 h-4" />
              Ya confirmaste tu donación
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleDonate}
            >
              <Heart className="w-5 h-5 mr-2" />
              Quiero donar
            </Button>
          )}
        </div>
      )}

      {/* Compat alert modal */}
      <Modal
        open={showCompatAlert}
        onClose={() => setShowCompatAlert(false)}
        variant="center"
      >
        <div className="text-center px-2">
          <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-700/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            Incompatibilidad detectada
          </h3>
          <p className="text-app-text/50 text-sm mb-5">
            Tu tipo de sangre{" "}
            <span className="text-white font-semibold">
              {profile?.blood_type}
            </span>{" "}
            no es compatible con
            <span className="text-blood-400 font-semibold">
              {" "}
              {request.blood_type}
            </span>
            . Donar sangre incompatible puede ser peligroso.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setShowCompatAlert(false)}
            >
              Entendido
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={() => navigate(`/confirm-donation/${id}`)}
            >
              Continuar de todas formas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-app-border/5 rounded-xl px-3 py-2 text-center">
      <p className="text-white font-bold">{value}</p>
      <p className="text-app-text/40 text-[10px]">{label}</p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-app-card border border-app-border/8 rounded-2xl p-4">
      <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

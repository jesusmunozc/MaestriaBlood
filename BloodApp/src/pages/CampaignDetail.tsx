import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  BadgeCheck,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import BloodTypeBadge from "../components/BloodTypeBadge";
import Button from "../components/Button";
import {
  getCampaignById,
  registerForCampaign,
  cancelCampaignRegistration,
} from "../lib/campaigns";
import { useApp } from "../contexts/AppContext";
import type { Campaign } from "../types";
import { formatDate, formatTime } from "../lib/utils";

// ─── CampaignDetail ────────────────────────────────────────────────────────────
export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCampaignById(id).then(({ data }) => {
      setCampaign(data);
      setLoading(false);
    });
  }, [id]);

  const isFull = campaign
    ? campaign.registered_slots >= campaign.total_slots
    : false;

  async function handleRegister() {
    if (!authUser?.id || !id) return;
    setSubmitting(true);
    const { data, error } = await registerForCampaign(authUser.id, id);
    setSubmitting(false);
    if (!error && data) {
      setRegistered(true);
      setRegistrationId(data.id);
      setCampaign((prev) =>
        prev ? { ...prev, registered_slots: prev.registered_slots + 1 } : prev,
      );
    }
  }

  async function handleCancel() {
    if (!registrationId) return;
    setSubmitting(true);
    await cancelCampaignRegistration(registrationId, authUser!.id);
    setSubmitting(false);
    setRegistered(false);
    setRegistrationId(null);
    setCampaign((prev) =>
      prev
        ? { ...prev, registered_slots: Math.max(0, prev.registered_slots - 1) }
        : prev,
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blood-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) return null;

  const progress = Math.min(
    100,
    (campaign.registered_slots / campaign.total_slots) * 100,
  );

  return (
    <div className="min-h-screen bg-app-bg pb-28 page-enter">
      <PageHeader title="Detalle de campaña" onBack={() => navigate(-1)} />

      <div className="mx-5 mt-4 space-y-4">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-blood-900/60 to-app-card border border-blood-700/30 rounded-3xl p-5">
          <h1 className="text-white text-xl font-extrabold mb-2 leading-tight">
            {campaign.name}
          </h1>
          <div className="flex items-center gap-2 text-app-text/40 text-xs mb-4">
            <MapPin className="w-3 h-3" />
            <span>{campaign.location}</span>
          </div>
          {/* Blood types */}
          {campaign.blood_types_needed &&
            campaign.blood_types_needed.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {campaign.blood_types_needed.map((t) => (
                  <BloodTypeBadge key={t} type={t} size="sm" />
                ))}
              </div>
            )}
        </div>

        {/* Date & Time */}
        <div className="bg-app-card border border-app-border/8 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blood-900/40 border border-blood-700/30 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-blood-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {formatDate(campaign.date)}
            </p>
            <p className="text-app-text/40 text-xs mt-0.5">
              {campaign.start_time ? formatTime(campaign.start_time) : "—"} —{" "}
              {campaign.end_time ? formatTime(campaign.end_time) : "—"}
            </p>
          </div>
        </div>

        {/* Organizer */}
        <div className="bg-app-card border border-app-border/8 rounded-2xl p-4">
          <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-3">
            Organizador
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blood-900/40 border border-blood-700/30 flex items-center justify-center text-blood-300 font-bold">
              {campaign.profile?.full_name?.charAt(0) ?? "O"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-white font-semibold text-sm">
                  {campaign.profile?.full_name ?? "Organizador"}
                </p>
                <BadgeCheck className="w-3.5 h-3.5 text-blood-400" />
              </div>
              <p className="text-app-text/30 text-xs">
                Profesional de salud verificado
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {campaign.description && (
          <div className="bg-app-card border border-app-border/8 rounded-2xl p-4">
            <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Descripción
            </p>
            <p className="text-app-text/60 text-sm leading-relaxed">
              {campaign.description}
            </p>
          </div>
        )}

        {/* Requirements */}
        {campaign.requirements && (
          <div className="bg-app-card border border-app-border/8 rounded-2xl p-4">
            <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Requisitos
            </p>
            <p className="text-app-text/60 text-sm leading-relaxed whitespace-pre-line">
              {campaign.requirements}
            </p>
          </div>
        )}

        {/* Slots */}
        <div className="bg-app-card border border-app-border/8 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-app-text/40 text-xs">
              <Users className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider font-semibold">
                Cupos
              </span>
            </div>
            <span className="text-white font-bold text-sm">
              {campaign.registered_slots}/{campaign.total_slots}
            </span>
          </div>
          <div className="h-2 bg-app-border/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-blood-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-app-bg/95 backdrop-blur-xl border-t border-app-border/8">
        {registered ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-900/30 border border-emerald-600/30 text-emerald-400 font-semibold text-sm">
              <CheckCircle className="w-4 h-4" />
              ¡Cupo reservado!
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              loading={submitting}
              onClick={handleCancel}
            >
              Cancelar reserva
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={isFull}
            loading={submitting}
            onClick={handleRegister}
          >
            {isFull ? "Sin cupos disponibles" : "Reservar mi cupo"}
          </Button>
        )}
      </div>
    </div>
  );
}

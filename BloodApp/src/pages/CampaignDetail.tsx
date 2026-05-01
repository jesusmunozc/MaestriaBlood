import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  BadgeCheck,
  ExternalLink,
  Image as ImageIcon,
  Pencil,
  XCircle,
  ClipboardCheck,
  X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import BloodTypeBadge from "../components/BloodTypeBadge";
import Button from "../components/Button";
import {
  getCampaignById,
  registerForCampaign,
  cancelCampaignRegistration,
  completeCampaign,
  closeCampaign,
} from "../lib/campaigns";
import { useApp } from "../contexts/AppContext";
import type { Campaign } from "../types";
import { formatDate, formatTime } from "../lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCampaignStatus(c: Campaign): {
  label: string;
  color: string;
  bg: string;
} {
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

// ─── CampaignDetail ────────────────────────────────────────────────────────────
export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Estado para modal "Campaña realizada"
  const [showCompletion, setShowCompletion] = useState(false);
  const [attended, setAttended] = useState("");
  const [donated, setDonated] = useState("");
  const [observations, setObservations] = useState("");
  const [wasSuccessful, setWasSuccessful] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Estado para confirmación de cerrar campaña
  const [closingCampaign, setClosingCampaign] = useState(false);

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

  // El usuario es el creador de la campaña si su ID coincide con organizer_id
  const isOwner = !!(authUser?.id && campaign?.organizer_id === authUser.id);

  async function handleRegister() {
    if (!authUser?.id || !id) return;
    // Seguridad: el creador no puede reservar en su propia campaña
    if (isOwner) return;
    setSubmitting(true);
    const { error } = await registerForCampaign(authUser.id, id);
    setSubmitting(false);
    if (!error) {
      setRegistered(true);
      setCampaign((prev) =>
        prev ? { ...prev, registered_slots: prev.registered_slots + 1 } : prev,
      );
    }
  }

  async function handleCancel() {
    if (!authUser?.id || !id) return;
    setSubmitting(true);
    await cancelCampaignRegistration(authUser.id, id);
    setSubmitting(false);
    setRegistered(false);
    setCampaign((prev) =>
      prev
        ? { ...prev, registered_slots: Math.max(0, prev.registered_slots - 1) }
        : prev,
    );
  }

  async function handleComplete() {
    if (!id) return;
    setCompleting(true);
    await completeCampaign(id);
    setCompleting(false);
    setShowCompletion(false);
    setCampaign((prev) => prev ? { ...prev, status: "completed" } : prev);
  }

  async function handleClose() {
    if (!id) return;
    setClosingCampaign(true);
    await closeCampaign(id);
    setClosingCampaign(false);
    setCampaign((prev) => prev ? { ...prev, status: "cancelled" } : prev);
  }

  function openInMap() {
    if (!campaign) return;
    const lat = campaign.latitude;
    const lng = campaign.longitude;
    const query = lat && lng
      ? `${lat},${lng}`
      : encodeURIComponent(campaign.location);
    window.open(`https://maps.google.com/?q=${query}`, "_blank");
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
  const status = getCampaignStatus(campaign);
  const organizer = campaign.organizer ?? campaign.profile;

  return (
    <>
      <div className="min-h-screen bg-app-bg pb-32 page-enter">
        <PageHeader title="Detalle de campaña" onBack={() => navigate(-1)} />

        <div className="mx-5 mt-4 space-y-4">
          {/* Hero card */}
          <div className="bg-blood-700 rounded-3xl p-5">
            {/* Estado */}
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-white text-xl font-extrabold leading-tight flex-1 pr-3">
                {campaign.name}
              </h1>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 bg-white/20 border-white/30 text-white`}
              >
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-xs mb-4">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-snug">{campaign.location}</span>
            </div>
            {/* Tipos de sangre */}
            {campaign.blood_types_needed &&
              campaign.blood_types_needed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {campaign.blood_types_needed.map((t) => (
                    <BloodTypeBadge key={t} type={t} size="sm" />
                  ))}
                </div>
              )}
            {/* Ver en mapa */}
            <button
              onClick={openInMap}
              className="flex items-center gap-1.5 text-white/80 text-xs font-semibold mt-1 active:opacity-70"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver ubicación en mapa
            </button>
          </div>

          {/* Fecha & Hora */}
          <div className="bg-app-card border border-app-border/[0.12] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blood-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-app-text font-semibold text-sm">
                {formatDate(campaign.date)}
              </p>
              <div className="flex items-center gap-1 text-app-text/50 text-xs mt-0.5">
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  {campaign.start_time ? formatTime(campaign.start_time) : "—"}{" "}
                  —{" "}
                  {campaign.end_time ? formatTime(campaign.end_time) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Cupos */}
          <div className="bg-app-card border border-app-border/[0.12] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-app-text/50 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider font-semibold">
                  Cupos
                </span>
              </div>
              <span className="text-app-text font-bold text-sm">
                {campaign.registered_slots}/{campaign.total_slots} disponibles
              </span>
            </div>
            <div className="h-2 bg-app-border/[0.12] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= 100 ? "bg-red-500" : progress > 70 ? "bg-orange-500" : "bg-blood-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {isFull && (
              <p className="text-orange-500 text-xs mt-1.5 font-medium">
                Sin cupos disponibles
              </p>
            )}
          </div>

          {/* Organizador */}
          <div className="bg-app-card border border-app-border/[0.12] rounded-2xl p-4 shadow-sm">
            <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-3">
              Organizador
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blood-600 flex items-center justify-center text-white font-bold shrink-0">
                {organizer?.full_name?.charAt(0) ?? "O"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-app-text font-semibold text-sm">
                    {organizer?.full_name ?? "Organizador"}
                  </p>
                  <BadgeCheck className="w-3.5 h-3.5 text-blood-500" />
                </div>
                <p className="text-app-text/40 text-xs">
                  Profesional de salud verificado
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {campaign.description && (
            <div className="bg-app-card border border-app-border/[0.12] rounded-2xl p-4 shadow-sm">
              <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-2">
                Descripción
              </p>
              <p className="text-app-text/80 text-sm leading-relaxed">
                {campaign.description}
              </p>
            </div>
          )}

          {/* Requisitos */}
          {campaign.requirements && (
            <div className="bg-app-card border border-app-border/[0.12] rounded-2xl p-4 shadow-sm">
              <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-2">
                Requisitos
              </p>
              <p className="text-app-text/80 text-sm leading-relaxed whitespace-pre-line">
                {campaign.requirements}
              </p>
            </div>
          )}

          {/* Imágenes */}
          {campaign.images && campaign.images.length > 0 && (
            <div className="bg-app-card border border-app-border/[0.12] rounded-2xl p-4 shadow-sm">
              <p className="text-app-text/40 text-[10px] font-semibold uppercase tracking-wider mb-3">
                Afiches e imágenes
              </p>
              <div className="flex flex-wrap gap-2">
                {campaign.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImg(src)}
                    className="w-20 h-20 rounded-xl overflow-hidden border border-app-border/10 active:opacity-80"
                  >
                    <img
                      src={src}
                      alt={`Imagen ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 px-5 pt-4 bg-app-bg/95 backdrop-blur-xl border-t border-app-border/[0.12]"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          {isOwner ? (
            /* ── Acciones del organizador ── */
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/create-campaign?edit=${id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blood-600 text-white font-semibold text-sm active:scale-95 transition-transform"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => navigate(`/campaign/${id}/participants`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-app-card border border-app-border/20 text-app-text font-semibold text-sm active:scale-95 transition-transform"
                >
                  <Users className="w-4 h-4" />
                  Participantes
                </button>
              </div>
              {campaign?.status !== "completed" && campaign?.status !== "cancelled" && (
                <button
                  onClick={() => setShowCompletion(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm active:scale-95 transition-transform"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Campaña realizada
                </button>
              )}
              {campaign?.status !== "cancelled" && campaign?.status !== "completed" && (
                <button
                  onClick={handleClose}
                  disabled={closingCampaign}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-500/40 text-red-500 text-sm font-medium active:opacity-70 disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" />
                  {closingCampaign ? "Cerrando..." : "Cerrar campaña"}
                </button>
              )}
            </div>
          ) : registered ? (
            /* ── Cupo reservado ── */
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-600 font-semibold text-sm">
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
            /* ── Donante puede reservar ── */
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

      {/* Lightbox imágenes */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Imagen ampliada"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Modal Campaña realizada */}
      {showCompletion && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowCompletion(false)}
        >
          <div className="w-full max-w-lg bg-app-bg rounded-t-3xl p-6 pb-[max(24px,env(safe-area-inset-bottom))] space-y-4 animate-slide-up">
            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                <h2 className="text-app-text font-bold text-base">
                  ¿Cómo te fue?
                </h2>
              </div>
              <button
                onClick={() => setShowCompletion(false)}
                className="w-8 h-8 rounded-full bg-app-card-alt flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-app-text/60" />
              </button>
            </div>

            <p className="text-app-text/50 text-xs leading-relaxed">
              Cuéntanos cómo resultó la campaña. Esta información quedará en tu historial.
            </p>

            {/* ¿Fue exitosa? */}
            <div className="flex gap-2">
              <button
                onClick={() => setWasSuccessful(true)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border transition-all
                  ${wasSuccessful ? "bg-emerald-600 border-emerald-500 text-white" : "bg-app-card-alt border-app-border/15 text-app-text/60"}`}
              >
                Exitosa
              </button>
              <button
                onClick={() => setWasSuccessful(false)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border transition-all
                  ${!wasSuccessful ? "bg-orange-500 border-orange-400 text-white" : "bg-app-card-alt border-app-border/15 text-app-text/60"}`}
              >
                Con dificultades
              </button>
            </div>

            {/* Asistentes */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-app-text/60 mb-1 block">
                  Personas que asistieron
                </label>
                <input
                  type="number"
                  min={0}
                  value={attended}
                  onChange={(e) => setAttended(e.target.value)}
                  placeholder="0"
                  className="w-full bg-app-card-alt border border-app-border/[0.12] rounded-xl px-3 py-2.5 text-app-text text-sm focus:outline-none focus:border-blood-500/60 text-center font-bold"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-app-text/60 mb-1 block">
                  Donantes efectivos
                </label>
                <input
                  type="number"
                  min={0}
                  value={donated}
                  onChange={(e) => setDonated(e.target.value)}
                  placeholder="0"
                  className="w-full bg-app-card-alt border border-app-border/[0.12] rounded-xl px-3 py-2.5 text-app-text text-sm focus:outline-none focus:border-blood-500/60 text-center font-bold"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="text-xs font-medium text-app-text/60 mb-1 block">
                Observaciones generales (opcional)
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="¿Qué salió bien? ¿Qué mejorarías la próxima vez?"
                rows={3}
                className="w-full bg-app-card-alt border border-app-border/[0.12] rounded-xl px-3 py-2.5 text-app-text text-sm placeholder-app-text/30 focus:outline-none focus:border-blood-500/60 resize-none"
              />
            </div>

            {/* Confirmar */}
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              {completing ? "Guardando..." : "Confirmar campaña realizada"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

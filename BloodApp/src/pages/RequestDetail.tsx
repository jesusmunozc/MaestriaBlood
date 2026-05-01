import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  HandHeart,
  XCircle,
  CalendarCheck,
  Star,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import BloodTypeBadge from "../components/BloodTypeBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { getBloodRequestById } from "../lib/blood-requests";
import { getRequestDonors, getActiveDonation, cancelDonation } from "../lib/donations";
import { useApp } from "../contexts/AppContext";
import type { BloodRequest, Donation } from "../types";
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
  const [myDonation, setMyDonation] = useState<Donation | null>(null);
  const [activeDonationElsewhere, setActiveDonationElsewhere] = useState<Donation | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getBloodRequestById(id), getRequestDonors(id)]).then(
      ([{ data: req }, { data: d }]) => {
        setRequest(req);
        setDonors(d ?? []);
        // Find user's own donation for this specific request
        const mine = (d ?? []).find(
          (don: any) => don.donor_id === authUser?.id && don.status === "confirmed",
        );
        setMyDonation(mine ?? null);
        setLoading(false);
      },
    );
    // Check for active donation on OTHER requests
    if (authUser?.id) {
      getActiveDonation(authUser.id).then(({ data }) => {
        if (data && data.request_id !== id) {
          setActiveDonationElsewhere(data);
        }
      });
    }
  }, [id]);

  const isCompatible =
    profile?.blood_type && request?.blood_type
      ? canDonateTo(profile.blood_type, request.blood_type)
      : false;
  const isOwner = request?.requester_id === authUser?.id;
  const alreadyDonating = !!myDonation;

  function handleDonate() {
    if (!isCompatible) {
      setShowCompatAlert(true);
      return;
    }
    navigate(`/confirm-donation/${id}`);
  }

  async function handleCancelDonation() {
    if (!myDonation || !authUser?.id) return;
    setCancelling(true);
    await cancelDonation(myDonation.id, authUser.id);
    setCancelling(false);
    setShowCancelModal(false);
    navigate(-1);
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
      <div className="mx-5 mt-4 bg-gradient-to-br from-blood-600 to-blood-800 dark:from-blood-900/60 dark:to-surface border border-blood-500/50 dark:border-blood-700/30 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <UrgencyBadge urgency={request.urgency} />
          <BloodTypeBadge type={request.blood_type} size="lg" glow />
        </div>
        <h1 className="text-white text-xl font-extrabold mb-1">
          Se necesita sangre{" "}
          <span className="text-blood-400">{request.blood_type}</span>
        </h1>
        <p className="text-white/60 text-sm">{timeAgo(request.created_at)}</p>

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
            <div className="w-12 h-12 rounded-full bg-blood-100 dark:bg-app-border/10 flex items-center justify-center text-blood-700 dark:text-app-text font-bold text-base">
              {request.profile?.full_name?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="text-app-text font-semibold">
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
            <div className="w-9 h-9 rounded-xl bg-blood-100 dark:bg-blood-900/40 border border-blood-300 dark:border-blood-700/30 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-blood-400" />
            </div>
            <div>
              <p className="text-app-text font-medium text-sm">
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
            <p className="text-app-text/75 text-sm italic">"{request.message}"</p>
          </SectionCard>
        )}

        {/* Compatibility notice */}
        {profile?.blood_type && (
          <div
            className={`rounded-2xl p-3 border flex items-start gap-2.5 text-xs
            ${
              isCompatible
                ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-600/30 dark:text-emerald-400"
                : "bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400"
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
                  className="w-9 h-9 rounded-full bg-blood-100 dark:bg-blood-800/40 border border-blood-300 dark:border-blood-600/30 flex items-center justify-center text-xs font-semibold text-blood-700 dark:text-app-text"
                >
                  {d.donor?.full_name?.charAt(0) ?? "?"}
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

        {/* ── Accepted donation tracking info ── */}
        {alreadyDonating && (
          <>
            {/* Motivational banner */}
            <div className="bg-gradient-to-r from-blood-50 to-rose-50 dark:from-blood-900/30 dark:to-blood-900/10 border border-blood-200 dark:border-blood-700/30 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blood-100 dark:bg-blood-800/40 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-blood-600 dark:text-blood-400" />
              </div>
              <div>
                <p className="text-blood-700 dark:text-blood-300 font-semibold text-sm">
                  ¡Tu compromiso salva vidas!
                </p>
                <p className="text-blood-600/70 dark:text-blood-400/60 text-xs mt-0.5 leading-relaxed">
                  Cada donación puede beneficiar hasta 3 personas. El mundo necesita personas como tú.
                </p>
              </div>
            </div>

            {/* Donation requirements reminder */}
            <SectionCard title="Requisitos para donar">
              <div className="space-y-2">
                {[
                  "Peso mayor a 50 kg",
                  "No haber donado en los últimos 90 días",
                  "No estar tomando antibióticos",
                  "No tener infecciones activas",
                  "Haber dormido al menos 6 horas",
                  "Haber consumido alimentos (no en ayunas)",
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-400 dark:border-emerald-600/40 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-app-text/75 text-xs">{req}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Center hours */}
            <SectionCard title="Horarios de donación">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blood-500 shrink-0" />
                  <div>
                    <p className="text-app-text text-sm font-medium">Lunes a viernes</p>
                    <p className="text-app-text/50 text-xs">7:00 am – 4:00 pm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blood-400 shrink-0" />
                  <div>
                    <p className="text-app-text text-sm font-medium">Sábados</p>
                    <p className="text-app-text/50 text-xs">8:00 am – 12:00 m</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 mt-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl p-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-700 dark:text-amber-400 text-[10px] leading-relaxed">
                    Verifica los horarios directamente con el centro médico antes de asistir.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Location / map button */}
            <SectionCard title="Cómo llegar">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-blood-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-app-text font-medium text-sm">{request.health_center}</p>
                    {request.address && (
                      <p className="text-app-text/50 text-xs mt-0.5">{request.address}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    const query = encodeURIComponent(
                      request.address ?? request.health_center,
                    );
                    window.open(`https://maps.google.com/?q=${query}`, "_blank");
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Ver en Google Maps
                </Button>
              </div>
            </SectionCard>

            {/* Second motivational message */}
            <div className="bg-app-card border border-app-border/20 dark:border-app-border/8 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blood-100 dark:bg-blood-900/30 flex items-center justify-center shrink-0">
                <HandHeart className="w-5 h-5 text-blood-600 dark:text-blood-400" />
              </div>
              <div>
                <p className="text-app-text font-semibold text-sm">
                  Ya confirmaste tu donación
                </p>
                <p className="text-app-text/55 text-xs mt-0.5">
                  Recuerda asistir al centro médico en el horario indicado. ¡Gracias por salvar vidas!
                </p>
              </div>
              <CalendarCheck className="w-5 h-5 text-emerald-500 shrink-0 ml-auto" />
            </div>
          </>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      {!isOwner && request.status === "open" && (
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-app-bg/95 backdrop-blur-xl border-t border-app-border/20 dark:border-app-border/8">
          {alreadyDonating ? (
            /* Already accepted → only show cancel */
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={() => setShowCancelModal(true)}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Cancelar mi donación
            </Button>
          ) : activeDonationElsewhere ? (
            /* Has another pending donation → blocked */
            <div className="rounded-2xl bg-amber-50 border border-amber-400 dark:bg-amber-900/20 dark:border-amber-600/30 p-3 text-center">
              <p className="text-amber-700 dark:text-amber-300 font-semibold text-sm">
                Ya tienes una donación pendiente
              </p>
              <p className="text-amber-600/80 dark:text-amber-400/60 text-xs mt-1">
                Completa o cancela tu donación actual antes de aceptar una nueva solicitud.
              </p>
              <button
                className="mt-2 text-xs text-blood-600 dark:text-blood-400 font-semibold underline"
                onClick={() =>
                  navigate(
                    `/request/${activeDonationElsewhere.request_id}`,
                  )
                }
              >
                Ver mi donación pendiente →
              </button>
            </div>
          ) : (
            /* Available → normal donate button */
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
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-app-text font-bold text-lg mb-2">
            Incompatibilidad detectada
          </h3>
          <p className="text-app-text/70 text-sm mb-5">
            Tu tipo de sangre{" "}
            <span className="text-app-text font-semibold">
              {profile?.blood_type}
            </span>{" "}
            no es compatible con
            <span className="text-blood-600 dark:text-blood-400 font-semibold">
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

      {/* Cancel donation confirmation modal */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        variant="center"
      >
        <div className="text-center px-2">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-app-text font-bold text-lg mb-2">
            ¿Cancelar tu donación?
          </h3>
          <p className="text-app-text/70 text-sm mb-3">
            Si cancelas, tu lugar quedará libre y otro donante deberá cubrir esta solicitud.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700/30 rounded-xl p-3 mb-5 text-left">
            <p className="text-red-700 dark:text-red-400 text-xs font-semibold mb-1">
              Consecuencias de cancelar:
            </p>
            <ul className="text-red-600/80 dark:text-red-400/60 text-xs space-y-1">
              <li>• Tu cuenta quedará penalizada por <strong>30 días</strong>.</li>
              <li>• Durante ese tiempo no podrás confirmar otras donaciones.</li>
              <li>• La solicitud puede quedar sin el donante que necesita.</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setShowCancelModal(false)}
            >
              Mantener donación
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={handleCancelDonation}
              disabled={cancelling}
            >
              {cancelling ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 dark:bg-app-border/5 rounded-xl px-3 py-2 text-center">
      <p className="text-white font-bold">{value}</p>
      <p className="text-white/60 dark:text-app-text/40 text-[10px]">{label}</p>
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
    <div className="bg-app-card border border-app-border/20 dark:border-app-border/8 rounded-2xl p-4">
      <p className="text-app-text/60 text-[10px] font-semibold uppercase tracking-wider mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}


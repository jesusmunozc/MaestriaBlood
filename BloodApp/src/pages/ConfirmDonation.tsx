import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Shield, Clock, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import BloodTypeBadge from "../components/BloodTypeBadge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { getBloodRequestById } from "../lib/blood-requests";
import { confirmDonation, checkPenalty } from "../lib/donations";
import { useApp } from "../contexts/AppContext";
import type { BloodRequest } from "../types";

const HEALTH_POINTS = [
  "Peso mayor a 50 kg",
  "No he donado en los últimos 90 días",
  "No estoy tomando antibióticos",
  "No tengo infecciones activas",
  "He dormido al menos 6 horas",
];

// ─── ConfirmDonation ───────────────────────────────────────────────────────────
export default function ConfirmDonation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [checks, setChecks] = useState<boolean[]>(
    Array(HEALTH_POINTS.length).fill(false),
  );
  const [commitment, setCommitment] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [penalized, setPenalized] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBloodRequestById(id).then(({ data }) => setRequest(data));
    if (authUser?.id) {
      checkPenalty(authUser.id).then((p) => setPenalized(p));
    }
  }, [id, authUser?.id]);

  const allChecked = checks.every(Boolean) && commitment;

  function toggle(i: number) {
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  async function handleConfirm() {
    if (!authUser?.id || !id) return;
    if (penalized) {
      setShowPenaltyModal(true);
      return;
    }
    setSubmitting(true);
    const { error } = await confirmDonation(authUser.id, id);
    setSubmitting(false);
    if (!error) navigate(`/donation-confirmed/${id}`);
  }

  return (
    <div className="min-h-screen bg-app-bg pb-28 page-enter">
      <PageHeader title="Confirmar donación" onBack={() => navigate(-1)} />

      <div className="mx-5 mt-4 space-y-4">
        {/* Request summary */}
        {request && (
          <div className="bg-gradient-to-br from-blood-600 to-blood-800 dark:from-blood-900/40 dark:to-surface border border-blood-500/50 dark:border-blood-700/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Beneficiario</p>
                <p className="text-white font-semibold mt-0.5">
                  {request.profile?.full_name ?? "Usuario"}
                </p>
                <p className="text-white/70 text-xs mt-1">
                  🏥 {request.health_center}
                </p>
              </div>
              <BloodTypeBadge type={request.blood_type} size="lg" glow />
            </div>
          </div>
        )}

        {/* 30-day warning */}
        <div
          onClick={() => setShowPenaltyModal(true)}
          className="bg-amber-50 border border-amber-400 dark:bg-amber-900/20 dark:border-amber-600/30 rounded-2xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-amber-700 dark:text-amber-300 text-xs font-semibold">
              Aviso de cancelación
            </p>
            <p className="text-amber-600 dark:text-amber-400/60 text-[10px] mt-0.5">
              Si cancelas tendrás 30 días de penalización
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500 dark:text-amber-400/40 shrink-0" />
        </div>

        {/* Commitment */}
        <div className="bg-app-card border border-app-border/20 dark:border-app-border/8 rounded-2xl p-4">
          <p className="text-app-text/60 text-[10px] font-semibold uppercase tracking-wider mb-3">
            Compromiso
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={commitment}
              onChange={() => setCommitment(!commitment)}
            />
            <span className="text-app-text/85 text-sm leading-relaxed">
              Me comprometo a asistir al centro médico indicado y completar el
              proceso de donación.
            </span>
          </label>
        </div>

        {/* Health checklist */}
        <div className="bg-app-card border border-app-border/20 dark:border-app-border/8 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blood-500" />
            <p className="text-app-text/60 text-[10px] font-semibold uppercase tracking-wider">
              Aptitud médica
            </p>
          </div>
          <div className="space-y-3">
            {HEALTH_POINTS.map((point, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={checks[i]} onChange={() => toggle(i)} />
                <span className="text-app-text/85 text-sm">{point}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-2 bg-app-bg/95 backdrop-blur-xl border-t border-app-border/20 dark:border-app-border/8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!allChecked}
          loading={submitting}
          onClick={handleConfirm}
        >
          Confirmar mi donación
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>
      </div>

      {/* Penalty modal */}
      <Modal
        open={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        variant="center"
      >
        <div className="text-center px-2">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-app-text font-bold text-lg mb-2">
            Penalización por cancelar
          </h3>
          <p className="text-app-text/70 text-sm mb-5">
            Si confirmas y luego cancelas tu donación, tu cuenta quedará
            penalizada por
            <span className="text-amber-600 dark:text-amber-400 font-semibold"> 30 días</span>.
            Durante ese tiempo no podrás confirmar otras donaciones.
          </p>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => setShowPenaltyModal(false)}
          >
            Entendido
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all
        ${checked ? "bg-blood-600 border-blood-600" : "border-app-border/40 dark:border-white/20 bg-transparent"}`}
    >
      {checked && (
        <svg className="w-3 h-3 text-app-text" fill="none" viewBox="0 0 12 12">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

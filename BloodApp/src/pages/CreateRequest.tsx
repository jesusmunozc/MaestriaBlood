import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import BloodTypeBadge from "../components/BloodTypeBadge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { InputField, TextareaField } from "../components/FormFields";
import { createBloodRequest } from "../lib/blood-requests";
import { useApp } from "../contexts/AppContext";
import type { BloodType, Urgency } from "../types";
import { BLOOD_TYPES } from "../types";

const URGENCIES: { id: Urgency; label: string; desc: string; color: string }[] =
  [
    {
      id: "low",
      label: "Baja",
      desc: "Programada, no urgente",
      color: "border-emerald-600/50 text-emerald-400",
    },
    {
      id: "medium",
      label: "Media",
      desc: "Dentro de pocos días",
      color: "border-amber-500/50 text-amber-400",
    },
    {
      id: "urgent",
      label: "Urgente",
      desc: "Dentro de las próximas horas",
      color: "border-red-600/50 text-red-400",
    },
  ];

// ─── CreateRequest ─────────────────────────────────────────────────────────────
export default function CreateRequest() {
  const navigate = useNavigate();
  const { authUser } = useApp();
  const [bloodType, setBloodType] = useState<BloodType | "">("");
  const [units, setUnits] = useState(1);
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [healthCenter, setHealthCenter] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [showUrgencyModal, setShowUrgencyModal] = useState(false);
  const [pendingUrgency, setPendingUrgency] = useState<Urgency | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function selectUrgency(u: Urgency) {
    if (u === "urgent") {
      setPendingUrgency(u);
      setShowUrgencyModal(true);
    } else setUrgency(u);
  }

  function confirmUrgent() {
    if (pendingUrgency) setUrgency(pendingUrgency);
    setShowUrgencyModal(false);
  }

  async function handleSubmit() {
    if (!bloodType || !healthCenter) {
      setError("Completa los campos obligatorios.");
      return;
    }
    if (!authUser?.id) return;
    setError("");
    setSubmitting(true);
    const { error: err } = await createBloodRequest({
      requester_id: authUser.id,
      blood_type: bloodType,
      units_needed: units,
      donors_needed: units,
      urgency,
      health_center: healthCenter,
      address,
      message,
      status: "open",
    });
    setSubmitting(false);
    if (err) {
      setError("No se pudo crear la solicitud.");
      return;
    }
    navigate("/my-requests");
  }

  return (
    <div className="min-h-screen bg-app-bg pb-28 page-enter">
      <PageHeader title="Nueva solicitud" onBack={() => navigate(-1)} />

      <div className="mx-5 mt-4 space-y-5">
        {/* Blood type */}
        <div>
          <p className="text-app-text/40 text-xs font-semibold uppercase tracking-wider mb-3">
            Tipo de sangre requerido
          </p>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setBloodType(t)}
                className={`py-2 rounded-xl border text-sm font-bold transition-all
                  ${
                    bloodType === t
                      ? "bg-blood-600 border-blood-600 text-white scale-105"
                      : "bg-app-border/5 border-app-border/10 text-app-text/50"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div>
          <p className="text-app-text/40 text-xs font-semibold uppercase tracking-wider mb-3">
            Unidades necesarias
          </p>
          <div className="flex items-center justify-between bg-app-card border border-app-border/8 rounded-2xl p-4">
            <button
              onClick={() => setUnits((u) => Math.max(1, u - 1))}
              className="w-10 h-10 rounded-full bg-app-border/8 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Minus className="w-4 h-4 text-app-text" />
            </button>
            <div className="text-center">
              <span className="text-3xl font-extrabold text-app-text">
                {units}
              </span>
              <p className="text-app-text/40 text-xs mt-0.5">
                {units === 1 ? "unidad" : "unidades"}
              </p>
            </div>
            <button
              onClick={() => setUnits((u) => Math.min(10, u + 1))}
              className="w-10 h-10 rounded-full bg-blood-600 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4 text-app-text" />
            </button>
          </div>
        </div>

        {/* Urgency */}
        <div>
          <p className="text-app-text/40 text-xs font-semibold uppercase tracking-wider mb-3">
            Urgencia
          </p>
          <div className="space-y-2">
            {URGENCIES.map(({ id, label, desc, color }) => (
              <button
                key={id}
                onClick={() => selectUrgency(id)}
                className={`w-full flex items-center gap-3 bg-app-card border rounded-2xl p-3.5 transition-all
                  ${urgency === id ? `border-current ${color} bg-opacity-20` : "border-app-border/8 text-app-text/40"}`}
              >
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${urgency === id ? "bg-current" : "bg-white/20"}`}
                />
                <div className="text-left">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs opacity-60">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Health center */}
        <InputField
          label="Centro médico *"
          value={healthCenter}
          onChange={(e) => setHealthCenter(e.target.value)}
          placeholder="Ej: Hospital San Juan de Dios"
        />

        <InputField
          label="Dirección"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Cra 10 # 5-20, Bogotá"
        />

        <TextareaField
          label="Mensaje (opcional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Explica la situación brevemente..."
          rows={3}
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-app-bg/95 backdrop-blur-xl border-t border-app-border/8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!bloodType || !healthCenter}
          loading={submitting}
          onClick={handleSubmit}
        >
          Publicar solicitud
        </Button>
      </div>

      {/* Urgency warning modal */}
      <Modal
        open={showUrgencyModal}
        onClose={() => setShowUrgencyModal(false)}
        variant="center"
      >
        <div className="text-center px-2">
          <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-700/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">¿Urgencia alta?</h3>
          <p className="text-app-text/50 text-sm mb-5">
            Marca urgente sólo si la sangre se necesita en las{" "}
            <span className="text-red-400 font-semibold">próximas horas</span>.
            Las falsas urgencias afectan la confianza de la comunidad.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setShowUrgencyModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={confirmUrgent}
            >
              Sí, es urgente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

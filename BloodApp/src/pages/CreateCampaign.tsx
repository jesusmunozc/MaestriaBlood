import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Calendar } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import BloodTypeBadge from "../components/BloodTypeBadge";
import { InputField, TextareaField } from "../components/FormFields";
import { createCampaign } from "../lib/campaigns";
import { useApp } from "../contexts/AppContext";
import type { BloodType } from "../types";
import { BLOOD_TYPES } from "../types";

// ─── CreateCampaign ────────────────────────────────────────────────────────────
export default function CreateCampaign() {
  const navigate = useNavigate();
  const { authUser, profile } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalSlots, setTotalSlots] = useState(20);
  const [requirements, setRequirements] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<BloodType[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleType(t: BloodType) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  const canCreate = profile?.user_type === "professional";

  async function handleSubmit() {
    if (!name || !location || !date) {
      setError("Completa los campos obligatorios.");
      return;
    }
    if (!authUser?.id) return;
    setError("");
    setSubmitting(true);
    const { error: err } = await createCampaign({
      organizer_id: authUser.id,
      name,
      description,
      location,
      date,
      start_time: startTime,
      end_time: endTime,
      total_slots: totalSlots,
      registered_slots: 0,
      blood_types_needed: selectedTypes,
      requirements,
    });
    setSubmitting(false);
    if (err) {
      setError("No se pudo crear la campaña.");
      return;
    }
    navigate("/my-campaigns");
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/50 text-sm mb-6">
          Solo los profesionales de salud pueden crear campañas.
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-28 page-enter">
      <PageHeader title="Nueva campaña" onBack={() => navigate(-1)} />

      <div className="mx-5 mt-4 space-y-5">
        {/* Pro message */}
        <div className="bg-gradient-to-br from-blood-900/40 to-[#1a1a2e] border border-blood-700/30 rounded-2xl p-4">
          <p className="text-blood-300 text-xs font-semibold mb-1">
            ¡Gracias por tu compromiso!
          </p>
          <p className="text-white/50 text-xs leading-relaxed">
            Como profesional de salud, tus campañas llegan a cientos de donantes
            potenciales y salvan vidas.
          </p>
        </div>

        <InputField
          label="Nombre de la campaña *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Jornada de Donación Hospital Central"
        />

        <TextareaField
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el propósito y actividades..."
          rows={3}
        />

        <InputField
          label="Lugar / Dirección *"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ej: Cra 7 # 32-16, Bogotá"
        />

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Fecha *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex flex-col gap-3">
            <InputField
              label="Hora inicio"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <InputField
              label="Hora fin"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Total slots */}
        <div>
          <p className="text-white/60 text-sm mb-1">Cupos totales</p>
          <div className="flex items-center gap-4 bg-[#1a1a2e] border border-white/8 rounded-2xl p-4">
            <button
              onClick={() => setTotalSlots((n) => Math.max(5, n - 5))}
              className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <span className="flex-1 text-center text-2xl font-extrabold text-white">
              {totalSlots}
            </span>
            <button
              onClick={() => setTotalSlots((n) => Math.min(500, n + 5))}
              className="w-9 h-9 rounded-full bg-blood-600 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Blood types */}
        <div>
          <p className="text-white/60 text-sm mb-2">
            Tipos de sangre necesarios
          </p>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`py-2 rounded-xl border text-sm font-bold transition-all
                  ${selectedTypes.includes(t) ? "bg-blood-600 border-blood-600 text-white scale-105" : "bg-white/5 border-white/10 text-white/50"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <TextareaField
          label="Requisitos"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Peso mínimo, edad, ayuno..."
          rows={3}
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-[#0f0f0f]/95 backdrop-blur-xl border-t border-white/8">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!name || !location || !date}
          loading={submitting}
          onClick={handleSubmit}
        >
          Publicar campaña
        </Button>
      </div>
    </div>
  );
}

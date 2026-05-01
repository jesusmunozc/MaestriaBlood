import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Calendar,
  MapPin,
  Navigation,
  Image as ImageIcon,
  X,
  AlertCircle,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { InputField, TextareaField } from "../components/FormFields";
import { createCampaign } from "../lib/campaigns";
import { useApp } from "../contexts/AppContext";
import type { BloodType } from "../types";
import { BLOOD_TYPES } from "../types";
import { Geolocation } from "@capacitor/geolocation";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

// ─── CreateCampaign ───────────────────────────────────────────────────────────
export default function CreateCampaign() {
  const navigate = useNavigate();
  const { authUser, profile } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalSlots, setTotalSlots] = useState(20);
  const [slotsInput, setSlotsInput] = useState("20");
  const [requirements, setRequirements] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<BloodType[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [committed, setCommitted] = useState(false);

  function toggleType(t: BloodType) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function handleSlotsChange(val: string) {
    setSlotsInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1) setTotalSlots(n);
  }

  function adjustSlots(delta: number) {
    const next = Math.max(1, Math.min(500, totalSlots + delta));
    setTotalSlots(next);
    setSlotsInput(String(next));
  }

  async function useCurrentLocation() {
    setLocLoading(true);
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      setLocation(
        `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
      );
      setErrors((e) => ({ ...e, location: "" }));
    } catch {
      setErrors((e) => ({
        ...e,
        location: "No se pudo obtener la ubicación. Escríbela manualmente.",
      }));
    } finally {
      setLocLoading(false);
    }
  }

  async function pickImage() {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 80,
      });
      if (photo.dataUrl) {
        setImages((prev) => [...prev, photo.dataUrl!]);
      }
    } catch {
      // User cancelled — no action needed
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "El nombre es obligatorio.";
    if (!location.trim()) errs.location = "La ubicación es obligatoria.";
    if (!date) {
      errs.date = "La fecha es obligatoria.";
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (date < today) errs.date = "La fecha no puede ser anterior a hoy.";
    }
    if (!startTime) errs.startTime = "La hora de inicio es obligatoria.";
    if (!endTime) errs.endTime = "La hora de fin es obligatoria.";
    if (startTime && endTime && endTime <= startTime)
      errs.endTime = "La hora de fin debe ser posterior al inicio.";
    if (totalSlots < 1) errs.slots = "Debe haber al menos 1 cupo.";
    if (selectedTypes.length === 0)
      errs.types = "Selecciona al menos un tipo de sangre.";
    if (!requirements.trim())
      errs.requirements = "Indica los requisitos básicos para los donantes.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const canCreate = profile?.user_type === "professional";

  async function handleSubmit() {
    if (!committed) {
      setErrors({ submit: "Debes aceptar el compromiso de buen trato antes de publicar la campaña." });
      return;
    }
    if (!validate()) return;
    if (!authUser?.id) return;
    setSubmitting(true);
    setErrors({});

    // Construir payload limpio
    const payload = {
      organizer_id: authUser.id,
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim(),
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      date,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      total_slots: Number(totalSlots),
      registered_slots: 0,
      blood_types_needed: selectedTypes,
      requirements: requirements.trim(),
      images: images.length > 0 ? images : undefined,
      status: "active" as const,
    };

    console.debug("[CreateCampaign] payload:", payload);

    const { error: err } = await createCampaign(payload);
    setSubmitting(false);
    if (err) {
      console.error("[CreateCampaign] error:", err);
      if (err.includes("violates") || err.includes("null value") || err.includes("not-null"))
        setErrors({ submit: "Completa todos los campos obligatorios e intenta de nuevo." });
      else if (err.includes("storage") || err.includes("image"))
        setErrors({ submit: "No se pudo cargar una de las imágenes. Intenta con otra." });
      else
        setErrors({ submit: "No se pudo crear la campaña por un problema del servidor. Intenta más tarde." });
      return;
    }
    navigate("/my-campaigns");
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-app-border/5 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-app-text/20" />
        </div>
        <p className="text-app-text/50 text-sm mb-6">
          Solo los profesionales de salud pueden crear campañas.
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg page-enter">
      <PageHeader title="Nueva campaña" onBack={() => navigate(-1)} />

      <div className="mx-5 mt-4 space-y-5 pb-36">
        {/* Mensaje bienvenida */}
        <div className="bg-gradient-to-br from-blood-700/25 to-blood-900/15 border border-blood-500/30 rounded-2xl p-4">
          <p className="text-blood-300 text-xs font-bold mb-1">
            ¡Gracias por tu compromiso!
          </p>
          <p className="text-app-text/70 text-xs leading-relaxed">
            Como profesional de salud, tus campañas llegan a cientos de donantes
            potenciales y salvan vidas.
          </p>
        </div>

        {/* Buenas prácticas — checkbox compromiso */}
        <button
          type="button"
          onClick={() => setCommitted((v) => !v)}
          className={`w-full text-left flex items-start gap-3 rounded-2xl border p-4 transition-all active:scale-[0.98]
            ${committed
              ? "bg-emerald-500/10 border-emerald-500/40"
              : "bg-blue-500/10 border-blue-400/25"
            }`}
        >
          {/* Checkbox visual */}
          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all
            ${committed ? "bg-emerald-500 border-emerald-500" : "border-blue-400/60 bg-transparent"}`}>
            {committed && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold mb-1 ${committed ? "text-emerald-400" : "text-blue-300"}`}>
              {committed ? "✓ Compromiso aceptado" : "Compromiso obligatorio *"}
            </p>
            <p className={`text-xs leading-relaxed ${committed ? "text-emerald-300/80" : "text-blue-200/70"}`}>
              Me comprometo a comunicarme con respeto y claridad con los donantes, publicar información real sobre horarios, requisitos y ubicación, y brindar una experiencia amable que motive a las personas a seguir donando.
            </p>
          </div>
        </button>

        {/* Nombre */}
        <InputField
          label="Nombre de la campaña *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Jornada de Donación Hospital Central"
          error={errors.name}
        />

        {/* Descripción */}
        <TextareaField
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el propósito y actividades de la campaña..."
          rows={3}
        />

        {/* Ubicación */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-app-text/70">
            Lugar / Dirección *
          </label>
          <div
            className={`flex items-center gap-3 bg-app-card-alt border rounded-xl px-4 py-3.5 transition-colors
              ${errors.location ? "border-red-500/60" : "border-app-border/10 focus-within:border-blood-500/60"}`}
          >
            <MapPin className="w-4 h-4 text-app-text/40 shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setLatitude(null);
                setLongitude(null);
              }}
              placeholder="Ej: Cra 7 # 32-16, Bogotá"
              className="flex-1 bg-transparent text-app-text text-sm placeholder-app-text/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locLoading}
              className="shrink-0 p-1.5 rounded-lg bg-blood-600/15 text-blood-400 active:scale-90 transition-transform disabled:opacity-40"
              title="Usar mi ubicación actual"
            >
              <Navigation
                className={`w-4 h-4 ${locLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          {errors.location && (
            <span className="text-xs text-red-400">{errors.location}</span>
          )}
          {latitude !== null && longitude !== null && (
            <span className="text-xs text-emerald-400">
              Coordenadas guardadas: {latitude.toFixed(5)},{" "}
              {longitude.toFixed(5)}
            </span>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-app-text/70">
            Fecha y horario *
          </p>
          <InputField
            label="Fecha *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Hora inicio *"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              error={errors.startTime}
            />
            <InputField
              label="Hora fin *"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              error={errors.endTime}
            />
          </div>
        </div>

        {/* Cupos totales */}
        <div>
          <p className="text-sm font-medium text-app-text/70 mb-2">
            Cupos totales *
          </p>
          <div className="flex items-center gap-3 bg-app-card border border-app-border/8 rounded-2xl p-4">
            <button
              onClick={() => adjustSlots(-5)}
              className="w-10 h-10 rounded-full bg-app-border/8 flex items-center justify-center active:scale-90 transition-transform shrink-0"
            >
              <Minus className="w-4 h-4 text-app-text" />
            </button>
            <input
              type="number"
              min={1}
              max={500}
              value={slotsInput}
              onChange={(e) => handleSlotsChange(e.target.value)}
              onBlur={() => {
                const n = parseInt(slotsInput, 10);
                if (isNaN(n) || n < 1) {
                  setTotalSlots(1);
                  setSlotsInput("1");
                } else if (n > 500) {
                  setTotalSlots(500);
                  setSlotsInput("500");
                }
              }}
              className="flex-1 text-center text-2xl font-extrabold text-app-text bg-transparent focus:outline-none"
            />
            <button
              onClick={() => adjustSlots(5)}
              className="w-10 h-10 rounded-full bg-blood-600 flex items-center justify-center active:scale-90 transition-transform shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
          {errors.slots && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.slots}
            </span>
          )}
        </div>

        {/* Tipos de sangre */}
        <div>
          <p className="text-sm font-medium text-app-text/70 mb-2">
            Tipos de sangre necesarios *
          </p>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-95
                  ${
                    selectedTypes.includes(t)
                      ? "bg-blood-600 border-blood-500 text-white shadow-sm"
                      : "bg-app-card-alt border-app-border/15 text-app-text/60"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.types && (
            <span className="text-xs text-red-400 mt-1 block">
              {errors.types}
            </span>
          )}
        </div>

        {/* Requisitos */}
        <TextareaField
          label="Requisitos para donantes *"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Ej: Mayor de 18 años, peso mínimo 50 kg, ayuno de 4 horas, no haber donado en los últimos 3 meses..."
          rows={4}
          error={errors.requirements}
        />

        {/* Imágenes / afiches */}
        <div>
          <p className="text-sm font-medium text-app-text/70 mb-2">
            Afiches o imágenes (opcional)
          </p>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {images.map((src, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img
                    src={src}
                    alt={`Afiche ${i + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-app-border/10"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shadow-md active:scale-90 transition-transform"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={pickImage}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-app-border/20 rounded-2xl py-4 text-app-text/40 text-sm active:scale-[0.98] transition-transform"
          >
            <ImageIcon className="w-4 h-4" />
            Agregar imagen o afiche
          </button>
        </div>

        {/* Error general */}
        {errors.submit && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}
      </div>

      {/* Botón fijo */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-4 bg-app-bg/95 backdrop-blur-xl border-t border-app-border/[0.12]"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!committed}
          onClick={handleSubmit}
        >
          Publicar campaña
        </Button>
      </div>
    </div>
  );
}
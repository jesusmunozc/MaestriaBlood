import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Droplets,
  Hash,
  Lock,
  Eye,
  EyeOff,
  AtSign,
  Camera,
  MapPin,
  Navigation,
  Stethoscope,
  Check,
  ArrowRight,
} from "lucide-react";
import StepIndicator from "../components/StepIndicator";
import { InputField, SelectField } from "../components/FormFields";
import Button from "../components/Button";
import { BLOOD_TYPES, ID_TYPES } from "../types";
import type {
  BloodType,
  IdType,
  UserType,
  RegisterStep1,
  RegisterStep2,
  RegisterStep3,
} from "../types";
import { registerUser } from "../lib/auth";
import { useApp } from "../contexts/AppContext";
import { getPasswordStrength } from "../lib/utils";

// ─── Register — 3-step registration matching mockup ───────────────────────────

const STEPS = [
  { label: "Datos" },
  { label: "Verificación" },
  { label: "Cuenta" },
];

const DEFAULT_REQUIREMENTS = [
  "Tener entre 18 y 65 años",
  "Pesar más de 50 kg",
  "Presentar documento de identidad",
  "No haber donado en los últimos 3 meses",
];

export default function Register() {
  const navigate = useNavigate();
  const { refreshUser } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [userType, setUserType] = useState<UserType>("donor");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bloodType, setBloodType] = useState<BloodType>("O+");
  const [idType, setIdType] = useState<IdType>("CC");
  const [idNumber, setIdNumber] = useState("");

  // Step 2 state
  const [frontDoc, setFrontDoc] = useState("");
  const [backDoc, setBackDoc] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Step 3 state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [donationCommitment, setDonationCommitment] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  function handleFileUpload(setter: (v: string) => void) {
    // In a real app, use Capacitor Camera plugin
    // For now, create a mock URL (will be replaced with real upload)
    const mockUrl = `https://placeholder.local/${Date.now()}`;
    setter(mockUrl);
  }

  async function handleRegister() {
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!termsAccepted || !donationCommitment) {
      setError("Debes aceptar los términos y el compromiso de donación.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    const step1: RegisterStep1 = {
      user_type: userType,
      full_name: fullName,
      birth_date: birthDate,
      blood_type: bloodType,
      id_type: idType,
      id_number: idNumber,
    };
    const step2: RegisterStep2 = {
      front_doc_url: frontDoc,
      back_doc_url: backDoc,
      avatar_url: profilePhoto,
      city,
      address,
    };
    const step3: RegisterStep3 = {
      username,
      password,
      terms_accepted: termsAccepted,
      donation_commitment: donationCommitment,
    };

    const { error: err } = await registerUser(step1, step2, step3);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    refreshUser();
    // Navigate to survey for citizens
    if (userType === "donor") {
      navigate("/donor-survey", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] page-enter">
      {/* Header */}
      <div className="safe-top bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate("/"))}
          className="p-2 rounded-full bg-white/10 text-white/60 active:scale-95"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="flex-1 text-base font-semibold text-white">
          Crear cuenta
        </h1>
        <span className="text-xs text-white/40 font-medium">{step}/3</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <StepIndicator steps={STEPS} currentStep={step} />

        {/* ── Step 1: Personal data ─────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-5 page-enter">
            {/* User type */}
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Tipo de usuario
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { value: "donor", label: "Ciudadano", icon: User },
                    {
                      value: "professional",
                      label: "Profesional de salud",
                      icon: Stethoscope,
                    },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setUserType(value)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all
                      ${
                        userType === value
                          ? "border-blood-500 bg-blood-600/15 text-blood-400"
                          : "border-white/10 bg-[#1e1e2e] text-white/50"
                      }
                    `}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-semibold text-center">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label="Nombre completo"
              icon={User}
              placeholder="Juan Pérez García"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Fecha de nacimiento"
                icon={Calendar}
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-white/70 mb-1.5 block">
                  Tipo de sangre
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BLOOD_TYPES.map((bt) => (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setBloodType(bt)}
                      className={`
                        py-1.5 rounded-lg text-xs font-bold transition-all
                        ${
                          bloodType === bt
                            ? "bg-blood-600 text-white"
                            : "bg-[#1e1e2e] text-white/40 border border-white/10"
                        }
                      `}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <SelectField
              label="Tipo de identificación"
              icon={Hash}
              value={idType}
              onChange={(e) => setIdType(e.target.value as IdType)}
            >
              {ID_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>

            <InputField
              label="Número de identificación"
              icon={Hash}
              placeholder="Ej: 1234567890"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                if (!fullName || !birthDate || !idNumber) {
                  setError("Completa todos los campos obligatorios.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Verification ──────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-5 page-enter">
            {/* Front doc */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-1">
                Documento de identidad — Cara frontal
              </h3>
              <p className="text-xs text-white/40 mb-2">
                Fotografía o sube la cara frontal de tu documento
              </p>
              <button
                type="button"
                onClick={() => handleFileUpload(setFrontDoc)}
                className={`
                  w-full h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all
                  ${frontDoc ? "border-blood-500 bg-blood-600/10" : "border-white/15 bg-[#1e1e2e]"}
                `}
              >
                {frontDoc ? (
                  <>
                    <Check className="w-8 h-8 text-blood-400" />
                    <span className="text-xs text-blood-400 font-medium">
                      Imagen cargada
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 text-white/30"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="2"
                        y="4"
                        width="20"
                        height="16"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M2 10h20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span className="text-xs text-white/30">
                      Cara frontal del documento
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Back doc */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-1">
                Documento de identidad — Cara posterior
              </h3>
              <p className="text-xs text-white/40 mb-2">
                Fotografía o sube la cara posterior de tu documento
              </p>
              <button
                type="button"
                onClick={() => handleFileUpload(setBackDoc)}
                className={`
                  w-full h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all
                  ${backDoc ? "border-blood-500 bg-blood-600/10" : "border-white/15 bg-[#1e1e2e]"}
                `}
              >
                {backDoc ? (
                  <>
                    <Check className="w-8 h-8 text-blood-400" />
                    <span className="text-xs text-blood-400 font-medium">
                      Imagen cargada
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 text-white/30"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="2"
                        y="4"
                        width="20"
                        height="16"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M2 10h20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span className="text-xs text-white/30">
                      Cara posterior del documento
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Profile photo */}
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-1">
                Tu foto de perfil
              </h3>
              <p className="text-xs text-white/40 mb-2">
                Toca para abrir la cámara y tomarte una foto. Fondo claro,
                rostro visible.
              </p>
              <button
                type="button"
                onClick={() => handleFileUpload(setProfilePhoto)}
                className={`
                  w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all
                  ${profilePhoto ? "border-blood-500 bg-blood-600/10" : "border-white/15 bg-[#1e1e2e]"}
                `}
              >
                {profilePhoto ? (
                  <>
                    <Check className="w-8 h-8 text-blood-400" />
                    <span className="text-xs text-blood-400 font-medium">
                      Foto tomada
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-white/30" />
                    <span className="text-xs text-white/30">Abrir cámara</span>
                    <span className="text-[10px] text-white/20">
                      No se puede subir desde galería
                    </span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-white/30 mt-1.5">
                ℹ️ Esta foto se usa para verificar que no existan cuentas
                duplicadas.
              </p>
            </div>

            <InputField
              label="Ciudad"
              icon={MapPin}
              placeholder="Bogotá"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <InputField
              label="Dirección"
              icon={MapPin}
              placeholder="Calle 123 #45-67"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rightElement={
                <button type="button" className="text-blood-400">
                  <Navigation className="w-4 h-4" />
                </button>
              }
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                if (!city) {
                  setError("Ingresa tu ciudad.");
                  return;
                }
                setError(null);
                setStep(3);
              }}
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── Step 3: Account ───────────────────────────── */}
        {step === 3 && (
          <div className="flex flex-col gap-5 page-enter">
            <InputField
              label="Nombre de usuario"
              icon={AtSign}
              placeholder="juanperez123"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
              }
              hint="Este será tu identificador único"
            />

            <InputField
              label="Contraseña"
              icon={Lock}
              type={showPass ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-white/40"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {/* Password strength */}
            {password && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.className}`}
                  />
                </div>
                <span className="text-xs text-white/50">
                  {passwordStrength.label}
                </span>
              </div>
            )}

            <InputField
              label="Confirmar contraseña"
              icon={Lock}
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={
                confirmPassword && password !== confirmPassword
                  ? "Las contraseñas no coinciden"
                  : undefined
              }
            />

            {/* Terms */}
            <div className="flex flex-col gap-3 mt-1">
              {[
                {
                  id: "terms",
                  checked: termsAccepted,
                  onChange: setTermsAccepted,
                  label: (
                    <span>
                      Acepto los{" "}
                      <button className="text-blood-400 underline">
                        Términos y condiciones
                      </button>{" "}
                      y la{" "}
                      <button className="text-blood-400 underline">
                        Política de privacidad
                      </button>
                    </span>
                  ),
                },
                {
                  id: "commitment",
                  checked: donationCommitment,
                  onChange: setDonationCommitment,
                  label:
                    "Acepto el compromiso de donación solidaria sin fines de lucro",
                },
              ].map(({ id, checked, onChange, label }) => (
                <label
                  key={id}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <div
                    onClick={() => onChange(!checked)}
                    className={`
                      mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                      ${checked ? "bg-blood-600 border-blood-600" : "border-white/30 bg-transparent"}
                    `}
                  >
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs text-white/60">{label}</span>
                </label>
              ))}
            </div>

            {error && (
              <div className="bg-red-600/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleRegister}
            >
              Crear cuenta <Check className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

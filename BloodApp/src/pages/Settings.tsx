import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Droplets,
  Bell,
  Lock,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  Weight,
  LogOut,
  Trash2,
  MessageCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { InputField, SelectField } from "../components/FormFields";
import { useApp } from "../contexts/AppContext";
import { updateProfile, checkUsernameTaken } from "../lib/profiles";
import { sendPasswordReset } from "../lib/auth";
import { supabase } from "../lib/supabase";
import type { BloodType, IdType } from "../types";
import { BLOOD_TYPES, ID_TYPES } from "../types";

// ─── Settings ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const { profile, authUser, updateLocalProfile, signOut } = useApp();

  // Section open state
  const [openSection, setOpenSection] = useState<string | null>("profile");

  // ── Edit profile form
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [idType, setIdType] = useState<IdType>(profile?.id_type ?? "CC");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Medical info
  const [bloodType, setBloodType] = useState<BloodType | "">(
    profile?.blood_type ?? "",
  );
  const [medSaving, setMedSaving] = useState(false);
  const [medSuccess, setMedSuccess] = useState(false);
  const [medError, setMedError] = useState<string | null>(null);

  // ── Preferences (stored in localStorage, no backend for now)
  const [notifDonations, setNotifDonations] = useState(
    () => localStorage.getItem("notif_donations") !== "false",
  );
  const [notifRequests, setNotifRequests] = useState(
    () => localStorage.getItem("notif_requests") !== "false",
  );
  const [notifReminders, setNotifReminders] = useState(
    () => localStorage.getItem("notif_reminders") !== "false",
  );

  // ── Password reset
  const [pwResetSent, setPwResetSent] = useState(false);
  const [pwResetLoading, setPwResetLoading] = useState(false);

  // ── Modals
  const [showSignOut, setShowSignOut] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // ── FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ─────────────────────────────────── Handlers ─────────────────────────────

  function toggle(section: string) {
    setOpenSection((prev) => (prev === section ? null : section));
  }

  async function saveProfile() {
    if (!authUser?.id) return;
    setProfileError(null);
    setProfileSuccess(false);

    if (!fullName.trim()) {
      setProfileError("El nombre completo es obligatorio.");
      return;
    }
    if (!username.trim() || username.length < 3) {
      setProfileError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setProfileError(
        "El usuario solo puede contener letras minúsculas, números y guión bajo.",
      );
      return;
    }

    setProfileSaving(true);

    // Check username uniqueness only if changed
    if (username !== profile?.username) {
      const taken = await checkUsernameTaken(username);
      if (taken) {
        setProfileError("Ese nombre de usuario ya está en uso.");
        setProfileSaving(false);
        return;
      }
    }

    const { error } = await updateProfile(authUser.id, {
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      city: city.trim() || undefined,
      id_type: idType,
    });

    setProfileSaving(false);
    if (error) {
      setProfileError(error);
    } else {
      updateLocalProfile({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        city: city.trim() || undefined,
        id_type: idType,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  }

  async function saveMedical() {
    if (!authUser?.id) return;
    setMedError(null);
    setMedSuccess(false);

    if (!bloodType) {
      setMedError("Selecciona tu tipo de sangre.");
      return;
    }

    setMedSaving(true);
    const { error } = await updateProfile(authUser.id, {
      blood_type: bloodType as BloodType,
    });
    setMedSaving(false);

    if (error) {
      setMedError(error);
    } else {
      updateLocalProfile({ blood_type: bloodType as BloodType });
      setMedSuccess(true);
      setTimeout(() => setMedSuccess(false), 3000);
    }
  }

  function savePreferences() {
    localStorage.setItem("notif_donations", String(notifDonations));
    localStorage.setItem("notif_requests", String(notifRequests));
    localStorage.setItem("notif_reminders", String(notifReminders));
  }

  async function handlePasswordReset() {
    if (!profile?.email) return;
    setPwResetLoading(true);
    await sendPasswordReset(profile.email);
    setPwResetLoading(false);
    setPwResetSent(true);
  }

  async function handleSignOut() {
    setShowSignOut(false);
    try {
      await signOut();
    } catch {}
    navigate("/");
  }

  async function handleDeleteAccount() {
    if (deleteConfirm.toLowerCase() !== "eliminar") return;
    // Mark account for deletion (soft delete via profile flag)
    if (authUser?.id) {
      await supabase
        .from("profiles")
        .update({ delete_requested: true } as any)
        .eq("id", authUser.id);
    }
    setShowDeleteAccount(false);
    try {
      await signOut();
    } catch {}
    navigate("/");
  }

  // ─────────────────────────────────── Render ───────────────────────────────

  return (
    <div className="min-h-screen bg-app-bg pb-10 page-enter">
      <PageHeader title="Configuración" onBack={() => navigate(-1)} />

      <div className="mx-5 mt-4 space-y-3">

        {/* ── 1. Editar perfil ── */}
        <SettingsSection
          id="profile"
          title="Editar perfil"
          icon={<User className="w-4 h-4 text-blood-500" />}
          isOpen={openSection === "profile"}
          onToggle={() => toggle("profile")}
        >
          <div className="space-y-3 pt-1">
            <InputField
              label="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
            />
            <InputField
              label="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="usuario_123"
              hint="Solo letras minúsculas, números y guión bajo."
            />
            <InputField
              label="Ciudad"
              icon={MapPin}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Tu ciudad"
            />
            <SelectField
              label="Tipo de documento"
              value={idType}
              onChange={(e) => setIdType(e.target.value as IdType)}
            >
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </SelectField>

            {profileError && (
              <FeedbackBanner type="error" message={profileError} />
            )}
            {profileSuccess && (
              <FeedbackBanner
                type="success"
                message="Perfil actualizado correctamente."
              />
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={saveProfile}
              disabled={profileSaving}
            >
              {profileSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </SettingsSection>

        {/* ── 2. Información médica ── */}
        <SettingsSection
          id="medical"
          title="Información médica"
          icon={<Droplets className="w-4 h-4 text-rose-500" />}
          isOpen={openSection === "medical"}
          onToggle={() => toggle("medical")}
        >
          <div className="space-y-3 pt-1">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/30 rounded-xl p-3 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                El tipo de sangre es un dato médico sensible. Si crees que está
                incorrecto, puedes actualizar lo aquí, pero te recomendamos
                verificarlo con un profesional.
              </p>
            </div>

            <SelectField
              label="Tipo de sangre"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value as BloodType)}
            >
              <option value="">Seleccionar...</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </SelectField>

            {/* Read-only fields */}
            <ReadOnlyField
              label="Apto para donar"
              value={
                profile?.aptitude_eligible === true
                  ? "Sí"
                  : profile?.aptitude_eligible === false
                    ? "No"
                    : "Pendiente de evaluación"
              }
            />
            <ReadOnlyField
              label="Donaciones totales"
              value={`${profile?.total_donations ?? 0}`}
            />
            {profile?.penalty_until &&
              new Date(profile.penalty_until) > new Date() && (
                <ReadOnlyField
                  label="Penalización activa hasta"
                  value={new Date(profile.penalty_until).toLocaleDateString(
                    "es-CO",
                  )}
                />
              )}

            {medError && <FeedbackBanner type="error" message={medError} />}
            {medSuccess && (
              <FeedbackBanner
                type="success"
                message="Información médica actualizada."
              />
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={saveMedical}
              disabled={medSaving}
            >
              {medSaving ? "Guardando..." : "Guardar información médica"}
            </Button>
          </div>
        </SettingsSection>

        {/* ── 3. Preferencias ── */}
        <SettingsSection
          id="prefs"
          title="Preferencias"
          icon={<Bell className="w-4 h-4 text-indigo-500" />}
          isOpen={openSection === "prefs"}
          onToggle={() => toggle("prefs")}
        >
          <div className="space-y-3 pt-1">
            <ToggleRow
              label="Notificaciones de donaciones"
              description="Recibe alertas cuando alguien confirme una donación en tus solicitudes."
              value={notifDonations}
              onChange={(v) => {
                setNotifDonations(v);
                localStorage.setItem("notif_donations", String(v));
              }}
            />
            <ToggleRow
              label="Notificaciones de solicitudes"
              description="Recibe alertas de nuevas solicitudes cercanas compatibles con tu tipo de sangre."
              value={notifRequests}
              onChange={(v) => {
                setNotifRequests(v);
                localStorage.setItem("notif_requests", String(v));
              }}
            />
            <ToggleRow
              label="Recordatorios de donaciones pendientes"
              description="Recibe recordatorios para completar donaciones que hayas aceptado."
              value={notifReminders}
              onChange={(v) => {
                setNotifReminders(v);
                localStorage.setItem("notif_reminders", String(v));
              }}
            />
          </div>
        </SettingsSection>

        {/* ── 4. Seguridad y cuenta ── */}
        <SettingsSection
          id="security"
          title="Seguridad y cuenta"
          icon={<Lock className="w-4 h-4 text-emerald-500" />}
          isOpen={openSection === "security"}
          onToggle={() => toggle("security")}
        >
          <div className="space-y-2 pt-1">
            {/* Change password */}
            <div className="bg-app-bg rounded-xl p-3 border border-app-border/15">
              <p className="text-app-text/60 text-xs mb-1">
                Correo registrado:{" "}
                <span className="text-app-text font-medium">
                  {profile?.email ?? "—"}
                </span>
              </p>
              {pwResetSent ? (
                <FeedbackBanner
                  type="success"
                  message="Revisa tu correo para restablecer tu contraseña."
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={handlePasswordReset}
                  disabled={pwResetLoading || !profile?.email}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {pwResetLoading
                    ? "Enviando..."
                    : "Cambiar contraseña por correo"}
                </Button>
              )}
            </div>

            {/* Sign out */}
            <ActionRow
              icon={<LogOut className="w-4 h-4 text-app-text/50" />}
              label="Cerrar sesión"
              onClick={() => setShowSignOut(true)}
            />

            {/* Delete account */}
            <ActionRow
              icon={<Trash2 className="w-4 h-4 text-red-400" />}
              label="Eliminar mi cuenta"
              labelClass="text-red-500 dark:text-red-400"
              onClick={() => setShowDeleteAccount(true)}
            />
          </div>
        </SettingsSection>

        {/* ── 5. Ayuda y soporte ── */}
        <SettingsSection
          id="help"
          title="Ayuda y soporte"
          icon={<HelpCircle className="w-4 h-4 text-sky-500" />}
          isOpen={openSection === "help"}
          onToggle={() => toggle("help")}
        >
          <div className="space-y-3 pt-1">
            {/* Contact */}
            <div className="space-y-2">
              <ActionRow
                icon={<MessageCircle className="w-4 h-4 text-sky-500" />}
                label="Contactar soporte"
                description="soporte@bloodapp.com"
                onClick={() =>
                  window.open("mailto:soporte@bloodapp.com", "_blank")
                }
              />
              <ActionRow
                icon={<FileText className="w-4 h-4 text-sky-500" />}
                label="Términos y condiciones"
                onClick={() => {}}
              />
            </div>

            {/* FAQ */}
            <div>
              <p className="text-app-text/60 text-[10px] font-semibold uppercase tracking-wider mb-2">
                Preguntas frecuentes
              </p>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div
                    key={i}
                    className="bg-app-bg border border-app-border/15 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setOpenFaq((prev) => (prev === i ? null : i))
                      }
                      className="w-full flex items-center justify-between px-3 py-3 text-left"
                    >
                      <span className="text-app-text text-xs font-medium pr-3 leading-relaxed">
                        {faq.q}
                      </span>
                      {openFaq === i ? (
                        <ChevronUp className="w-3.5 h-3.5 text-app-text/40 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-app-text/40 shrink-0" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-3 pb-3">
                        <p className="text-app-text/60 text-xs leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* App version */}
            <p className="text-center text-app-text/30 text-[10px] pt-2">
              BloodApp v1.0.0 · Versión de producción
            </p>
          </div>
        </SettingsSection>
      </div>

      {/* Sign out modal */}
      <Modal
        open={showSignOut}
        onClose={() => setShowSignOut(false)}
        variant="center"
      >
        <div className="text-center px-2">
          <div className="w-14 h-14 rounded-full bg-app-border/10 flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-6 h-6 text-app-text/60" />
          </div>
          <h3 className="text-app-text font-bold text-lg mb-2">
            ¿Cerrar sesión?
          </h3>
          <p className="text-app-text/50 text-sm mb-5">
            Se cerrará tu sesión en este dispositivo.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setShowSignOut(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={handleSignOut}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete account modal */}
      <Modal
        open={showDeleteAccount}
        onClose={() => {
          setShowDeleteAccount(false);
          setDeleteConfirm("");
        }}
        variant="center"
      >
        <div className="text-center px-2">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/30 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-app-text font-bold text-lg mb-2">
            Eliminar cuenta
          </h3>
          <p className="text-app-text/60 text-sm mb-3 leading-relaxed">
            Esta acción es irreversible. Se eliminará todo tu historial de
            donaciones, solicitudes y datos personales.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl p-3 mb-4 text-left">
            <p className="text-red-600 dark:text-red-400 text-xs">
              Escribe <strong>eliminar</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="mt-2 w-full bg-transparent border-b border-red-300 dark:border-red-700/50 text-app-text text-sm outline-none pb-1"
              placeholder="eliminar"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                setShowDeleteAccount(false);
                setDeleteConfirm("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={handleDeleteAccount}
              disabled={deleteConfirm.toLowerCase() !== "eliminar"}
            >
              Eliminar cuenta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SettingsSection({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-app-card border border-app-border/20 dark:border-app-border/8 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 active:bg-app-border/5 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-app-bg flex items-center justify-center shrink-0 border border-app-border/15">
          {icon}
        </div>
        <span className="flex-1 text-left text-sm font-semibold text-app-text">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-app-text/40" />
        ) : (
          <ChevronRight className="w-4 h-4 text-app-text/40" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-app-border/10">{children}</div>
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-app-border/10 last:border-0">
      <span className="text-app-text/55 text-xs">{label}</span>
      <span className="text-app-text text-xs font-medium">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-app-border/10 last:border-0">
      <div className="flex-1">
        <p className="text-app-text text-sm font-medium">{label}</p>
        <p className="text-app-text/45 text-[10px] mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors shrink-0 flex items-center px-1 mt-0.5 ${
          value ? "bg-blood-600" : "bg-app-border/20"
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  description,
  labelClass = "text-app-text",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  labelClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-app-border/5 active:bg-app-border/10 transition-colors"
    >
      <div className="w-7 h-7 rounded-lg bg-app-bg border border-app-border/15 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${labelClass}`}>{label}</p>
        {description && (
          <p className="text-app-text/40 text-[10px]">{description}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-app-text/30" />
    </button>
  );
}

function FeedbackBanner({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-start gap-2 rounded-xl p-3 text-xs border ${
        isSuccess
          ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/30 dark:text-emerald-400"
          : "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      )}
      {message}
    </div>
  );
}

// ─── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "¿Con qué frecuencia puedo donar sangre?",
    a: "Según los estándares médicos, los hombres pueden donar cada 90 días y las mujeres cada 120 días. BloodApp bloquea automáticamente donaciones si detecta una reciente.",
  },
  {
    q: "¿Qué pasa si cancelo una donación que ya acepté?",
    a: "Si cancelas una donación confirmada, tu cuenta quedará penalizada por 30 días. Durante ese tiempo no podrás confirmar nuevas donaciones para proteger la disponibilidad de donantes.",
  },
  {
    q: "¿Cómo se verifica mi tipo de sangre?",
    a: "El tipo de sangre que registraste no es verificado automáticamente. Te recomendamos registrar el dato según tu última prueba médica o carné de donante. En caso de duda, consulta a un profesional de salud.",
  },
  {
    q: "¿Mis datos personales están seguros?",
    a: "Sí. BloodApp almacena tus datos de forma cifrada usando Supabase con autenticación segura. Nunca compartimos tu información con terceros sin tu consentimiento.",
  },
  {
    q: "¿Cómo elimino mi cuenta?",
    a: "Puedes solicitar la eliminación de tu cuenta desde Configuración > Seguridad y cuenta > Eliminar mi cuenta. El proceso es irreversible y elimina todos tus datos del sistema.",
  },
];

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  ChevronRight,
  Settings,
  Shield,
  Award,
  Heart,
  Star,
  BadgeCheck,
  Camera,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import BottomNav from "../components/BottomNav";
import BloodTypeBadge from "../components/BloodTypeBadge";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { useApp } from "../contexts/AppContext";
import { penaltyDaysLeft } from "../lib/utils";

// ─── Profile ───────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { profile, signOut } = useApp();
  const [showSignOut, setShowSignOut] = useState(false);

  const penaltyDays = profile?.penalty_until
    ? penaltyDaysLeft(profile.penalty_until)
    : 0;

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] pb-20 page-enter">
      <PageHeader title="Perfil" />

      <div className="flex-1 overflow-y-auto">
        {/* Cover + avatar */}
        <div className="relative">
          <div className="h-28 bg-gradient-to-br from-blood-900/80 to-[#1a1a2e]" />
          <div className="absolute bottom-0 translate-y-1/2 left-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-[#0f0f0f] bg-[#1a1a2e] flex items-center justify-center overflow-hidden">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    className="w-full h-full object-cover"
                    alt="avatar"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-white">
                    {profile?.full_name?.charAt(0) ?? "?"}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blood-600 flex items-center justify-center border-2 border-[#0f0f0f]">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-14 px-5">
          {/* Name & username */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-extrabold text-xl">
                  {profile?.full_name ?? "Usuario"}
                </h2>
                {profile?.user_type === "professional" && (
                  <BadgeCheck className="w-5 h-5 text-blood-400 shrink-0" />
                )}
              </div>
              <p className="text-white/40 text-sm">
                @{profile?.username ?? "..."}
              </p>
            </div>
            {profile?.blood_type && (
              <BloodTypeBadge type={profile.blood_type} size="md" glow />
            )}
          </div>

          {/* Penalty warning */}
          {penaltyDays > 0 && (
            <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-3 mt-3 flex items-center gap-2 text-amber-400 text-xs">
              <Shield className="w-4 h-4 shrink-0" />
              <span>
                Penalización activa: {penaltyDays} día
                {penaltyDays !== 1 ? "s" : ""} restante
                {penaltyDays !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatCard
              value={profile?.total_donations ?? 0}
              label="Donaciones"
              icon={<Heart className="w-4 h-4 text-blood-400" />}
            />
            <StatCard
              value={profile?.avg_rating?.toFixed(1) ?? "—"}
              label="Valoración"
              icon={<Star className="w-4 h-4 text-amber-400" />}
            />
            <StatCard
              value={profile?.user_type === "professional" ? "Pro" : "Donante"}
              label="Tipo"
              icon={<Award className="w-4 h-4 text-sky-400" />}
            />
          </div>

          {/* Info */}
          <div className="bg-[#1a1a2e] border border-white/8 rounded-2xl p-4 mt-4 space-y-3">
            <InfoRow label="Ciudad" value={profile?.city ?? "—"} />
            <InfoRow label="Tipo de ID" value={profile?.id_type ?? "—"} />
            <InfoRow
              label="Miembro desde"
              value={
                profile?.created_at
                  ? new Date(profile.created_at).getFullYear().toString()
                  : "—"
              }
            />
          </div>

          {/* Menu */}
          <div className="mt-4 space-y-2">
            {profile?.user_type === "donor" && (
              <MenuItem
                icon={<Heart className="w-4 h-4 text-blood-400" />}
                label="Mis solicitudes"
                onClick={() => navigate("/my-requests")}
              />
            )}
            {profile?.user_type === "professional" && (
              <MenuItem
                icon={<Award className="w-4 h-4 text-blood-400" />}
                label="Mis campañas"
                onClick={() => navigate("/my-campaigns")}
              />
            )}
            <MenuItem
              icon={<Settings className="w-4 h-4 text-white/40" />}
              label="Configuración"
              onClick={() => {}}
            />
            <MenuItem
              icon={<LogOut className="w-4 h-4 text-red-400" />}
              label="Cerrar sesión"
              onClick={() => setShowSignOut(true)}
              danger
            />
          </div>
        </div>
      </div>

      <BottomNav />

      <Modal
        open={showSignOut}
        onClose={() => setShowSignOut(false)}
        variant="center"
      >
        <div className="text-center px-2">
          <h3 className="text-white font-bold text-lg mb-2">¿Cerrar sesión?</h3>
          <p className="text-white/50 text-sm mb-5">
            Se cerrará tu sesión en este dispositivo.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
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
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#1a1a2e] border border-white/8 rounded-2xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-white font-bold text-lg leading-none">{value}</p>
      <p className="text-white/30 text-[10px] mt-0.5">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#1a1a2e] border border-white/8 rounded-2xl p-4 active:scale-[0.98] transition-transform"
    >
      {icon}
      <span
        className={`flex-1 text-left text-sm font-medium ${danger ? "text-red-400" : "text-white"}`}
      >
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-white/20" />
    </button>
  );
}

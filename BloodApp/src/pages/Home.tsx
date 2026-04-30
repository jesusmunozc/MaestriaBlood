import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  PlusCircle,
  HandHeart,
  Megaphone,
  Users,
  Heart,
  ClipboardList,
  Stethoscope,
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import BloodTypeBadge from "../components/BloodTypeBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import Card from "../components/Card";
import { useApp } from "../contexts/AppContext";
import { getBloodRequests } from "../lib/blood-requests";
import { getCampaigns } from "../lib/campaigns";
import type { BloodRequest, Campaign } from "../types";
import { timeAgo } from "../lib/utils";

const DONOR_QUICK_ACTIONS = [
  {
    icon: PlusCircle,
    label: "Solicitar\nsangre",
    path: "/create-request",
    color: "text-blood-400 bg-blood-600/15",
  },
  {
    icon: HandHeart,
    label: "Ver\nsolicitudes",
    path: "/explore",
    color: "text-blue-400 bg-blue-600/15",
  },
  {
    icon: Megaphone,
    label: "Campañas",
    path: "/campaigns",
    color: "text-purple-400 bg-purple-600/15",
  },
] as const;

const PRO_QUICK_ACTIONS = [
  {
    icon: PlusCircle,
    label: "Crear\ncampaña",
    path: "/create-campaign",
    color: "text-purple-400 bg-purple-600/15",
  },
  {
    icon: ClipboardList,
    label: "Mis\ncampañas",
    path: "/my-campaigns",
    color: "text-blue-400 bg-blue-600/15",
  },
  {
    icon: HandHeart,
    label: "Ver\nsolicitudes",
    path: "/explore",
    color: "text-emerald-400 bg-emerald-600/15",
  },
  {
    icon: PlusCircle,
    label: "Solicitar\nsangre",
    path: "/create-request",
    color: "text-blood-400 bg-blood-600/15",
  },
] as const;

// ─── Home page — diferencia donante / profesional ────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { profile, unreadCount, refreshNotifications } = useApp();

  const [nearbyRequests, setNearbyRequests] = useState<BloodRequest[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  const isProfessional = profile?.user_type === "professional";

  useEffect(() => {
    async function load() {
      try {
        const [{ data: requests }, { data: campList }] = await Promise.all([
          getBloodRequests(),
          getCampaigns(),
        ]);
        setNearbyRequests(requests.slice(0, 4));
        if (isProfessional) {
          // For professional, separate own campaigns
          setMyCampaigns(campList.slice(0, 2));
        } else {
          setCampaigns(campList.slice(0, 2));
        }
      } catch (e) {
        console.error("[Home] Error cargando datos:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
    refreshNotifications();
  }, [refreshNotifications, isProfessional]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Usuario";
  const quickActions = isProfessional ? PRO_QUICK_ACTIONS : DONOR_QUICK_ACTIONS;

  return (
    <div className="min-h-screen flex flex-col bg-app-bg pb-20 page-enter">
      {/* ── Header ──────────────────────────────────── */}
      <div className="safe-top px-5 py-4 app-header-gradient">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {profile?.profile_image_url && !avatarError ? (
                <img
                  src={profile.profile_image_url}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full object-cover border-2 border-blood-600/50"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blood-600/30 border-2 border-blood-600/50 flex items-center justify-center text-blood-400 font-bold text-base">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
              {isProfessional && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border border-app-bg flex items-center justify-center">
                  <span className="text-[6px] text-white font-bold">PRO</span>
                </div>
              )}
            </div>
            <div>
              <span className="text-app-text/40 text-xs">Hola,</span>
              <h3 className="text-app-text font-semibold text-sm">{firstName}</h3>
            </div>
          </div>

          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2.5 rounded-full bg-app-border/8 border border-app-border/10 active:scale-95 transition-transform"
          >
            <Bell className="w-5 h-5 text-app-text/70" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-blood-600 text-white text-[9px] font-bold flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Badge verificado solo para profesionales */}
        {isProfessional && (
          <div className="mt-2 flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-blue-400 text-xs font-medium">Profesional de Salud Verificado</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">

        {/* ── Tarjeta profesional (stats campañas) ──── */}
        {isProfessional && profile && (
          <div className="relative rounded-3xl overflow-hidden mb-5 p-5 blood-stats-card mt-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-4 translate-x-4" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center shrink-0">
                <Stethoscope className="w-7 h-7 text-blue-400" />
              </div>
              <div className="flex gap-5 flex-1">
                <div className="text-center">
                  <span className="text-2xl font-extrabold blood-stats-value block">
                    {myCampaigns.length}
                  </span>
                  <span className="blood-stats-label text-xs">Campañas</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-extrabold blood-stats-value block">0</span>
                  <span className="blood-stats-label text-xs">Participantes</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-extrabold blood-stats-value block">
                    {profile.total_donations ?? 0}
                  </span>
                  <span className="blood-stats-label text-xs">Donaciones</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tarjeta donante (tipo de sangre) ─────── */}
        {!isProfessional && profile && (
          <div className="relative rounded-3xl overflow-hidden mb-5 p-5 blood-stats-card mt-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blood-600/10 rounded-full blur-3xl -translate-y-4 translate-x-4" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="blood-stats-label text-xs mb-1">Tu tipo de sangre</p>
                <BloodTypeBadge
                  type={profile.blood_type ?? "O+"}
                  size="xl"
                  glow
                />
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <span className="text-2xl font-extrabold blood-stats-value block">
                    {profile.total_donations ?? 0}
                  </span>
                  <span className="blood-stats-label text-xs">Donaciones</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-extrabold blood-stats-value block">
                    {profile.total_donations ?? 0}
                  </span>
                  <span className="blood-stats-label text-xs">Vidas</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick actions ─────────────────────────────── */}
        <div className="mb-5">
          <h3 className="text-app-text font-semibold text-sm mb-3">
            Acciones rápidas
          </h3>
          <div className={`grid gap-3 ${isProfessional ? "grid-cols-2" : "grid-cols-3"}`}>
            {quickActions.map(({ icon: Icon, label, path, color }) => (
              <button
                key={path + label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-app-card dark:bg-[#1a1a2e] border border-app-border/10 active:scale-95 transition-transform"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-app-text/60 text-center font-medium leading-tight whitespace-pre">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mis campañas activas (solo profesional) ── */}
        {isProfessional && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-app-text font-semibold text-sm">
                Mis campañas activas
              </h3>
              <button
                onClick={() => navigate("/my-campaigns")}
                className="text-blood-400 text-xs font-medium"
              >
                Ver todas
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-app-border/5 animate-pulse" />
                ))}
              </div>
            ) : myCampaigns.length === 0 ? (
              <div className="bg-app-card border border-app-border/8 rounded-2xl p-5 text-center">
                <p className="text-app-text/30 text-sm">No tienes campañas activas</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {myCampaigns.map((c) => (
                  <Card
                    key={c.id}
                    onClick={() => navigate(`/campaign/${c.id}`)}
                    className="p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
                        <Megaphone className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-app-text text-sm font-semibold truncate">{c.name}</p>
                          <span className="shrink-0 text-[10px] bg-emerald-600/15 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                            Activa
                          </span>
                        </div>
                        <p className="text-app-text/40 text-xs">{c.institution}</p>
                        <p className="text-app-text/30 text-xs mt-0.5">{c.date}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Solicitudes cercanas (solo donante) ───────── */}
        {!isProfessional && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-app-text font-semibold text-sm">
                Solicitudes cercanas
              </h3>
              <button
                onClick={() => navigate("/explore")}
                className="text-blood-400 text-xs font-medium"
              >
                Ver todas
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : nearbyRequests.length === 0 ? (
              <div className="bg-app-card border border-app-border/8 rounded-2xl p-5 text-center">
                <p className="text-app-text/30 text-sm">
                  No hay solicitudes activas cerca
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {nearbyRequests.map((req) => (
                  <Card
                    key={req.id}
                    onClick={() => navigate(`/request/${req.id}`)}
                    className="p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-10 rounded-full shrink-0 ${
                          req.urgency === "urgent"
                            ? "bg-red-500"
                            : req.urgency === "medium"
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                      />
                      <div className="w-9 h-9 rounded-full bg-app-border/10 flex items-center justify-center text-app-text/60 font-semibold text-sm shrink-0">
                        {req.profile?.full_name?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-app-text text-sm font-medium truncate">
                          {req.profile?.full_name ?? "Usuario"}
                        </p>
                        <p className="text-app-text/40 text-xs">
                          {req.urgency === "urgent"
                            ? "🔴 "
                            : req.urgency === "medium"
                              ? "🟡 "
                              : "🟢 "}
                          {req.health_center}
                        </p>
                      </div>
                      <BloodTypeBadge type={req.blood_type} size="sm" />
                    </div>
                    <p className="text-app-text/30 text-[10px] mt-2 pl-5">
                      {timeAgo(req.created_at)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Campañas próximas (solo donante) ──────────── */}
        {!isProfessional && campaigns.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-app-text font-semibold text-sm">
                Campañas próximas
              </h3>
              <button
                onClick={() => navigate("/campaigns")}
                className="text-blood-400 text-xs font-medium"
              >
                Ver todas
              </button>
            </div>
            {campaigns.map((c) => (
              <Card
                key={c.id}
                onClick={() => navigate(`/campaign/${c.id}`)}
                className="p-4 mb-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blood-600/20 flex items-center justify-center shrink-0">
                    <Megaphone className="w-6 h-6 text-blood-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text text-sm font-semibold truncate">
                      {c.name}
                    </p>
                    <p className="text-app-text/40 text-xs">{c.institution}</p>
                    <p className="text-app-text/30 text-xs mt-0.5">{c.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Community stats ───────────────────────────── */}
        <div className="mb-5 bg-app-card/60 border border-app-border/8 rounded-2xl p-5">
          <h3 className="text-app-text font-semibold text-sm mb-4">
            Nuestra comunidad
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, value: "12,458", label: "Donantes activos" },
              { icon: Heart, value: "3,892", label: "Vidas salvadas" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blood-600/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blood-400" />
                </div>
                <div>
                  <p className="text-app-text font-bold text-base">{value}</p>
                  <p className="text-app-text/40 text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

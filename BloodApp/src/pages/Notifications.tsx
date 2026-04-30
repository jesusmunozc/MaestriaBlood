import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import BottomNav from "../components/BottomNav";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/notifications";
import { useApp } from "../contexts/AppContext";
import type { Notification } from "../types";
import { timeAgo } from "../lib/utils";

// ─── Notifications ─────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const { authUser, refreshNotifications } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser?.id) return;
    getNotifications(authUser.id)
      .then(({ data, error }) => {
        if (error) console.error("[Notifications] Error:", error);
        setNotifications(data);
      })
      .catch((e) => console.error("[Notifications] Excepción:", e))
      .finally(() => setLoading(false));
  }, [authUser?.id]);

  async function handleMarkAll() {
    if (!authUser?.id) return;
    await markAllNotificationsRead(authUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refreshNotifications();
  }

  async function handleRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    refreshNotifications();
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen flex flex-col bg-app-bg pb-20 page-enter">
      <PageHeader
        title="Notificaciones"
        onBack={() => navigate(-1)}
        right={
          unread > 0 ? (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blood-600/20 border border-blood-600/30 text-blood-400 text-xs font-semibold active:scale-95 transition-transform"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar leídas
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-24">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-app-border/5 animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-full bg-app-border/5 flex items-center justify-center mb-4">
              <BellOff className="w-8 h-8 text-app-text/20" />
            </div>
            <p className="text-app-text/30 text-sm">Sin notificaciones</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={() => handleRead(n.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const iconMap: Record<string, string> = {
    new_donor: "🩸",
    donation_confirmed: "✅",
    donation_cancelled: "❌",
    campaign_registered: "📅",
    rating_received: "⭐",
    new_request: "🔔",
  };

  return (
    <div
      onClick={!n.is_read ? onRead : undefined}
      className={`flex items-start gap-3 rounded-2xl p-3.5 transition-all
        ${
          !n.is_read
            ? "bg-blood-900/20 border border-blood-700/20 cursor-pointer active:scale-[0.98]"
            : "bg-app-card border border-app-border/5"
        }`}
    >
      <div className="w-9 h-9 rounded-xl bg-app-border/8 flex items-center justify-center text-base shrink-0">
        {iconMap[n.type] ?? "🔔"}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${n.is_read ? "text-app-text/50" : "text-white font-medium"}`}
        >
          {n.message}
        </p>
        <p className="text-app-text/25 text-[10px] mt-0.5">
          {timeAgo(n.created_at)}
        </p>
      </div>
      {!n.is_read && (
        <div className="w-2 h-2 rounded-full bg-blood-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}

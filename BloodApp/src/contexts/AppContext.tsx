import React, {
  createContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import type { Profile, Notification } from "../types";
import {
  getStoredAuthUser,
  watchAuthState,
  refreshSession,
  signOut as authSignOut,
  type AuthUser,
} from "../lib/auth";
import { supabase } from "../lib/supabase";
import { getUnreadCount, getNotifications } from "../lib/notifications";
import { updateProfile } from "../lib/profiles";

// ─── Context type — ISP: only what consumers need ─────────────────────────────
interface AppContextType {
  /** Currently authenticated user, null if not logged in */
  authUser: AuthUser | null;
  /** Profile shortcut */
  profile: Profile | null;
  /** Unread notification count */
  unreadCount: number;
  /** Latest notifications */
  notifications: Notification[];
  /** Loading state */
  isLoading: boolean;
  /** Current theme */
  theme: "dark" | "light";
  /** Toggle dark/light theme */
  toggleTheme: () => void;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Refresh auth user profile from local storage */
  refreshUser: () => void;
  /** Update local profile immediately (optimistic) */
  updateLocalProfile: (updates: Partial<Profile>) => void;
  /** Refresh notifications */
  refreshNotifications: () => Promise<void>;
}

export type { AppContextType };
export const AppContext = createContext<AppContextType | null>(null);

function getInitialTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem("blood_theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "dark";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const unsubRef = useRef<(() => void) | null>(null);

  // Apply dark class to <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try { localStorage.setItem("blood_theme", theme); } catch {}
  }, [theme]);

  // Apply lila/pro theme class based on user type
  useEffect(() => {
    const root = document.documentElement;
    if (authUser?.profile?.user_type === "professional") {
      root.classList.add("theme-pro");
    } else {
      root.classList.remove("theme-pro");
    }
  }, [authUser?.profile?.user_type]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const refreshNotifications = useCallback(async () => {
    const user = getStoredAuthUser();
    if (!user) return;
    const [{ data: notifs }, count] = await Promise.all([
      getNotifications(user.id),
      getUnreadCount(user.id),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  }, []);

  const refreshUser = useCallback(() => {
    const user = getStoredAuthUser();
    setAuthUser(user);
  }, []);

  const updateLocalProfile = useCallback((updates: Partial<Profile>) => {
    setAuthUser((prev) => {
      if (!prev) return prev;
      const updated: AuthUser = {
        ...prev,
        profile: { ...prev.profile, ...updates },
      };
      localStorage.setItem("blood_auth_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authSignOut();
    } finally {
      setAuthUser(null);
      setUnreadCount(0);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let appStateListener: PluginListenerHandle | null = null;

    // ── 1. Restore stored user immediately so the UI is never blank ──────────
    const stored = getStoredAuthUser();
    if (stored) {
      setAuthUser(stored);
      setIsLoading(false);
      refreshNotifications();
    }

    // ── 2. Watch Supabase auth for authoritative updates ─────────────────────
    // watchAuthState now handles INITIAL_SESSION (null) → callback(null) when
    // there is truly no stored user, so isLoading is cleared immediately.
    const unsub = watchAuthState((user) => {
      setAuthUser(user);
      setIsLoading(false);
      if (user) {
        refreshNotifications();
      }
    });

    unsubRef.current = unsub;

    // ── 3. Safety valve: stop showing the loader after 3 s in any case ───────
    const timer = setTimeout(() => setIsLoading(false), 3000);

    // ── 4. Reconnection recovery ──────────────────────────────────────────────
    // When the device regains network access or the app returns to the
    // foreground, ask Supabase to refresh the stored JWT so autoRefreshToken
    // can do its job even after a long Android background suspension.
    //
    // We use getSession() first (non-destructive) to avoid triggering a
    // network round-trip when the app already has a fresh token.  Only when
    // the token is close to expiry do we refresh it.  refreshSession() itself
    // no longer clears stored user data on failure (see auth.ts), so a flaky
    // network on Android wake-up can no longer silently log the user out.
    async function handleReconnect(forceRefresh = false) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const expiresAt = session.expires_at ?? 0;
          const nowSec = Math.floor(Date.now() / 1000);
          // Refresh if forced (e.g. app resumed) or expiring in the next 10 min.
          if (forceRefresh || expiresAt - nowSec < 600) {
            await refreshSession();
          }
        }
      } catch {
        // Network error — silently ignore, autoRefreshToken will retry
      }
    }

    async function setupNativeLifecycle() {
      if (!Capacitor.isNativePlatform()) return;

      try {
        await supabase.auth.startAutoRefresh();
      } catch {
        // Ignore; fallback reconnect handlers remain active.
      }

      try {
        const listener = await CapApp.addListener(
          "appStateChange",
          ({ isActive }) => {
            void (async () => {
              if (isActive) {
                try {
                  await supabase.auth.startAutoRefresh();
                } catch {}
                await handleReconnect(true);
              } else {
                try {
                  await supabase.auth.stopAutoRefresh();
                } catch {}
              }
            })();
          },
        );

        if (disposed) {
          await listener.remove();
          return;
        }

        appStateListener = listener;
      } catch {
        // Ignore listener registration errors on unsupported environments.
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void handleReconnect();
      }
    }

    function handleOnline() {
      void handleReconnect(true);
    }

    void setupNativeLifecycle();

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      unsub();
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);

      if (appStateListener) {
        void appStateListener.remove();
      }

      if (Capacitor.isNativePlatform()) {
        void supabase.auth.stopAutoRefresh();
      }
    };
  }, [refreshNotifications]);

  const value: AppContextType = {
    authUser,
    profile: authUser?.profile ?? null,
    unreadCount,
    notifications,
    isLoading,
    theme,
    toggleTheme,
    signOut,
    refreshUser,
    updateLocalProfile,
    refreshNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Re-exportar desde el archivo separado para no romper imports existentes
export { useApp } from "./useApp";


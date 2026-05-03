import React, {
  createContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Profile, Notification } from "../types";
import {
  getStoredAuthUser,
  watchAuthState,
  refreshSession,
  signOut as authSignOut,
  type AuthUser,
} from "../lib/auth";
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
    // Try to restore from local storage immediately
    const stored = getStoredAuthUser();
    if (stored) {
      setAuthUser(stored);
      setIsLoading(false);
      refreshNotifications();
    }

    // Then watch Supabase auth state for changes
    const unsub = watchAuthState((user) => {
      setAuthUser(user);
      setIsLoading(false);
      if (user) {
        refreshNotifications();
      }
    });

    unsubRef.current = unsub;

    // Fallback: if no response after 2s, stop loading
    const timer = setTimeout(() => setIsLoading(false), 2000);

    // ── Reconnection recovery ──────────────────────────────────────────────
    // When the device regains network access or the app comes back to the
    // foreground, ask Supabase to re-validate the stored JWT.  If the token
    // was refreshed it re-fires onAuthStateChange which updates the state.
    async function handleReconnect() {
      await refreshSession();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        handleReconnect();
      }
    }

    window.addEventListener("online", handleReconnect);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsub();
      clearTimeout(timer);
      window.removeEventListener("online", handleReconnect);
      document.removeEventListener("visibilitychange", handleVisibility);
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


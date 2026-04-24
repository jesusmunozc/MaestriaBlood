import React, {
  createContext,
  useContext,
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
  /** Sign out */
  signOut: () => Promise<void>;
  /** Refresh auth user profile from local storage */
  refreshUser: () => void;
  /** Update local profile immediately (optimistic) */
  updateLocalProfile: (updates: Partial<Profile>) => void;
  /** Refresh notifications */
  refreshNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

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
    await authSignOut();
    setAuthUser(null);
    setUnreadCount(0);
    setNotifications([]);
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

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [refreshNotifications]);

  const value: AppContextType = {
    authUser,
    profile: authUser?.profile ?? null,
    unreadCount,
    notifications,
    isLoading,
    signOut,
    refreshUser,
    updateLocalProfile,
    refreshNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

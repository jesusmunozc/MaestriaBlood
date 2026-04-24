import { supabase } from "./supabase";
import type { Notification } from "../types";

// ─── Notifications service — SRP: only notification management ────────────────

export async function getNotifications(
  userId: string,
): Promise<{ data: Notification[]; error: string | null }> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { data: [], error: error.message };
  return { data: (data as Notification[]) || [], error: null };
}

export async function markNotificationRead(
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  return { error: error?.message ?? null };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return count ?? 0;
}

export async function createNotification(payload: {
  user_id: string;
  type: Notification["type"];
  title: string;
  message: string;
  related_id?: string;
}): Promise<void> {
  await supabase.from("notifications").insert(payload);
}

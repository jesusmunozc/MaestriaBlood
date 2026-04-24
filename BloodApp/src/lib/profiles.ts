import { supabase } from "./supabase";
import type { Profile } from "../types";

// ─── Profile service — SRP: only profile data retrieval ───────────────────────

export async function getProfileById(
  id: string,
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Profile, error: null };
}

export async function updateProfile(
  id: string,
  updates: Partial<Profile>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function uploadProfileImage(
  userId: string,
  file: Blob,
  fileName: string,
): Promise<{ url: string | null; error: string | null }> {
  const path = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("profile-images")
    .upload(path, file, { upsert: true });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from("profile-images").getPublicUrl(path);

  return { url: data.publicUrl, error: null };
}

export async function checkUsernameTaken(username: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return !!data;
}

import { supabase } from "./supabase";
import type { Rating } from "../types";

// ─── Ratings service — SRP: only rating management ────────────────────────────

export async function submitRating(payload: {
  rater_id: string;
  rated_id: string;
  donation_id?: string;
  stars: number;
  comment?: string;
}): Promise<{ data: Rating | null; error: string | null }> {
  // Check not already rated for this donation
  if (payload.donation_id) {
    const { data: existing } = await supabase
      .from("ratings")
      .select("id")
      .eq("rater_id", payload.rater_id)
      .eq("donation_id", payload.donation_id)
      .maybeSingle();

    if (existing) {
      return { data: null, error: "Ya calificaste esta donación." };
    }
  }

  const { data, error } = await supabase
    .from("ratings")
    .insert(payload)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Update avg_rating on the rated user's profile
  await supabase.rpc("update_user_avg_rating", { uid: payload.rated_id });

  return { data: data as Rating, error: null };
}

export async function getUserRatings(
  userId: string,
): Promise<{ data: Rating[]; error: string | null }> {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("rated_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Rating[]) || [], error: null };
}

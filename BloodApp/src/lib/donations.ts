import { supabase } from "./supabase";
import type { Donation } from "../types";

// ─── Donations service — SRP: only donation management ────────────────────────

export async function confirmDonation(
  donorId: string,
  requestId: string,
): Promise<{ data: Donation | null; error: string | null }> {
  // Check if donor already has an active donation for this request
  const { data: existing } = await supabase
    .from("donations")
    .select("id")
    .eq("donor_id", donorId)
    .eq("request_id", requestId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (existing) {
    return { data: null, error: "Ya confirmaste esta donación." };
  }

  const { data, error } = await supabase
    .from("donations")
    .insert({
      donor_id: donorId,
      request_id: requestId,
      status: "confirmed",
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Increment donors_accepted on blood_request
  await supabase.rpc("increment_donors_accepted", { request_id: requestId });

  return { data: data as Donation, error: null };
}

export async function cancelDonation(
  donationId: string,
  donorId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("donations")
    .update({ status: "cancelled" })
    .eq("id", donationId)
    .eq("donor_id", donorId);

  if (error) return { error: error.message };

  // Apply 30-day penalty
  const penaltyUntil = new Date();
  penaltyUntil.setDate(penaltyUntil.getDate() + 30);

  await supabase
    .from("profiles")
    .update({ penalty_until: penaltyUntil.toISOString() })
    .eq("id", donorId);

  return { error: null };
}

export async function getMyDonations(
  donorId: string,
): Promise<{ data: Donation[]; error: string | null }> {
  const { data, error } = await supabase
    .from("donations")
    .select("*, blood_request:blood_requests(*, profile:profiles(*))")
    .eq("donor_id", donorId)
    .order("confirmed_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Donation[]) || [], error: null };
}

export async function getRequestDonors(
  requestId: string,
): Promise<{ data: Donation[]; error: string | null }> {
  const { data, error } = await supabase
    .from("donations")
    .select("*, donor:profiles(*)")
    .eq("request_id", requestId)
    .neq("status", "cancelled");

  if (error) return { data: [], error: error.message };
  return { data: (data as Donation[]) || [], error: null };
}

export async function checkPenalty(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("penalty_until")
    .eq("id", userId)
    .single();

  if (!data?.penalty_until) return false;
  return new Date(data.penalty_until) > new Date();
}

/** Returns the user's current active (confirmed, not yet completed) donation, if any. */
export async function getActiveDonation(
  donorId: string,
): Promise<{ data: Donation | null; error: string | null }> {
  const { data, error } = await supabase
    .from("donations")
    .select("*, blood_request:blood_requests(*, profile:profiles(*))")
    .eq("donor_id", donorId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: (data as Donation | null), error: null };
}

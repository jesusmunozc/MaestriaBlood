import { supabase } from "./supabase";
import type { Campaign, CampaignRegistration, BloodType } from "../types";

// ─── Campaigns service — SRP: only campaign management ────────────────────────

export interface CreateCampaignPayload {
  organizer_id: string;
  name: string;
  institution?: string;
  location?: string;
  address?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  total_slots?: number;
  available_slots?: number;
  registered_slots?: number;
  blood_types_needed?: BloodType[];
  blood_types?: BloodType[];
  description?: string;
  requirements?: string | string[];
  status?: string;
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<{ data: Campaign | null; error: string | null }> {
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ ...payload, status: "active", registered_slots: 0 })
    .select("*, organizer:profiles(*)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Campaign, error: null };
}

export async function getCampaigns(filters?: {
  status?: string;
}): Promise<{ data: Campaign[]; error: string | null }> {
  let query = supabase
    .from("campaigns")
    .select("*, organizer:profiles(*)")
    .eq("status", "active")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: (data as Campaign[]) || [], error: null };
}

export async function getCampaignById(
  id: string,
): Promise<{ data: Campaign | null; error: string | null }> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, organizer:profiles(*)")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Campaign, error: null };
}

export async function getOrganizerCampaigns(
  organizerId: string,
): Promise<{ data: Campaign[]; error: string | null }> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("date", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Campaign[]) || [], error: null };
}

export async function registerForCampaign(
  userId: string,
  campaignId: string,
): Promise<{ data: CampaignRegistration | null; error: string | null }> {
  // Check if already registered
  const { data: existing } = await supabase
    .from("campaign_registrations")
    .select("id, status")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (existing && existing.status !== "cancelled") {
    return {
      data: null,
      error: "Ya tienes un cupo reservado para esta campaña.",
    };
  }

  const { data, error } = await supabase
    .from("campaign_registrations")
    .upsert({
      user_id: userId,
      campaign_id: campaignId,
      status: "registered",
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Increment registered_slots
  await supabase.rpc("increment_registered_slots", { campaign_id: campaignId });

  return { data: data as CampaignRegistration, error: null };
}

export async function cancelCampaignRegistration(
  userId: string,
  campaignId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("campaign_registrations")
    .update({ status: "cancelled" })
    .eq("user_id", userId)
    .eq("campaign_id", campaignId);

  return { error: error?.message ?? null };
}

export async function getUserCampaignRegistration(
  userId: string,
  campaignId: string,
): Promise<CampaignRegistration | null> {
  const { data } = await supabase
    .from("campaign_registrations")
    .select("*")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  return data as CampaignRegistration | null;
}

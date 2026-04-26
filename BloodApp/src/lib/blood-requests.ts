import { supabase } from "./supabase";
import type { BloodRequest, Urgency, BloodType } from "../types";

// ─── Blood Requests service — SRP: only blood request CRUD ────────────────────

export interface CreateRequestPayload {
  requester_id?: string;
  user_id?: string;
  blood_type: BloodType;
  units_needed: number;
  donors_needed?: number;
  donors_accepted?: number;
  urgency: Urgency;
  health_center: string;
  address?: string;
  message?: string;
  status?: string;
}

export async function createBloodRequest(
  payload: CreateRequestPayload,
): Promise<{ data: BloodRequest | null; error: string | null }> {
  const { data, error } = await supabase
    .from("blood_requests")
    .insert({
      ...payload,
      status: payload.status ?? "open",
      donors_accepted: 0,
    })
    .select("*, profile:profiles(*)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as BloodRequest, error: null };
}

export async function getBloodRequests(filters?: {
  urgency?: Urgency;
  blood_type?: BloodType;
  status?: string;
}): Promise<{ data: BloodRequest[]; error: string | null }> {
  let query = supabase
    .from("blood_requests")
    .select("*, profile:profiles(*)")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (filters?.urgency) query = query.eq("urgency", filters.urgency);
  if (filters?.blood_type) query = query.eq("blood_type", filters.blood_type);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: (data as BloodRequest[]) || [], error: null };
}

export async function getBloodRequestById(
  id: string,
): Promise<{ data: BloodRequest | null; error: string | null }> {
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*, profile:profiles(*)")
    .eq("id", id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as BloodRequest, error: null };
}

export async function getUserRequests(
  userId: string,
): Promise<{ data: BloodRequest[]; error: string | null }> {
  const { data, error } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as BloodRequest[]) || [], error: null };
}

export async function cancelBloodRequest(
  id: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("blood_requests")
    .update({ status: "cancelled" })
    .eq("id", id);

  return { error: error?.message ?? null };
}

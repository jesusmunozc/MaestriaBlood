// ─── Blood types ──────────────────────────────────────────────────────────────
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export const BLOOD_TYPES: BloodType[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

// Blood compatibility map: key can donate to values[]
export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// ─── ID types ──────────────────────────────────────────────────────────────────
export type IdType = "CC" | "TI" | "CE" | "PA" | "NIT";
export const ID_TYPES: { value: IdType; label: string }[] = [
  { value: "CC", label: "CC — Cédula de Ciudadanía" },
  { value: "TI", label: "TI — Tarjeta de Identidad" },
  { value: "CE", label: "CE — Cédula de Extranjería" },
  { value: "PA", label: "PA — Pasaporte" },
  { value: "NIT", label: "NIT" },
];

// ─── User types ────────────────────────────────────────────────────────────────
export type UserType = "donor" | "professional";

// ─── Profile ───────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  username: string;
  full_name: string;
  blood_type?: BloodType;
  id_type?: IdType;
  id_number?: string;
  birth_date?: string;
  city?: string;
  address?: string;
  profile_image_url?: string | null;
  avatar_url?: string | null;
  front_doc_url?: string | null;
  back_doc_url?: string | null;
  user_type?: UserType;
  is_verified?: boolean;
  total_donations?: number;
  donations_count?: number;
  avg_rating?: number;
  penalty_until?: string | null;
  survey_done?: boolean;
  aptitude_survey?: AptitudeSurveyAnswers | null;
  created_at?: string;
}

// ─── Registration data ─────────────────────────────────────────────────────────
export interface RegisterStep1 {
  user_type: UserType;
  full_name: string;
  birth_date: string;
  blood_type: BloodType;
  id_type: IdType;
  id_number: string;
}

export interface RegisterStep2 {
  front_doc_url: string;
  back_doc_url: string;
  avatar_url: string;
  city: string;
  address: string;
}

export interface RegisterStep3 {
  username: string;
  password: string;
  terms_accepted: boolean;
  donation_commitment: boolean;
}

// ─── Aptitude survey ──────────────────────────────────────────────────────────
export interface AptitudeSurveyAnswers {
  q1_age_range: boolean; // 18-65 years
  q2_weight: boolean; // >50 kg
  q3_recent_donation: boolean; // donated in last 3 months (true = disqualifying)
  q4_infectious: boolean; // infectious disease (true = disqualifying)
  q5_medication: boolean; // on medication (true = disqualifying)
  q6_vaccine: boolean; // vaccine in last 4 weeks (true = disqualifying)
  q7_risk_behavior: boolean; // risky behavior last 12 months (true = disqualifying)
  q8_good_health: boolean; // in good health
}

// ─── Urgency ───────────────────────────────────────────────────────────────────
export type Urgency = "low" | "medium" | "urgent";

// ─── Blood request ─────────────────────────────────────────────────────────────
export type RequestStatus = "open" | "completed" | "cancelled";

export interface BloodRequest {
  id: string;
  requester_id: string;
  user_id?: string;
  blood_type: BloodType;
  units_needed: number;
  donors_needed: number;
  donors_accepted: number;
  urgency: Urgency;
  health_center: string;
  address?: string | null;
  message?: string | null;
  status: RequestStatus;
  created_at: string;
  // joined
  profile?: Profile;
}

// ─── Donation ──────────────────────────────────────────────────────────────────
export type DonationStatus = "confirmed" | "completed" | "cancelled";

export interface Donation {
  id: string;
  donor_id: string;
  request_id: string;
  status: DonationStatus;
  confirmed_at: string;
  completed_at: string | null;
  // joined
  blood_request?: BloodRequest;
  donor?: Profile;
}

// ─── Campaign ──────────────────────────────────────────────────────────────────
export type CampaignStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface Campaign {
  id: string;
  organizer_id: string;
  name: string;
  institution?: string;
  location: string;
  address?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  total_slots: number;
  registered_slots: number;
  blood_types_needed?: BloodType[];
  blood_types?: BloodType[];
  description?: string | null;
  requirements?: string | null;
  status: CampaignStatus;
  created_at: string;
  // joined
  profile?: Profile;
  organizer?: Profile;
}

// ─── Campaign registration ────────────────────────────────────────────────────
export type RegistrationStatus = "registered" | "attended" | "cancelled";

export interface CampaignRegistration {
  id: string;
  user_id: string;
  campaign_id: string;
  status: RegistrationStatus;
  registered_at: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | "new_donor"
  | "donation_confirmed"
  | "donation_cancelled"
  | "campaign_registered"
  | "rating_received"
  | "new_request"
  | "system"
  | "penalty";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  related_id?: string | null;
  created_at: string;
}

// ─── Rating ────────────────────────────────────────────────────────────────────
export interface Rating {
  id: string;
  rater_id: string;
  rated_id: string;
  donation_id: string | null;
  stars: number;
  comment: string | null;
  created_at: string;
}

// ─── App state ─────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
  profile: Profile;
}

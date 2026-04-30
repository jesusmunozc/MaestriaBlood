import { supabase } from "./supabase";
import type { Session } from "./supabase";
import type {
  Profile,
  RegisterStep1,
  RegisterStep2,
  RegisterStep3,
} from "../types";

// ─── Auth service — SRP: only authentication responsibilities ─────────────────

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

const AUTH_USER_KEY = "blood_auth_user";

export function getStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function storeAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearStoredAuthUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}

// ─── Sign in ───────────────────────────────────────────────────────────────────
export async function signIn(
  usernameOrEmail: string,
  password: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  // Allow both email and username login
  let email = usernameOrEmail;

  // If it doesn't look like an email, verify the username exists and build the email
  if (!usernameOrEmail.includes("@")) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", usernameOrEmail)
      .single();

    if (error || !data) {
      return { user: null, error: "Usuario no encontrado." };
    }

    // Email is always username@bloodapp.com
    email = `${usernameOrEmail}@bloodapp.com`;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      user: null,
      error:
        error.message === "Invalid login credentials"
          ? "Contraseña incorrecta."
          : error.message,
    };
  }

  if (!data.user) {
    return { user: null, error: "Error al iniciar sesión." };
  }

  // Load profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, error: "No se encontró el perfil del usuario." };
  }

  const authUser: AuthUser = {
    id: data.user.id,
    email: data.user.email!,
    profile: profile as Profile,
  };

  storeAuthUser(authUser);
  return { user: authUser, error: null };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function registerUser(
  step1: RegisterStep1,
  step2: RegisterStep2,
  step3: RegisterStep3,
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!step3.terms_accepted || !step3.donation_commitment) {
    return {
      user: null,
      error: "Debes aceptar los términos y el compromiso de donación.",
    };
  }

  // Use username@bloodapp.com as the internal email
  const email = `${step3.username}@bloodapp.com`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: step3.password,
    options: {
      data: {
        full_name: step1.full_name,
        username: step3.username,
      },
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already been registered")
    ) {
      return { user: null, error: "El nombre de usuario ya está en uso." };
    }
    return { user: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, error: "Error al crear la cuenta." };
  }

  // ── Build profile payload (used by both insertion paths)
  const profilePayload: Partial<Profile> = {
    id: data.user.id,
    username: step3.username,
    full_name: step1.full_name,
    blood_type: step1.blood_type,
    id_type: step1.id_type,
    id_number: step1.id_number,
    birth_date: step1.birth_date,
    city: step2.city,
    address: step2.address,
    profile_image_url: step2.avatar_url || null,
    front_doc_url: step2.front_doc_url || null,
    back_doc_url: step2.back_doc_url || null,
    user_type: step1.user_type,
    total_donations: 0,
    avg_rating: 0,
    penalty_until: null,
    survey_done: false,
  };

  // ── Path 1: SECURITY DEFINER RPC — works even without an active session
  //    (required when Supabase email confirmation is enabled, because
  //    auth.uid() is NULL until the user confirms their email)
  const { error: profileError } = await supabase.rpc("create_user_profile", {
    p_id: data.user.id,
    p_username: step3.username,
    p_full_name: step1.full_name,
    p_blood_type: step1.blood_type ?? null,
    p_id_type: step1.id_type ?? null,
    p_id_number: step1.id_number ?? null,
    p_birth_date: step1.birth_date ?? null,
    p_city: step2.city ?? null,
    p_address: step2.address ?? null,
    // avatar_url from the form maps to profile_image_url in the DB
    p_profile_image_url: step2.avatar_url || null,
    p_front_doc_url: step2.front_doc_url || null,
    p_back_doc_url: step2.back_doc_url || null,
    p_user_type: step1.user_type,
  });

  if (profileError) {
    // ── Path 2 fallback: direct INSERT when:
    //    a) email confirmation is DISABLED (session is returned immediately)
    //    b) the SECURITY DEFINER function hasn't been created yet
    const rpcMissing =
      profileError.message.toLowerCase().includes("could not find") ||
      profileError.message.toLowerCase().includes("does not exist") ||
      profileError.code === "PGRST202";

    if (rpcMissing && data.session) {
      // We have a live session → auth.uid() is set → RLS allows the INSERT
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: step3.username,
        full_name: step1.full_name,
        blood_type: step1.blood_type ?? null,
        id_type: step1.id_type ?? null,
        id_number: step1.id_number ?? null,
        birth_date: step1.birth_date ?? null,
        city: step2.city ?? null,
        address: step2.address ?? null,
        profile_image_url: step2.avatar_url || null,
        front_doc_url: step2.front_doc_url || null,
        back_doc_url: step2.back_doc_url || null,
        user_type: step1.user_type,
        total_donations: 0,
        avg_rating: 0,
      });

      if (insertError) {
        return {
          user: null,
          error: insertError.message.toLowerCase().includes("unique")
            ? "El nombre de usuario ya está en uso."
            : `Error al crear el perfil: ${insertError.message}`,
        };
      }
    } else if (rpcMissing && !data.session) {
      // Function missing AND no session → cannot create profile.
      // → Either disable email confirmation in Supabase Auth settings,
      //   or run the SQL in the file supabase/migrations/001_fix_profiles.sql
      return {
        user: null,
        error:
          "Configuración pendiente: desactiva la confirmación de email en Supabase (Auth → Providers → Email → desactivar 'Confirm email') o crea la función create_user_profile desde el SQL Editor.",
      };
    } else {
      return {
        user: null,
        error: profileError.message.toLowerCase().includes("unique")
          ? "El nombre de usuario ya está en uso."
          : `Error al crear el perfil: ${profileError.message}`,
      };
    }
  }

  // If Supabase returned a session (email confirmation disabled), store it.
  // Otherwise the user will need to confirm their email before logging in.
  if (data.session) {
    const authUser: AuthUser = {
      id: data.user.id,
      email,
      profile: profilePayload as Profile,
    };
    storeAuthUser(authUser);
    return { user: authUser, error: null };
  }

  // No session → email confirmation is required; profile was created via RPC
  return { user: null, error: null };
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  clearStoredAuthUser();
  await supabase.auth.signOut();
}

// ─── Watch auth state ─────────────────────────────────────────────────────────
export function watchAuthState(
  callback: (user: AuthUser | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    async (_event: string, session: Session | null) => {
      if (!session?.user) {
        clearStoredAuthUser();
        callback(null);
        return;
      }

      // On session restore, load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          profile: profile as Profile,
        };
        storeAuthUser(authUser);
        callback(authUser);
      } else {
        callback(null);
      }
    },
  );

  return () => subscription.unsubscribe();
}

// ─── Update profile ───────────────────────────────────────────────────────────
export async function updateProfile(
  id: string,
  updates: Partial<Profile>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  // Refresh local storage
  const stored = getStoredAuthUser();
  if (stored) {
    stored.profile = { ...stored.profile, ...updates };
    storeAuthUser(stored);
  }
  return { error: null };
}

// ─── Save aptitude survey ─────────────────────────────────────────────────────
// Persists only the derived result fields that exist in the DB schema.
export async function saveAptitudeSurvey(
  userId: string,
  answers: import("../types").AptitudeSurveyAnswers,
): Promise<{ error: string | null }> {
  const { evaluateAptitude } = await import("./utils");
  const result = evaluateAptitude(answers);
  return updateProfile(userId, {
    survey_done: true,
    aptitude_eligible: result.isEligible,
  });
}

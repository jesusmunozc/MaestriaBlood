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
const AUTH_TIMEOUT_MS = 20000;

function withTimeout<T>(promiseLike: PromiseLike<T>, timeoutMs = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const promise = Promise.resolve(promiseLike);

    const timer = window.setTimeout(() => {
      reject(new Error("AUTH_TIMEOUT"));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function getTimeoutMessage(): string {
  return "La conexión tardó demasiado. Revisa tu internet e inténtalo de nuevo.";
}

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
  try {
    // Allow both email and username login
    let email = usernameOrEmail;

    // If it doesn't look like an email, look up the real email from the profile
    if (!usernameOrEmail.includes("@")) {
      const { data, error } = await withTimeout(
        supabase
          .from("profiles")
          .select("email")
          .eq("username", usernameOrEmail)
          .single(),
      );

      if (error || !data?.email) {
        return { user: null, error: "Usuario no encontrado." };
      }

      // Use the real email stored in the profile
      email = data.email;
    }

    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
    );

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
    const { data: profile, error: profileError } = await withTimeout(
      supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single(),
    );

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
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_TIMEOUT") {
      return { user: null, error: getTimeoutMessage() };
    }
    return {
      user: null,
      error: "No fue posible iniciar sesión en este momento. Intenta nuevamente.",
    };
  }
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

  // Use the real email for Supabase Auth so password reset emails arrive correctly
  const email = step3.email.trim().toLowerCase();

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password: step3.password,
        options: {
          data: {
            full_name: step1.full_name,
            username: step3.username,
          },
        },
      }),
    );

    if (error) {
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("user already registered")
      ) {
        return { user: null, error: "El correo electrónico ya está registrado." };
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
      email: step3.email,
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
    const { error: profileError } = await withTimeout(
      supabase.rpc("create_user_profile", {
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
        p_email: step3.email || null,
      }),
    );

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
        const { error: insertError } = await withTimeout(
          supabase.from("profiles").insert({
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
            email: step3.email || null,
            total_donations: 0,
            avg_rating: 0,
          }),
        );

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
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_TIMEOUT") {
      return { user: null, error: getTimeoutMessage() };
    }
    return {
      user: null,
      error: "No fue posible completar el registro. Intenta nuevamente.",
    };
  }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
// Use scope:'local' so the session is cleared from localStorage immediately
// without waiting for a server round-trip.  This prevents the button from
// appearing "stuck" when the network is slow or unavailable.

// Flag so watchAuthState can distinguish explicit sign-outs from token errors
let _isExplicitSignOut = false;

export async function signOut(): Promise<void> {
  _isExplicitSignOut = true;
  clearStoredAuthUser();
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Local session is already cleared; ignore any server-side error.
  } finally {
    _isExplicitSignOut = false;
  }
}

// ─── Watch auth state ─────────────────────────────────────────────────────────
async function buildAuthUserFromSession(session: Session): Promise<AuthUser | null> {
  try {
    const { data: profile } = await withTimeout(
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single(),
    );

    if (profile) {
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        profile: profile as Profile,
      };
      storeAuthUser(authUser);
      return authUser;
    }
  } catch {
    // Fall through to stored fallback
  }

  const stored = getStoredAuthUser();
  if (stored?.id === session.user.id) {
    return stored;
  }

  return null;
}

export function watchAuthState(
  callback: (user: AuthUser | null) => void,
): () => void {
  let eventVersion = 0;

  async function handleAuthEvent(event: string, session: Session | null): Promise<void> {
    // PASSWORD_RECOVERY: Supabase fires this when the user follows a
    // password-reset link.  It's a temporary, limited-privilege session;
    // ForgotPassword.tsx manages it directly.  We must NOT write it to
    // persistent storage or it will masquerade as a normal login.
    if (event === "PASSWORD_RECOVERY") return;

    // Only clear state immediately on an explicit sign-out triggered by the user.
    // For non-explicit SIGNED_OUT we re-check getSession() before deciding.
    if (event === "SIGNED_OUT") {
      if (_isExplicitSignOut) {
        clearStoredAuthUser();
        callback(null);
        return;
      }

      const version = ++eventVersion;

      try {
        const {
          data: { session: latestSession },
        } = await withTimeout(supabase.auth.getSession());

        if (version !== eventVersion) return;
        if (!latestSession?.user) {
          clearStoredAuthUser();
          callback(null);
        }
      } catch {
        // Network/transient issue: keep local state and let auto refresh retry.
      }

      return;
    }

    // INITIAL_SESSION with null is authoritative for local storage state.
    if (event === "INITIAL_SESSION" && !session?.user) {
      clearStoredAuthUser();
      callback(null);
      return;
    }

    // No active session and it's not a handled event → no-op.
    if (!session?.user) return;

    const version = ++eventVersion;
    const resolvedUser = await buildAuthUserFromSession(session);

    if (version !== eventVersion) return;

    if (resolvedUser) {
      callback(resolvedUser);
      return;
    }

    clearStoredAuthUser();
    callback(null);
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
    // Avoid returning a Promise directly from onAuthStateChange callback.
    void handleAuthEvent(event, session);
  });

  return () => subscription.unsubscribe();
}

// ─── Refresh session ──────────────────────────────────────────────────────────
// Call this when the app comes back online / returns to the foreground.
// Asks Supabase to re-validate the stored JWT and re-fires onAuthStateChange
// if the token was refreshed successfully.
//
// IMPORTANT: we deliberately do NOT call clearStoredAuthUser() on failure.
// A failed refresh almost always means a transient network error on Android
// (the WebView reconnects slower than the JS timer fires after resume).
// Clearing stored data here + a later INITIAL_SESSION with null = silent
// logout.  Genuine session expiry is handled separately: Supabase fires
// SIGNED_OUT after a confirmed 400/401 from the auth server, which the
// watchAuthState handler propagates only for explicit sign-outs.
export async function refreshSession(): Promise<void> {
  try {
    await withTimeout(supabase.auth.refreshSession());
  } catch {
    // Network error during refresh — ignore, autoRefreshToken will retry.
  }
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

// ─── Send password reset ───────────────────────────────────────────────────────
// Supabase Auth ahora guarda el correo real del usuario, por lo que
// resetPasswordForEmail envía el enlace directamente sin Edge Functions.
// Siempre retorna éxito para evitar enumeración de emails.
//
// redirectTo strategy:
//   • Web / Vite dev server  → window.location.origin is e.g. http://localhost:5173
//     → works fine, Supabase sends the magic link back to the same origin.
//   • Capacitor production build → origin is https://localhost (the WebView).
//     Sending that as redirectTo would make the email link open Chrome at
//     https://localhost which no external browser can reach.  In that case we
//     omit redirectTo and let Supabase use the Site URL configured in the
//     Auth dashboard (which should be your production web deployment).
export async function sendPasswordReset(
  realEmail: string,
): Promise<{ error: string | null }> {
  try {
    const configuredRedirect =
      (import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined)?.trim() ||
      null;

    const origin = window.location.origin;
    const isCapacitorOrigin =
      origin === "https://localhost" ||
      origin === "http://localhost" ||
      origin.startsWith("capacitor://");

    const redirectTo = configuredRedirect
      ? configuredRedirect
      : isCapacitorOrigin
        ? undefined // use the Site URL set in Supabase Auth dashboard
        : `${origin}/forgot-password`;

    await withTimeout(
      supabase.auth.resetPasswordForEmail(realEmail.trim().toLowerCase(), {
        redirectTo,
      }),
    );

    return { error: null };
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_TIMEOUT") {
      return { error: getTimeoutMessage() };
    }
    return {
      error: "No fue posible enviar el correo de recuperación. Intenta nuevamente.",
    };
  }
}

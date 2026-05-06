import { createClient } from "@supabase/supabase-js";
import { authStorage } from "./auth-storage";

// These env vars must be set in a .env file at the root of BloodApp:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[BloodApp] Supabase env vars not set. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export type { Session } from "@supabase/supabase-js";

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      // Keep the session alive between page loads / app restores
      persistSession: true,
      // Use Capacitor Preferences on native builds and localStorage on web.
      storage: authStorage,
      // Automatically refresh the JWT before it expires
      autoRefreshToken: true,
      // Use implicit flow instead of PKCE so that password-reset links work
      // from any browser or device.  PKCE stores a code-verifier in the
      // *requesting* browser's sessionStorage; if the user clicks the email
      // link in a different tab / browser / email client (which is the common
      // case on Android), that verifier is gone and exchangeCodeForSession
      // fails silently.  With implicit flow, Supabase embeds the tokens
      // directly in the URL hash — no verifier needed anywhere.
      flowType: "implicit",
      // false: don't let Supabase parse the URL automatically — ForgotPassword.tsx
      // reads the hash/query params manually for full timing control.
      detectSessionInUrl: false,
      // Dedicated storage key so it doesn't clash with other libs
      storageKey: "blood_supabase_auth",
    },
    global: {
      // Surface connection errors in the console for easier debugging
      headers: { "x-application-name": "blood-app" },
    },
  },
);

export const isSupabaseConfigured =
  !!supabaseUrl && supabaseUrl !== "https://placeholder.supabase.co";

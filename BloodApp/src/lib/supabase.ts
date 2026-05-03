import { createClient } from "@supabase/supabase-js";

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
      // Automatically refresh the JWT before it expires
      autoRefreshToken: true,
      // false: no consumir el ?code= automáticamente — ForgotPassword.tsx
      // lo intercambia manualmente para tener control total del timing.
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

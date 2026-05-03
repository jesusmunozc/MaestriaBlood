// supabase/functions/send-password-reset/index.ts
// Deploys as: supabase functions deploy send-password-reset
//
// No secrets extra necesarios — usa el sistema de email nativo de Supabase.
// El email de recuperación usa la plantilla configurada en:
//   Supabase Dashboard → Authentication → Email Templates → Reset Password
//
// Variables de entorno disponibles automáticamente en Edge Functions:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// Estrategia:
//   Como el email de auth interno es "username@bloodapp.com" (no el real del usuario),
//   esta función:
//     1. Busca el perfil por el email real para obtener el user ID.
//     2. Actualiza temporalmente el email de auth al email real (confirmado, sin verificación).
//     3. Llama a resetPasswordForEmail — Supabase envía el correo al email real.
//     4. Restaura el email interno siempre (bloque finally).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, redirectTo } = body as {
      email?: string;
      redirectTo?: string;
    };

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Se requiere el campo email." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Admin client (service role — nunca expuesto al navegador) ──────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const realEmail = email.trim().toLowerCase();
    const finalRedirectTo =
      redirectTo ??
      `${Deno.env.get("SITE_URL") ?? "http://localhost:5173"}/reset-password`;

    // ── 1. Buscar perfil por email real (id = auth user id) ────────────────────
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("email", realEmail)
      .maybeSingle();

    if (profile?.id && profile?.username) {
      const internalEmail = `${profile.username}@bloodapp.com`;

      try {
        // ── 2. Cambiar email de auth al email real (email_confirm:true evita
        //       que Supabase envíe un correo de verificación) ──────────────────
        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(profile.id, {
            email: realEmail,
            email_confirm: true,
          });

        if (updateError) {
          console.error(
            "[send-password-reset] updateUserById error:",
            updateError,
          );
        } else {
          // ── 3. Enviar correo de recuperación vía el sistema nativo de Supabase
          const { error: resetError } =
            await supabaseAdmin.auth.resetPasswordForEmail(realEmail, {
              redirectTo: finalRedirectTo,
            });

          if (resetError) {
            console.error(
              "[send-password-reset] resetPasswordForEmail error:",
              resetError,
            );
          }
        }
      } finally {
        // ── 4. Restaurar siempre el email interno para que el login siga
        //       funcionando con username@bloodapp.com ──────────────────────────
        const { error: restoreError } =
          await supabaseAdmin.auth.admin.updateUserById(profile.id, {
            email: internalEmail,
            email_confirm: true,
          });

        if (restoreError) {
          console.error(
            "[send-password-reset] restore email error:",
            restoreError,
          );
        }
      }
    }

    // Siempre responder 200 para evitar enumeración de emails
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-password-reset] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

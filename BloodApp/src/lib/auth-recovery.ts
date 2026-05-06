import { supabase } from "./supabase";

export type RecoveryPayload =
  | {
      kind: "session";
      accessToken: string;
      refreshToken: string;
    }
  | {
      kind: "pkce";
      code: string;
    }
  | {
      kind: "token_hash";
      tokenHash: string;
    };

export interface ParsedRecoveryLink {
  payload: RecoveryPayload | null;
  error: string | null;
  hadRecoveryHint: boolean;
  shouldSanitizeUrl: boolean;
}

function normalizeType(
  hashParams: URLSearchParams,
  queryParams: URLSearchParams,
): string | null {
  return hashParams.get("type") ?? queryParams.get("type");
}

function decodeMessage(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

export function extractRecoveryPayloadFromLocation(
  location: Location = window.location,
): ParsedRecoveryLink {
  const hashParams = new URLSearchParams(
    location.hash ? location.hash.substring(1) : "",
  );
  const queryParams = new URLSearchParams(location.search);

  const type = normalizeType(hashParams, queryParams);

  const accessToken =
    hashParams.get("access_token") ?? queryParams.get("access_token");
  const refreshToken =
    hashParams.get("refresh_token") ?? queryParams.get("refresh_token");
  const code = queryParams.get("code");
  const tokenHash = queryParams.get("token_hash") ?? queryParams.get("token");

  const hasAuthParams =
    !!accessToken ||
    !!refreshToken ||
    !!code ||
    !!tokenHash ||
    !!type ||
    !!hashParams.get("error") ||
    !!queryParams.get("error") ||
    !!hashParams.get("error_description") ||
    !!queryParams.get("error_description");

  const hadRecoveryHint =
    type === "recovery" || !!accessToken || !!refreshToken || !!tokenHash;

  const authError = hashParams.get("error") ?? queryParams.get("error");
  if (authError) {
    const detailedMessage = decodeMessage(
      hashParams.get("error_description") ?? queryParams.get("error_description"),
    );

    return {
      payload: null,
      error:
        detailedMessage ??
        "El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo.",
      hadRecoveryHint,
      shouldSanitizeUrl: hasAuthParams,
    };
  }

  if (accessToken && refreshToken && (!type || type === "recovery")) {
    return {
      payload: {
        kind: "session",
        accessToken,
        refreshToken,
      },
      error: null,
      hadRecoveryHint,
      shouldSanitizeUrl: hasAuthParams,
    };
  }

  if (code && (!type || type === "recovery")) {
    return {
      payload: {
        kind: "pkce",
        code,
      },
      error: null,
      hadRecoveryHint,
      shouldSanitizeUrl: hasAuthParams,
    };
  }

  if (tokenHash && (!type || type === "recovery")) {
    return {
      payload: {
        kind: "token_hash",
        tokenHash,
      },
      error: null,
      hadRecoveryHint,
      shouldSanitizeUrl: hasAuthParams,
    };
  }

  return {
    payload: null,
    error: null,
    hadRecoveryHint,
    shouldSanitizeUrl: hasAuthParams,
  };
}

export async function establishRecoverySession(
  payload: RecoveryPayload,
): Promise<{ error: Error | null }> {
  if (payload.kind === "session") {
    const { error } = await supabase.auth.setSession({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken,
    });

    return { error };
  }

  if (payload.kind === "pkce") {
    const { error } = await supabase.auth.exchangeCodeForSession(payload.code);
    return { error };
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: payload.tokenHash,
    type: "recovery",
  });

  return { error };
}

export function sanitizeRecoveryUrl(
  location: Location = window.location,
): void {
  window.history.replaceState({}, document.title, location.pathname);
}

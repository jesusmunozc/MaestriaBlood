import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { SupportedStorage } from "@supabase/supabase-js";

const NATIVE_KEY_PREFIX = "bloodapp_auth:";

function buildNativeKey(key: string): string {
  return `${NATIVE_KEY_PREFIX}${key}`;
}

function getWebItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setWebItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore write failures (private mode, quota exceeded, etc.)
  }
}

function removeWebItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore removal failures
  }
}

export const authStorage: SupportedStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return getWebItem(key);
    }

    const nativeKey = buildNativeKey(key);
    const { value } = await Preferences.get({ key: nativeKey });

    if (value !== null) {
      return value;
    }

    // One-time migration path: preserve existing sessions that were saved in
    // localStorage before moving to Capacitor Preferences.
    const legacyValue = getWebItem(key);
    if (legacyValue !== null) {
      await Preferences.set({ key: nativeKey, value: legacyValue });
      removeWebItem(key);
    }

    return legacyValue;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      setWebItem(key, value);
      return;
    }

    await Preferences.set({ key: buildNativeKey(key), value });
  },

  async removeItem(key: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      removeWebItem(key);
      return;
    }

    await Preferences.remove({ key: buildNativeKey(key) });
  },
};

import type { CapacitorConfig } from "@capacitor/cli";

// For live-reload development with Android emulator:
//   set DEV=true (see package.json dev:android script)
// The emulator accesses the host machine at 10.0.2.2
const isDev = process.env.DEV === "true";

const config: CapacitorConfig = {
  appId: "com.apolocode.bloodapp",
  appName: "!Blood",
  webDir: "dist",
  server: isDev
    ? {
        url: "http://10.0.2.2:5173",
        cleartext: true,
      }
    : {
        androidScheme: "https",
      },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    Camera: {
      permissions: ["camera"],
    },
    Geolocation: {
      permissions: ["location"],
    },
  },
};

export default config;

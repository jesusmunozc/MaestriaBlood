import type { CapacitorConfig } from "@capacitor/cli";

// Live-reload modes:
//   DEV=true    → emulador Android (accede al host en 10.0.2.2)
//   DEVICE=true → dispositivo físico por USB (usa adb reverse, accede en localhost)
// Para dispositivo físico:
//   1. Conectar USB con depuración habilitada
//   2. npm run adb:reverse (una vez por sesión USB)
//   3. npm run dev:device  (sincroniza + inicia servidor Vite)
//   4. Instalar la app una vez: npm run android:run
const isDev = process.env.DEV === "true";
const isDevice = process.env.DEVICE === "true";

const config: CapacitorConfig = {
  appId: "com.apolocode.bloodapp",
  appName: "!Blood",
  webDir: "dist",
  server: isDev
    ? {
        url: "http://10.0.2.2:5173",
        cleartext: true,
      }
    : isDevice
    ? {
        url: "http://localhost:5173",
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

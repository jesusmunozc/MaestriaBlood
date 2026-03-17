// screenshot_screens.js
// Toma capturas de cada pantalla del mockup !Blood
// Uso: node screenshot_screens.js

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const HTML_FILE = path.resolve(__dirname, "index.html");
const OUTPUT_DIR = path.resolve(__dirname, "blood_overleaf", "imagenes");

// Mapeo: id de pantalla -> nombre de archivo de salida
const SCREENS = [
  { id: "splash", file: "01_splash.png", label: "Pantalla de bienvenida" },
  { id: "login", file: "02_login.png", label: "Inicio de sesión" },
  { id: "register", file: "03_registro_paso1.png", label: "Registro – Paso 1" },
  {
    id: "register-2",
    file: "04_registro_paso2.png",
    label: "Registro – Paso 2",
  },
  {
    id: "register-3",
    file: "05_registro_paso3.png",
    label: "Registro – Paso 3",
  },
  { id: "home", file: "06_home.png", label: "Pantalla principal" },
  {
    id: "create-request",
    file: "07_crear_solicitud.png",
    label: "Crear solicitud",
  },
  {
    id: "request-success",
    file: "08_solicitud_exitosa.png",
    label: "Solicitud publicada",
  },
  { id: "requests", file: "09_solicitudes.png", label: "Explorar solicitudes" },
  {
    id: "request-detail",
    file: "10_detalle_solicitud.png",
    label: "Detalle solicitud",
  },
  {
    id: "confirm-donation",
    file: "11_confirmar_donacion.png",
    label: "Confirmar donación",
  },
  {
    id: "donation-confirmed",
    file: "12_donacion_confirmada.png",
    label: "Donación confirmada",
  },
  { id: "chat", file: "13_chat_lista.png", label: "Lista de chats" },
  { id: "chat-detail", file: "14_chat_detalle.png", label: "Chat – detalle" },
  { id: "profile", file: "15_perfil.png", label: "Perfil de usuario" },
  {
    id: "notifications",
    file: "16_notificaciones.png",
    label: "Notificaciones",
  },
  {
    id: "my-requests",
    file: "17_mis_solicitudes.png",
    label: "Mis solicitudes",
  },
  {
    id: "create-campaign",
    file: "18_crear_campana.png",
    label: "Crear campaña",
  },
  {
    id: "campaign-success",
    file: "19_campana_exitosa.png",
    label: "Campaña publicada",
  },
  { id: "campaigns", file: "20_campanas.png", label: "Lista de campañas" },
  {
    id: "campaign-detail",
    file: "21_detalle_campana.png",
    label: "Detalle campaña",
  },
];

// Dimensiones del phone-frame visible en el mockup
const VIEWPORT = { width: 1280, height: 900 };

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Iniciando navegador...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  const fileUrl = `file:///${HTML_FILE.replace(/\\/g, "/")}`;
  console.log(`Abriendo: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: "networkidle0" });

  // Ocultar la barra de navegación de mockups para capturas limpias
  await page.addStyleTag({
    content: `.mockup-nav { display: none !important; }
              .mockup-container { justify-content: center !important; padding-top: 20px !important; }`,
  });

  for (const screen of SCREENS) {
    console.log(`  Capturando: ${screen.label} (${screen.id})`);

    // Cambiar a la pantalla correspondiente
    await page.evaluate((id) => {
      if (typeof showScreen === "function") showScreen(id);
    }, screen.id);

    await new Promise((r) => setTimeout(r, 300)); // pequeña pausa para animaciones

    // Captura solo del phone-frame
    const phoneFrame = await page.$(".phone-frame");
    if (phoneFrame) {
      await phoneFrame.screenshot({
        path: path.join(OUTPUT_DIR, screen.file),
        type: "png",
      });
      console.log(`    ✓ Guardado: ${screen.file}`);
    } else {
      console.warn(`    ✗ No se encontró .phone-frame para ${screen.id}`);
    }
  }

  await browser.close();
  console.log(`\nCaptura completada. Imágenes en: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

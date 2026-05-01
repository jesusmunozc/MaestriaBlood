/**
 * Genera íconos Android a partir de una imagen fuente.
 * Uso: node generate-icons.mjs <ruta-imagen>
 * Requiere: npm install sharp (en la raíz del proyecto)
 */
import { createRequire } from "module";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("Instala sharp primero: npm install sharp");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputPath = process.argv[2];
if (!inputPath || !existsSync(inputPath)) {
  console.error("Uso: node generate-icons.mjs <ruta-a-la-imagen>");
  process.exit(1);
}

const androidResDir = resolve(
  __dirname,
  "android/app/src/main/res"
);

const configs = [
  { dir: "mipmap-mdpi",    size: 48  },
  { dir: "mipmap-hdpi",    size: 72  },
  { dir: "mipmap-xhdpi",   size: 96  },
  { dir: "mipmap-xxhdpi",  size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 },
];

async function run() {
  for (const { dir, size } of configs) {
    const outDir = resolve(androidResDir, dir);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    // ic_launcher.png — cuadrado con fondo blanco
    await sharp(inputPath)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(resolve(outDir, "ic_launcher.png"));

    // ic_launcher_round.png — círculo
    const circleMask = Buffer.from(
      `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
    );
    await sharp(inputPath)
      .resize(size, size, { fit: "cover" })
      .composite([{ input: circleMask, blend: "dest-in" }])
      .png()
      .toFile(resolve(outDir, "ic_launcher_round.png"));

    // ic_launcher_foreground.png — sin fondo para adaptive icon
    await sharp(inputPath)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(resolve(outDir, "ic_launcher_foreground.png"));

    console.log(`✓ ${dir} (${size}px)`);
  }
  console.log("\n¡Íconos generados! Rebuild la app en Android Studio.");
}

run().catch(console.error);

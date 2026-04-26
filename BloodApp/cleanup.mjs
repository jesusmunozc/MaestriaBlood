/**
 * !Blood — Cleanup script
 * Elimina los usuarios de prueba corruptos de auth.users vía Admin API
 * Ejecutar ANTES de seed.mjs si hay error "Database error checking email"
 *
 *   node cleanup.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xeftefkfiireudtygjvd.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZnRlZmtmaWlyZXVkdHlnanZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk4MzM3MSwiZXhwIjoyMDkyNTU5MzcxfQ.Seut-WFF8Z8gVRVZwMTc5EVIRY59XIxLqi-xbck4hVc";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAILS = ["carlos_test@bloodapp.com", "dra_sofia@bloodapp.com"];

async function main() {
  console.log("\n🧹 !Blood — Cleanup script\n");

  // 1. Listar todos los usuarios para encontrar los corruptos
  console.log("→ Buscando usuarios de prueba...");
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("  ✗ No se pudo listar usuarios:", error.message);
    process.exit(1);
  }

  const testUsers = data.users.filter((u) => TEST_EMAILS.includes(u.email));

  if (testUsers.length === 0) {
    console.log("  ℹ No se encontraron usuarios de prueba. Nada que limpiar.");
    console.log("\n✅ Puedes ejecutar: node seed.mjs\n");
    return;
  }

  console.log(`  Encontrados: ${testUsers.map((u) => u.email).join(", ")}`);

  // 2. Eliminar perfiles primero (para evitar FK violation)
  console.log("\n→ Eliminando perfiles...");
  const ids = testUsers.map((u) => u.id);
  const { error: profileErr } = await supabase
    .from("profiles")
    .delete()
    .in("id", ids);
  if (profileErr) {
    console.warn("  ⚠ Error eliminando perfiles:", profileErr.message);
  } else {
    console.log("  ✓ Perfiles eliminados");
  }

  // 3. Eliminar usuarios de auth
  console.log("\n→ Eliminando usuarios de auth...");
  for (const user of testUsers) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id, true);
    if (delErr) {
      console.error(`  ✗ Error eliminando ${user.email}:`, delErr.message);
    } else {
      console.log(`  ✓ Eliminado: ${user.email}`);
    }
  }

  console.log("\n✅ Cleanup completo. Ahora ejecuta: node seed.mjs\n");
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});

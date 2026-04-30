import "dotenv/config";
import { defineConfig } from "prisma/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// ── Supabase connection via pg adapter with explicit SSL (required for pooler) ─
// Uses Transaction Pooler (port 6543) which is compatible with Prisma migrations.
function makePool() {
  const connectionString =
    process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? "";
  return new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    adapter: () => {
      const pool = makePool();
      return new PrismaPg(pool, { schema: "public" });
    },
  },
  datasource: {
    url:
      process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
});


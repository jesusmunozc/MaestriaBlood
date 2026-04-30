/**
 * db.mjs — Corre un archivo SQL directamente contra Supabase
 *
 * Uso:
 *   node db.mjs supabase/migrations/001_fix.sql
 *   node db.mjs "SELECT * FROM profiles LIMIT 5;"  (query inline)
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const input = process.argv[2];
if (!input) {
  console.error('Uso: node db.mjs <archivo.sql | "query SQL">');
  process.exit(1);
}

const sql = fs.existsSync(input) ? fs.readFileSync(input, 'utf-8') : input;

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  const result = await client.query(sql);
  const rows = Array.isArray(result) ? result.at(-1)?.rows : result.rows;
  if (rows?.length) console.table(rows);
  else console.log('✅ Ejecutado correctamente.');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}

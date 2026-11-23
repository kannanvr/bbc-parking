// One-time: creates tables and imports data/residents.xlsx into Postgres.
// Run locally:  npm run setup   (needs DATABASE_URL in .env.local)
import { neon } from '@neondatabase/serverless';
import * as XLSX from 'xlsx';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS residents (
  apartment TEXT PRIMARY KEY, name TEXT, email TEXT NOT NULL)`;
await sql`CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY, vehicle TEXT NOT NULL, apartment TEXT NOT NULL,
  sent_to TEXT NOT NULL, sent_at TIMESTAMPTZ DEFAULT now())`;

const wb = XLSX.read(fs.readFileSync('data/residents.xlsx'), { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
const get = (r, key) => {
  const k = Object.keys(r).find((c) => c.trim().toLowerCase() === key);
  return k ? String(r[k]).trim() : '';
};
let n = 0;
for (const r of rows) {
  const apartment = get(r, 'apartment'), email = get(r, 'email');
  if (!apartment || !email) continue;
  await sql`INSERT INTO residents (apartment, name, email)
            VALUES (${apartment}, ${get(r, 'resident name')}, ${email})
            ON CONFLICT (apartment) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`;
  n++;
}
console.log(`Tables ready. ${n} residents imported.`);

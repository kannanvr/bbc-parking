import { neon } from '@neondatabase/serverless';

// Connects only when a request runs (not at build time).
// The Neon integration on Vercel provides DATABASE_URL (or POSTGRES_URL).
export function sql(strings, ...values) {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set. Connect Neon to this Vercel project.');
  return neon(url)(strings, ...values);
}

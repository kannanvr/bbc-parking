import { neon } from '@neondatabase/serverless';

// DATABASE_URL is added automatically by the Neon integration on Vercel
export const sql = neon(process.env.DATABASE_URL);

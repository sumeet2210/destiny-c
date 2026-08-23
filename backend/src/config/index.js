// Central env access. Backend has its own .env; values may also be copied from
// the Next app's NEXT_PUBLIC_* names, so we accept both.
import 'dotenv/config';

export const env = {
  SUPABASE_URL:
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    '',
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? '',
  CRON_SECRET: process.env.CRON_SECRET ?? '',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  SITE_URL: process.env.SITE_URL ?? 'http://localhost:3000',
  PORT: Number(process.env.PORT ?? 4000),
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000',
};

// Mirrors the Next app's isConfigured(): Supabase when a URL is present, the
// typed seed otherwise. Lets the whole read layer run with no live project.
export const isSupabaseConfigured = () => Boolean(env.SUPABASE_URL);

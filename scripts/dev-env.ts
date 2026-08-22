// Shared bootstrap for the dev-only scripts: loads .env.local and refuses to
// run against any project other than the one named by SUPABASE_DEV_PROJECT_REF.
//
// Every script that imports this writes to the database — seeding upserts rows,
// the RLS test resets seed passwords and deletes fixture rows. The ref guard is
// the only thing standing between `npm run seed:remote` and prod (P10-3), so it
// lives in one place rather than being re-typed in each script.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type DevEnv = {
  url: string;
  publishable: string;
  secret: string;
};

/** Reads .env.local into process.env without overwriting what's already set. */
function loadEnvLocal(): void {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const path = join(root, '.env.local');

  let envRaw: string;
  try {
    envRaw = readFileSync(path, 'utf8');
  } catch {
    throw new Error(
      'No .env.local found. Copy .env.example to .env.local and fill in the ' +
        'Supabase values before running the dev scripts.',
    );
  }

  for (const line of envRaw.replace(/^﻿/, '').split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

export function loadDevEnv(): DevEnv {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const devRef = process.env.SUPABASE_DEV_PROJECT_REF;

  if (!url || !publishable || !secret) {
    throw new Error('Missing Supabase env in .env.local (see .env.example).');
  }
  if (!devRef) {
    throw new Error(
      'SUPABASE_DEV_PROJECT_REF is not set in .env.local. It names the only ' +
        'project these scripts may write to — without it there is nothing ' +
        'stopping a seed run from hitting prod (P10-3).',
    );
  }
  if (!url.includes(devRef)) {
    throw new Error(
      `Refusing: ${url} is not the dev project (${devRef}). Check ` +
        'SUPABASE_DEV_PROJECT_REF and NEXT_PUBLIC_SUPABASE_URL in .env.local.',
    );
  }

  return { url, publishable, secret };
}

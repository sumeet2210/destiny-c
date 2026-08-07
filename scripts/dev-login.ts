// Dev-only: mint a login code for a seed student without sending any email.
//
// Supabase's admin API can GENERATE the same one-time code the OTP email would
// carry, without delivering it. That sidesteps the built-in sender's rate limit
// entirely, so the logged-in surfaces (saved, friends, bookings, RSVPs) are
// testable before Resend SMTP is configured.
//
// Run: npm run dev:login              (defaults to student1)
//      npm run dev:login -- student2@student.nitw.ac.in
//
// Paste the printed code into /login. Refuses to run outside destiny-dev.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/db';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envRaw = readFileSync(join(root, '.env.local'), 'utf8').replace(/^﻿/, '');
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?$/);
  if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('Missing Supabase env in .env.local');
if (!url.includes('zlhuxisdetdzlmhdiksu')) {
  throw new Error(`Refusing: ${url} is not the destiny-dev project`);
}

const email = process.argv[2] ?? 'student1@student.nitw.ac.in';

const admin = createClient<Database>(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: profile } = await admin
    .from('users')
    .select('full_name, role, no_show_count, share_activity')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    throw new Error(
      `No user ${email}. Run \`npm run seed:remote\` first, or pass a seeded address.`,
    );
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (error) throw new Error(`generateLink: ${error.message}`);

  const code = data.properties?.email_otp;
  if (!code) throw new Error('Supabase returned no OTP in the generated link.');

  console.log('');
  console.log(`  ${profile.full_name ?? email}  (${profile.role})`);
  console.log(`  sharing: ${profile.share_activity ? 'on' : 'off'}   no-shows: ${profile.no_show_count}`);
  console.log('');
  console.log(`  email:  ${email}`);
  console.log(`  code:   ${code}`);
  console.log('');
  console.log('  Go to http://localhost:3000/login, enter that email, hit Send code');
  console.log('  (the send will fail on the rate limit - ignore it), then paste the');
  console.log('  code above. Or skip the form entirely with this one-shot link:');
  console.log('');
  console.log(`  ${data.properties?.action_link}`);
  console.log('');
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

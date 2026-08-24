// Dev-only: get a seed account logged in without sending any email.
//
// Students sign in with an OTP. Supabase's admin API can GENERATE the same
// one-time code the email would carry, without delivering it — that sidesteps
// the built-in sender's rate limit entirely, so the logged-in surfaces (saved,
// friends, bookings, RSVPs) are testable before Resend SMTP is configured.
//
// Owners sign in with a password (lib/auth/actions.ts#ownerLogin), and
// seed-remote creates them through admin.createUser, which cannot set one. So
// for an owner this sets a fresh random password instead and prints it — the
// only way to reach the /owner/* pages on a freshly seeded project.
//
// Run: npm run dev:login              (defaults to student1)
//      npm run dev:login -- student2@student.nitw.ac.in
//      npm run dev:login -- owner1@example.com
//      npm run dev:login -- admin@example.com    (lands on /admin)
//
// Note: anything that updates a user invalidates that user's outstanding OTP,
// so `npm run rls:test` (which resets student1-3 passwords) silently kills a
// code minted before it. Run rls:test FIRST, then dev:login.
//
// Refuses to run outside the project named by SUPABASE_DEV_PROJECT_REF.

import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/db';
import { loadDevEnv } from './dev-env';

const { url, secret } = loadDevEnv();

const email = process.argv[2] ?? 'student1@student.nitw.ac.in';

const admin = createClient<Database>(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: profile } = await admin
    .from('users')
    .select('id, full_name, role, no_show_count, share_activity')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    throw new Error(
      `No user ${email}. Run \`npm run seed:remote\` first, or pass a seeded address.`,
    );
  }

  console.log('');
  console.log(`  ${profile.full_name ?? email}  (${profile.role})`);

  // Owners and admins have no OTP path — the login form asks for a password, and
  // the seed never set one. Mint a throwaway one rather than baking a password
  // into the repo. Both roles use /owner/login: requireOwner() recognises an
  // admin session and forwards it to /admin.
  if (profile.role === 'owner' || profile.role === 'admin') {
    const password = `dev-${randomBytes(9).toString('base64url')}`;
    const { error } = await admin.auth.admin.updateUserById(profile.id, {
      password,
    });
    if (error) throw new Error(`set owner password: ${error.message}`);

    console.log('');
    console.log(`  email:     ${email}`);
    console.log(`  password:  ${password}`);
    console.log('');
    console.log('  Log in at http://localhost:3000/owner/login');
    if (profile.role === 'admin') {
      console.log('  (an admin lands on /admin, not the owner dashboard)');
    }
    console.log('  (new password each run — the old one stops working)');
    console.log('');
    return;
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (error) throw new Error(`generateLink: ${error.message}`);

  const code = data.properties?.email_otp;
  if (!code) throw new Error('Supabase returned no OTP in the generated link.');

  console.log('');
  console.log(
    `  sharing: ${profile.share_activity ? 'on' : 'off'}   no-shows: ${profile.no_show_count}`,
  );
  console.log('');
  console.log(`  email:  ${email}`);
  console.log(`  code:   ${code}`);
  console.log('');
  console.log(
    '  Go to http://localhost:3000/login, enter that email, hit Send code',
  );
  console.log(
    '  (the send will fail on the rate limit - ignore it), then paste the',
  );
  console.log(
    '  code above. Or skip the form entirely with this one-shot link:',
  );
  console.log('');
  console.log(`  ${data.properties?.action_link}`);
  console.log('');
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

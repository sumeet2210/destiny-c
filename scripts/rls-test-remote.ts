// P1-11 against the LINKED dev project, through the API as real signed-in
// users — the same path production clients take. Asserts the social-layer
// policies with three accounts: a friend, a non-friend, and sharing on/off.
// Run: npm run rls:test   (after scripts/seed-remote.ts)

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/db';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envRaw = readFileSync(join(root, '.env.local'), 'utf8').replace(/^﻿/, '');
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?$/);
  if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secret = process.env.SUPABASE_SECRET_KEY!;

const admin = createClient<Database>(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Client = SupabaseClient<Database>;

let failures = 0;
const check = (label: string, pass: boolean, detail = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
  if (!pass) failures++;
};

async function signIn(email: string, password: string): Promise<Client> {
  const client = createClient<Database>(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return client;
}

async function main() {
  const emails = [1, 2, 3].map((n) => `student${n}@student.nitw.ac.in`);
  const password = `rls-test-${Math.random().toString(36).slice(2)}`;

  const ids: string[] = [];
  for (const email of emails) {
    const { data: u } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (!u) throw new Error(`seed user ${email} missing — run seed-remote first`);
    ids.push(u.id);
    const { error } = await admin.auth.admin.updateUserById(u.id, { password });
    if (error) throw new Error(`set password ${email}: ${error.message}`);
  }
  // Only the sharer's id is needed directly; the other two act through their
  // own signed-in clients below.
  const [sharer, friend] = ids;

  // Fixture: sharer↔friend accepted; sharer saved restaurant 1 and RSVP'd an event.
  await admin.from('friendships').delete().or(
    `requester_id.eq.${sharer},addressee_id.eq.${sharer}`,
  );
  die(
    'fixture friendship',
    (
      await admin.from('friendships').insert({
        requester_id: sharer,
        addressee_id: friend,
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
    ).error,
  );
  const restaurantId = '00000000-0000-4000-8000-000000000001';
  await admin.from('saved_restaurants').delete().eq('student_id', sharer);
  die(
    'fixture saved',
    (
      await admin
        .from('saved_restaurants')
        .insert({ student_id: sharer, restaurant_id: restaurantId })
    ).error,
  );
  const { data: someEvent } = await admin.from('events').select('id').limit(1).single();
  await admin.from('event_rsvps').delete().eq('student_id', sharer);
  die(
    'fixture rsvp',
    (
      await admin
        .from('event_rsvps')
        .insert({ student_id: sharer, event_id: someEvent!.id })
    ).error,
  );

  const asFriend = await signIn(emails[1], password);
  const asStranger = await signIn(emails[2], password);

  const setSharing = async (on: boolean) =>
    die(
      `share_activity=${on}`,
      (await admin.from('users').update({ share_activity: on }).eq('id', sharer)).error,
    );

  const countFor = async (
    client: Client,
    table: 'saved_restaurants' | 'event_rsvps' | 'bookings',
  ) => {
    const { count, error } = await client
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('student_id', sharer);
    if (error) throw new Error(`${table}: ${error.message}`);
    return count ?? 0;
  };

  // Case A: sharing ON — friend sees, stranger never does.
  await setSharing(true);
  check('A1 friend sees saved when sharing on', (await countFor(asFriend, 'saved_restaurants')) === 1);
  check('A2 non-friend never sees saved', (await countFor(asStranger, 'saved_restaurants')) === 0);
  check('A3 friend sees RSVP when sharing on', (await countFor(asFriend, 'event_rsvps')) === 1);
  check('A4 non-friend never sees RSVP', (await countFor(asStranger, 'event_rsvps')) === 0);

  // Case B: sharing OFF — even the friend sees nothing.
  await setSharing(false);
  check('B1 friend sees nothing when sharing off', (await countFor(asFriend, 'saved_restaurants')) === 0);
  check('B2 friend sees no RSVP when sharing off', (await countFor(asFriend, 'event_rsvps')) === 0);

  // Case C: bookings are NEVER visible to friends, under any setting.
  await setSharing(true);
  check('C1 friend cannot read bookings even with sharing on', (await countFor(asFriend, 'bookings')) === 0);
  check('C2 stranger cannot read bookings', (await countFor(asStranger, 'bookings')) === 0);

  // Reset sharing to the privacy default.
  await setSharing(false);

  console.log(failures === 0 ? '\nAll RLS checks passed.' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

const die = (step: string, error: { message: string } | null) => {
  if (error) throw new Error(`${step}: ${error.message}`);
};

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

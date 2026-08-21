// Seeds the LINKED dev project through the admin API (secret key) — no DB
// password needed. Same source of truth as seed.sql: lib/data/seed.ts.
// Run: npm run seed:remote   ·   Dev/local only, never prod (P10-3).
//
// auth.admin.createUser cannot set a fixed uuid, so seed user ids are remapped
// to the generated ones on every row that references them.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/db';
import {
  seedRestaurants,
  seedMenuItems,
  seedOffers,
  seedPhotos,
  seedEvents,
  seedReviews,
  SEED_OWNER_IDS,
  SEED_STUDENT_IDS,
} from '../lib/data/seed';

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

const admin = createClient<Database>(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const die = (step: string, error: { message: string } | null) => {
  if (error) throw new Error(`${step}: ${error.message}`);
};

async function ensureUser(
  email: string,
  fullName: string,
  role: 'student' | 'owner',
): Promise<string> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (!error) return created.user.id;
  // Already exists from a previous run — look it up in public.users.
  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return existing.id;
  throw new Error(`createUser(${email}): ${error.message}`);
}

async function main() {
  const idMap = new Map<string, string>();

  for (let i = 0; i < SEED_OWNER_IDS.length; i++) {
    const id = await ensureUser(
      `owner${i + 1}@example.com`,
      `${seedRestaurants[i].name} Owner`,
      'owner',
    );
    idMap.set(SEED_OWNER_IDS[i], id);
  }
  const studentNames = ['Ananya', 'Ravi', 'Meghna'];
  for (let i = 0; i < SEED_STUDENT_IDS.length; i++) {
    const id = await ensureUser(
      `student${i + 1}@student.nitw.ac.in`,
      studentNames[i],
      'student',
    );
    idMap.set(SEED_STUDENT_IDS[i], id);
  }
  console.log(`users ready: ${idMap.size}`);

  const remap = (oldId: string) => {
    const id = idMap.get(oldId);
    if (!id) throw new Error(`no mapping for seed user ${oldId}`);
    return id;
  };

  die(
    'students nitw_verified',
    (
      await admin
        .from('users')
        .update({ nitw_verified: true })
        .in('id', SEED_STUDENT_IDS.map(remap))
    ).error,
  );

  die(
    'restaurants',
    (
      await admin
        .from('restaurants')
        .upsert(
          seedRestaurants.map((r) => ({ ...r, owner_id: remap(r.owner_id) })),
        )
    ).error,
  );
  die(
    'menu_items',
    (await admin.from('menu_items').upsert(seedMenuItems)).error,
  );
  die('offers', (await admin.from('offers').upsert(seedOffers)).error);
  die(
    'photos',
    (await admin.from('restaurant_photos').upsert(seedPhotos)).error,
  );
  die('events', (await admin.from('events').upsert(seedEvents)).error);

  // Completed, confirmed bookings backing the seed reviews (review RLS).
  die(
    'bookings',
    (
      await admin.from('bookings').upsert(
        seedReviews.map((r, i) => ({
          id: r.booking_id,
          student_id: remap(r.student_id),
          restaurant_id: r.restaurant_id,
          headcount: 2 + (i % 3),
          booking_time: r.created_at,
          booking_end_time: new Date(
            new Date(r.created_at).getTime() + 60 * 60_000,
          ).toISOString(),
          status: 'completed' as const,
          reminder_sent_at: r.created_at,
          confirmed_at: r.created_at,
          created_at: r.created_at,
        })),
      )
    ).error,
  );
  die(
    'reviews',
    (
      await admin
        .from('reviews')
        .upsert(
          seedReviews.map((r) => ({ ...r, student_id: remap(r.student_id) })),
        )
    ).error,
  );

  // A little view history so trending and analytics have something to chew on.
  const sources = [
    'homepage_feed',
    'search',
    'craving:biryani',
    'events',
    'quiz',
  ];
  const views = seedRestaurants.flatMap((r) =>
    sources.flatMap((source) =>
      Array.from({ length: 4 }, () => ({
        restaurant_id: r.id,
        viewer_id: null,
        source_filter: source,
        created_at: new Date(
          Date.now() - Math.random() * 48 * 3_600_000,
        ).toISOString(),
      })),
    ),
  );
  die('profile_views', (await admin.from('profile_views').insert(views)).error);

  console.log('Seed complete.');
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

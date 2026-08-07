// P3-13: every profile open logs a profile_views row tagged with the source
// filter the student arrived through. Best-effort — never breaks browsing.
import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

const KNOWN_SOURCES = new Set([
  'homepage_feed',
  'search',
  'quiz',
  'events',
  'friend_activity',
  'direct',
]);

export async function POST(request: Request) {
  let body: { restaurantId?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { restaurantId, source } = body;
  if (!restaurantId || typeof restaurantId !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const sourceFilter =
    typeof source === 'string' &&
    (KNOWN_SOURCES.has(source) || source.startsWith('craving:'))
      ? source.slice(0, 64)
      : 'direct';

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: 'seed' });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from('profile_views').insert({
    restaurant_id: restaurantId,
    viewer_id: user?.id ?? null,
    source_filter: sourceFilter,
  });
  return NextResponse.json({ ok: true });
}

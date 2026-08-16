import Link from 'next/link';
import { RestaurantGrid } from '@/components/features/RestaurantGrid';
import { Card } from '@/components/ui/Card';
import { requireStudent } from '@/lib/auth/session';
import { listRestaurantSummaries } from '@/lib/queries/catalog';
import { getSavedIds } from '@/lib/queries/social';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const metadata = { title: 'Saved' };

export default async function SavedPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 pt-16 pb-28">
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Saved
        </h1>
        <Card className="text-text-muted mt-4 text-sm">
          Seed mode — saving needs a live Supabase project.
        </Card>
      </main>
    );
  }

  await requireStudent('/saved');
  const [summaries, savedIds] = await Promise.all([
    listRestaurantSummaries(),
    getSavedIds(),
  ]);
  const saved = summaries.filter((r) => savedIds.has(r.id));

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 pt-16 pb-28">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Saved
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Private by default. Friends only see this list if you turn on activity
          sharing in your account.
        </p>
      </div>

      {saved.length === 0 ? (
        <Card className="text-text-muted text-center text-sm">
          Nothing saved yet — tap the bookmark on any place you want to come
          back to.{' '}
          <Link href="/" className="text-accent-primary hover:underline">
            Start browsing
          </Link>
        </Card>
      ) : (
        <RestaurantGrid restaurants={saved} source="direct" />
      )}
    </main>
  );
}

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { requireStudent } from '@/lib/auth/session';
import { listStudentReviews } from '@/lib/queries/reviews';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const metadata = { title: 'My reviews' };

/**
 * Everything this student has written, newest first.
 *
 * The reviews a restaurant shows are anonymous to everyone else — this is the
 * one place a student can see their own words attached to their own name, and
 * the only place they can check what they said about a place before going back.
 */
export default async function StudentReviewsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 pt-16 pb-28">
        <h1 className="font-display text-paper text-2xl font-extrabold">
          My reviews
        </h1>
        <Card className="text-text-muted mt-4 text-sm">
          Seed mode — log in needs a live Supabase project.
        </Card>
      </main>
    );
  }

  await requireStudent('/reviews');
  const reviews = await listStudentReviews();

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-16 pb-28">
      <div>
        <Link
          href="/account"
          className="text-text-muted hover:text-paper text-[13px] font-bold no-underline"
        >
          ← Profile
        </Link>
        <h1 className="font-display text-paper mt-2 text-2xl font-extrabold">
          My reviews
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          {reviews.length === 0
            ? 'A review unlocks once a visit is done.'
            : 'Restaurants see these without your name on them.'}
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card className="text-text-muted text-center text-sm">
          Nothing written yet. After a visit wraps up, the booking on{' '}
          <Link
            href="/bookings"
            className="text-accent-primary hover:underline"
          >
            my bookings
          </Link>{' '}
          grows a review box.
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/restaurant/${review.restaurantId}`}
                  className="text-paper text-sm font-extrabold no-underline hover:underline"
                >
                  {review.restaurantName}
                </Link>
                <span className="text-text-muted shrink-0 text-[12px]">
                  {new Date(review.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'Asia/Kolkata',
                  })}
                </span>
              </div>
              <p className="text-accent-primary font-mono text-sm font-bold">
                <span className="sr-only">{review.rating} out of 5</span>
                <span aria-hidden>
                  {'★'.repeat(review.rating)}
                  <span className="text-text-muted">
                    {'★'.repeat(5 - review.rating)}
                  </span>
                </span>
              </p>
              {review.comment ? (
                <p className="text-paper text-sm">{review.comment}</p>
              ) : (
                <p className="text-text-muted text-sm italic">
                  Rating only — no comment.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

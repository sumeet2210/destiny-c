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
    <main className="mx-auto w-full max-w-6xl space-y-10 px-3 pt-3 pb-28 sm:px-5 sm:pt-5">
      <header className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_82%_12%,rgba(167,139,250,0.2),transparent_34%),radial-gradient(circle_at_12%_100%,rgba(71,215,255,0.08),transparent_32%),linear-gradient(145deg,#202020,#0d0d0d)] px-5 pt-16 pb-5 shadow-[0_22px_60px_rgba(0,0,0,0.34)] sm:p-8">
        <ReviewsBackLink className="absolute top-4 left-5 sm:top-6 sm:left-8" />
        <div className="pointer-events-none absolute top-5 right-20 hidden h-px w-28 bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
        <div className="max-w-2xl">
          <p className="text-[10px] font-black tracking-[0.16em] text-[#A78BFA] uppercase">
            Your feedback
          </p>
          <h1 className="font-display text-paper mt-2 text-[clamp(2.3rem,7vw,4.4rem)] leading-[0.9] font-extrabold tracking-[-0.065em]">
            My reviews.
          </h1>
        </div>
        <div className="relative mt-7 max-w-[11rem]">
          <ReviewStat label="Reviews" value={reviews.length} />
        </div>
      </header>

      <section className="space-y-4" aria-labelledby="review-history-title">
        <h2
          id="review-history-title"
          className="font-display text-paper text-2xl font-bold tracking-[-0.035em]"
        >
          Review history
        </h2>

        {reviews.length === 0 ? (
          <Card className="text-text-muted text-center text-sm">
            Nothing written yet.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="relative overflow-hidden border-white/10 bg-[linear-gradient(145deg,#202020,#121212)] shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
              >
                <span className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-[#A78BFA]/[0.07]" />
                <div className="relative space-y-2">
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
                  <p
                    className="text-accent-primary inline-flex items-center gap-1 font-mono text-sm font-bold"
                    aria-label={`${review.rating} out of 5`}
                  >
                    <span>{review.rating}</span>
                    <span aria-hidden>★</span>
                  </p>
                  {review.comment ? (
                    <p className="text-paper text-sm">{review.comment}</p>
                  ) : (
                    <p className="text-text-muted text-sm italic">
                      Rating only
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ReviewsBackLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/account"
      aria-label="Back to profile"
      className={`border-border-hairline bg-surface-muted text-paper hover:bg-surface-raised grid size-10 shrink-0 place-items-center rounded-full border transition-colors ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5 fill-none stroke-current stroke-2"
      >
        <path
          d="m15 18-6-6 6-6M9 12h10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function ReviewStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[0.95rem] border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-sm sm:px-4">
      <span className="mb-2 block h-0.5 w-5 rounded-full bg-[#A78BFA]" />
      <strong className="text-paper block font-mono text-xl font-black">
        {value}
      </strong>
      <span className="text-text-muted mt-0.5 block text-[9px] font-bold uppercase">
        {label}
      </span>
    </div>
  );
}

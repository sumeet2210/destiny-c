import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { requireStudent } from '@/lib/auth/session';
import { listStudentReviews } from '@/lib/queries/reviews';

export const metadata = { title: 'My reviews' };

export default async function StudentReviewsPage() {
  await requireStudent('/reviews');
  const reviews = await listStudentReviews();

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pt-6 pb-28">
      <header className="flex items-center gap-3">
        <Link
          href="/account"
          aria-label="Back to profile"
          className="border-border-hairline bg-surface-muted text-paper hover:bg-surface-raised grid size-10 shrink-0 place-items-center rounded-full border transition-colors"
        >
          <BackIcon />
        </Link>
        <div>
          <p className="text-[10px] font-black tracking-[0.16em] text-[#1DB954] uppercase">
            Your voice
          </p>
          <h1 className="font-display text-paper text-2xl font-extrabold">
            My reviews
          </h1>
        </div>
      </header>

      {reviews.length === 0 ? (
        <Card className="space-y-3 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#1DB954]/12 text-xl text-[#1DB954]">
            ★
          </span>
          <div>
            <p className="text-paper text-sm font-bold">No reviews yet</p>
            <p className="text-text-muted mt-1 text-xs leading-relaxed">
              Reviews unlock after a completed, confirmed visit.
            </p>
          </div>
          <Link
            href="/bookings"
            className="inline-flex min-h-10 items-center text-xs font-bold text-[#1DB954] hover:underline"
          >
            Check eligible bookings →
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[1.15rem] border border-white/10 bg-[linear-gradient(145deg,#202020,#151515)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-paper text-sm font-extrabold">
                    {review.restaurantName}
                  </h2>
                  <time className="text-text-muted mt-1 block text-[10px]">
                    {new Date(review.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1DB954]/12 px-2.5 py-1 font-mono text-xs font-black text-[#1DB954]">
                  ★ {review.rating}.0
                </span>
              </div>
              <p className="text-text-muted mt-3 border-t border-white/8 pt-3 text-[13px] leading-relaxed">
                {review.comment || 'No written comment.'}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function BackIcon() {
  return (
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
  );
}

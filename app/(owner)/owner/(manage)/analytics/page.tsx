import { ReviewList } from '@/components/features/ReviewList';
import { AnalyticsView } from '@/components/features/owner/AnalyticsView';
import { getOwnerAnalytics, getOwnerReviews } from '@/lib/queries/owner';

export const metadata = { title: 'Restaurant Analytics' };

export default async function OwnerAnalyticsPage() {
  const [analytics, reviews] = await Promise.all([
    getOwnerAnalytics(),
    getOwnerReviews(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[92rem] space-y-9">
      <header className="border-border-hairline border-b pb-5">
        <h1 className="font-display text-paper text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          Restaurant Analytics
        </h1>
      </header>

      {!analytics || !reviews ? (
        <div className="border-border-hairline rounded-[1.25rem] border border-dashed bg-[#161616] px-5 py-10 text-center">
          <p className="text-paper text-sm font-semibold">
            Analytics need a live Supabase project.
          </p>
          <p className="text-text-muted mt-1 text-[12px]">
            Your performance metrics will appear here as students interact.
          </p>
        </div>
      ) : (
        <AnalyticsView
          data={analytics}
          ratings={{ average: reviews.average, count: reviews.count }}
        />
      )}

      <section
        className="border-border-hairline space-y-5 border-t pt-8"
        aria-labelledby="owner-reviews-title"
      >
        <div>
          <p className="text-accent-primary text-[11px] font-extrabold tracking-[0.13em] uppercase">
            Customer voice
          </p>
          <h2
            id="owner-reviews-title"
            className="font-display text-paper mt-1 text-xl font-bold"
          >
            Recent reviews
          </h2>
          <p className="text-text-muted mt-1 text-[13px]">
            Read the feedback behind your rating metrics.
          </p>
        </div>

        {!reviews ? (
          <p className="text-text-muted text-sm">
            Reviews need a live Supabase project.
          </p>
        ) : (
          <ReviewList
            reviews={reviews.reviews.map((review) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              created_at: review.created_at,
              reviewerName: 'NITW Diner',
            }))}
          />
        )}
      </section>
    </div>
  );
}

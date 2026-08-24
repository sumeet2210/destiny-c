import { Card } from '@/components/ui/Card';
import { ReviewList } from '@/components/features/ReviewList';
import { getOwnerReviews } from '@/lib/queries/owner';

export const metadata = { title: 'Reviews' };

export default async function OwnerReviewsPage() {
  const data = await getOwnerReviews();

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Reviews
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Only students who booked a table and showed up can leave a review, so
          every one of these is from a real diner. Reviewers stay anonymous —
          you see the rating and what they wrote, not who they are.
        </p>
      </div>

      {!data ? (
        <p className="text-text-muted text-sm">
          Reviews need a live Supabase project.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-text-muted text-[13px]">Average rating</p>
              <p className="font-display text-paper mt-1 text-2xl font-bold">
                {data.average === null ? '—' : data.average.toFixed(1)}
              </p>
              <p className="text-text-muted mt-1 text-[11px]">
                Out of 5. This is the same number students see on your card.
              </p>
            </Card>
            <Card>
              <p className="text-text-muted text-[13px]">Total reviews</p>
              <p className="font-display text-paper mt-1 text-2xl font-bold">
                {data.count}
              </p>
            </Card>
          </div>

          <ReviewList
            reviews={data.reviews.map((review) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              created_at: review.created_at,
              reviewerName: 'NITW Diner',
            }))}
          />
        </>
      )}
    </div>
  );
}

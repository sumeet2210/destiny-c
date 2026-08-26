// Analytics and reviews on one page.
//
// Both answer "how is my place doing on Destiny" — views on one side, what
// diners said on the other — and an owner reading one always wants the other.
// /owner/reviews redirects here.
import { ReviewList } from '@/components/features/ReviewList';
import { AnalyticsView } from '@/components/features/owner/AnalyticsView';
import { Card } from '@/components/ui/Card';
import {
  getOwnerAnalytics,
  getOwnerBundle,
  getOwnerReviews,
} from '@/lib/queries/owner';
import { nowMs } from '@/lib/now';

export const metadata = { title: 'Analytics' };

export default async function OwnerAnalyticsPage() {
  // All three reads reuse the cached owner bundle within this request.
  const [analytics, reviews, bundle] = await Promise.all([
    getOwnerAnalytics(),
    getOwnerReviews(),
    getOwnerBundle(),
  ]);
  const now = nowMs();
  const liveOffers =
    bundle?.offers.filter(
      (offer) =>
        offer.is_active &&
        new Date(offer.starts_at).getTime() <= now &&
        new Date(offer.expires_at).getTime() > now,
    ).length ?? 0;
  const upcomingEvents =
    bundle?.events.filter(
      (event) =>
        !event.is_cancelled && new Date(event.starts_at).getTime() > now,
    ).length ?? 0;

  return (
    <div className="w-full space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-text-muted text-[13px]">Live offers</p>
          <p className="font-display text-paper mt-1 text-2xl font-bold">
            {liveOffers}
          </p>
        </Card>
        <Card>
          <p className="text-text-muted text-[13px]">Upcoming events</p>
          <p className="font-display text-paper mt-1 text-2xl font-bold">
            {upcomingEvents}
          </p>
        </Card>
      </div>

      <section className="space-y-5" aria-labelledby="owner-views-title">
        <div>
          <h2
            id="owner-views-title"
            className="font-display text-paper text-xl font-bold"
          >
            Profile views
          </h2>
          {/* P7-5: profile views, never footfall. The UI must say so. */}
          <p className="text-text-muted mt-1 text-[13px]">
            These are views of your Destiny profile page — how many students
            looked, and what brought them. It is not a count of people walking
            in.
          </p>
        </div>
        {!analytics ? (
          <p className="text-text-muted text-sm">
            Analytics need a live Supabase project.
          </p>
        ) : (
          <AnalyticsView data={analytics} />
        )}
      </section>

      <section
        className="border-border-hairline space-y-5 border-t pt-8"
        aria-labelledby="owner-reviews-title"
      >
        <div>
          <h2
            id="owner-reviews-title"
            className="font-display text-paper text-xl font-bold"
          >
            Ratings &amp; Reviews
          </h2>
        </div>

        {!reviews ? (
          <p className="text-text-muted text-sm">
            Reviews need a live Supabase project.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="text-text-muted text-[13px]">Average rating</p>
                <p className="font-display text-paper mt-1 text-2xl font-bold">
                  {reviews.average === null ? '—' : reviews.average.toFixed(1)}
                </p>
                <p className="text-text-muted mt-1 text-[11px]">
                  Out of 5. This is the same number students see on your card.
                </p>
              </Card>
              <Card>
                <p className="text-text-muted text-[13px]">Total ratings</p>
                <p className="font-display text-paper mt-1 text-2xl font-bold">
                  {reviews.count}
                </p>
              </Card>
            </div>

            <ReviewList
              reviews={reviews.reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                created_at: review.created_at,
                reviewerName: 'NITW Diner',
              }))}
            />
          </>
        )}
      </section>
    </div>
  );
}

import { redirect } from 'next/navigation';
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
  const bundle = await getOwnerBundle();
  if (!bundle || bundle.restaurant.status !== 'active') {
    redirect('/owner/dashboard');
  }

  const [analytics, reviews] = await Promise.all([
    getOwnerAnalytics(),
    getOwnerReviews(),
  ]);
  const now = nowMs();
  const liveOffers = bundle.offers.filter(
    (offer) =>
      offer.is_active &&
      new Date(offer.starts_at).getTime() <= now &&
      new Date(offer.expires_at).getTime() > now,
  );
  const upcomingEvents = bundle.events.filter(
    (event) => !event.is_cancelled && new Date(event.starts_at).getTime() > now,
  );

  return (
    <div className="w-full space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Live offers" value={liveOffers.length} />
        <Stat label="Upcoming events" value={upcomingEvents.length} />
      </div>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-paper text-xl font-bold">
            Analytics
          </h2>
          <p className="text-text-muted mt-1 text-[13px]">
            These are views of your Destiny profile page, not a count of people
            walking in.
          </p>
        </div>
        {analytics ? (
          <AnalyticsView data={analytics} />
        ) : (
          <p className="text-text-muted text-sm">
            Analytics need a live Supabase project.
          </p>
        )}
      </section>

      {reviews ? (
        <section className="border-border-hairline space-y-5 border-t pt-8">
          <div>
            <h2 className="font-display text-paper text-xl font-bold">
              Reviews
            </h2>
            <p className="text-text-muted mt-1 text-[13px]">
              Only students who booked a table and showed up can leave a review.
              Reviewers stay anonymous.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-text-muted text-[13px]">Average rating</p>
              <p className="font-display text-paper mt-1 text-2xl font-bold">
                {reviews.average === null ? '—' : reviews.average.toFixed(1)}
              </p>
              <p className="text-text-muted mt-1 text-[11px]">Out of 5</p>
            </Card>
            <Card>
              <p className="text-text-muted text-[13px]">Total ratings</p>
              <p className="font-display text-paper mt-1 text-2xl font-bold">
                {reviews.count}
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-paper text-lg font-bold">
              Written reviews
            </h3>
            <ReviewList
              reviews={reviews.reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                created_at: review.created_at,
                reviewerName: 'NITW Diner',
              }))}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-text-muted text-[13px]">{label}</p>
      <p className="font-display text-paper mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}

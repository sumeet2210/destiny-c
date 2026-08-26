// Offers and events on one page.
//
// They are the same job — "what is on at my place this week" — and an owner
// posting a quiz night usually posts the drinks offer that goes with it. The old
// /owner/offers and /owner/events routes redirect here so bookmarks and the
// links inside emails still land somewhere useful.
import { redirect } from 'next/navigation';
import { EventManager } from '@/components/features/owner/EventManager';
import { OfferManager } from '@/components/features/owner/OfferManager';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Offers & Events' };

export default async function OwnerOffersEventsPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Offers &amp; Events
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Everything students see as &ldquo;what&apos;s on&rdquo; at your place,
          in one place.
        </p>
      </div>

      <section className="space-y-5" aria-labelledby="owner-offers-title">
        <div>
          <h2
            id="owner-offers-title"
            className="font-display text-paper text-xl font-bold"
          >
            Live offers
          </h2>
          <p className="text-text-muted mt-1 text-[13px]">
            Offers expire at the end of the day unless you pick a time —
            that&apos;s what keeps the feed trustworthy.
          </p>
        </div>
        <OfferManager
          offers={bundle.offers.map((o) => ({
            id: o.id,
            title: o.title,
            description: o.description,
            discount_text: o.discount_text,
            starts_at: o.starts_at,
            expires_at: o.expires_at,
            is_active: o.is_active,
            flagged_count: o.flagged_count,
          }))}
        />
      </section>

      <section
        className="border-border-hairline space-y-5 border-t pt-8"
        aria-labelledby="owner-events-title"
      >
        <div>
          <h2
            id="owner-events-title"
            className="font-display text-paper text-xl font-bold"
          >
            Events
          </h2>
          <p className="text-text-muted mt-1 text-[13px]">
            Events show on your profile, the events page and the homepage — a
            campus crowd plans evenings around them.
          </p>
        </div>
        <EventManager
          events={bundle.events.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            event_type: e.event_type,
            starts_at: e.starts_at,
            ends_at: e.ends_at,
            entry_fee: e.entry_fee,
            location_details: e.location_details,
            ticket_url: e.ticket_url,
            is_cancelled: e.is_cancelled,
          }))}
        />
      </section>
    </div>
  );
}

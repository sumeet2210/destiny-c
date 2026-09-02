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
    <div className="mx-auto w-full max-w-[92rem] space-y-6">
      <header className="border-border-hairline border-b pb-5">
        <h1 className="font-display text-paper text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          Offers &amp; Events
        </h1>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section
          className="border-border-hairline rounded-[1.5rem] border bg-[#141414] p-4 sm:p-5"
          aria-labelledby="owner-offers-title"
        >
          <div className="border-border-hairline mb-5 border-b pb-4">
            <h2
              id="owner-offers-title"
              className="font-display text-paper text-xl font-bold"
            >
              All offers
            </h2>
            <p className="text-text-muted mt-1 text-[13px] leading-5">
              Every offer is shown below with its current status and details.
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
              image_url: o.image_url,
            }))}
          />
        </section>

        <section
          className="border-border-hairline rounded-[1.5rem] border bg-[#141414] p-4 sm:p-5"
          aria-labelledby="owner-events-title"
        >
          <div className="border-border-hairline mb-5 border-b pb-4">
            <h2
              id="owner-events-title"
              className="font-display text-paper text-xl font-bold"
            >
              All events
            </h2>
            <p className="text-text-muted mt-1 text-[13px] leading-5">
              Every event stays visible here in one vertical list.
            </p>
          </div>
          <EventManager
            events={bundle.events.map((e) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              event_type: e.event_type,
              custom_event_type: e.custom_event_type,
              starts_at: e.starts_at,
              ends_at: e.ends_at,
              entry_fee: e.entry_fee,
              location_details: e.location_details,
              is_cancelled: e.is_cancelled,
              cover_image_url: e.cover_image_url,
            }))}
          />
        </section>
      </div>
    </div>
  );
}

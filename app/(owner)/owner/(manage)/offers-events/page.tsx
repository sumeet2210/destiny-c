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
      <header className="border-border-hairline rounded-[1.5rem] border bg-[#101010] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-paper text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              Offers &amp; Events
            </h1>
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:min-w-72">
            <SummaryStat label="Offers" value={bundle.offers.length} />
            <SummaryStat label="Events" value={bundle.events.length} />
          </dl>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section
          className="border-border-hairline rounded-[1.5rem] border bg-[#141414] p-4 sm:p-5"
          aria-labelledby="owner-offers-title"
        >
          <div className="border-border-hairline mb-5 border-b pb-4">
            <p className="text-text-muted text-[11px] font-bold tracking-[0.1em] uppercase">
              Offers
            </p>
            <h2
              id="owner-offers-title"
              className="font-display text-paper mt-1 text-xl font-bold"
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
            <p className="text-text-muted text-[11px] font-bold tracking-[0.1em] uppercase">
              Events
            </p>
            <h2
              id="owner-events-title"
              className="font-display text-paper mt-1 text-xl font-bold"
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
              starts_at: e.starts_at,
              ends_at: e.ends_at,
              entry_fee: e.entry_fee,
              location_details: e.location_details,
              ticket_url: e.ticket_url,
              is_cancelled: e.is_cancelled,
              cover_image_url: e.cover_image_url,
            }))}
          />
        </section>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border-hairline rounded-[0.9rem] border bg-[#181818] px-4 py-3">
      <dt className="text-text-muted text-[11px] font-medium">{label}</dt>
      <dd className="text-paper mt-1 font-mono text-2xl font-semibold">
        {value}
      </dd>
    </div>
  );
}

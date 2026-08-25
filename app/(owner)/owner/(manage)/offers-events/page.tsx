import { redirect } from 'next/navigation';
import { EventManager } from '@/components/features/owner/EventManager';
import { OfferManager } from '@/components/features/owner/OfferManager';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Offers & Events' };

export default async function OwnerOffersEventsPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="w-full space-y-8">
      <section className="space-y-5">
        <div>
          <h2 className="font-display text-paper text-xl font-bold">Offers</h2>
          <p className="text-text-muted mt-1 text-[13px]">
            Offers expire at the end of the day unless you choose a time.
          </p>
        </div>
        <OfferManager
          offers={bundle.offers.map((offer) => ({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            discount_text: offer.discount_text,
            starts_at: offer.starts_at,
            expires_at: offer.expires_at,
            is_active: offer.is_active,
            flagged_count: offer.flagged_count,
          }))}
        />
      </section>

      <section className="border-border-hairline space-y-5 border-t pt-8">
        <h2 className="font-display text-paper text-xl font-bold">Events</h2>
        <EventManager
          events={bundle.events.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            starts_at: event.starts_at,
            ends_at: event.ends_at,
            entry_fee: event.entry_fee,
            location_details: event.location_details,
            ticket_url: event.ticket_url,
            is_cancelled: event.is_cancelled,
          }))}
        />
      </section>
    </div>
  );
}

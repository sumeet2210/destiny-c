'use client';

import { OfferManager } from '@/components/features/owner/OfferManager';
import { OwnerBundleGate } from '@/components/features/owner/OwnerBundleGate';

export function OffersView() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Live offers
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Offers expire at the end of the day unless you pick a time —
          that&apos;s what keeps the feed trustworthy.
        </p>
      </div>
      <OwnerBundleGate>
        {(bundle, reload) => (
          <OfferManager
            offers={bundle.offers.map((o) => ({
              id: o.id,
              title: o.title,
              description: o.description,
              discount_text: o.discount_text,
              expires_at: o.expires_at,
              is_active: o.is_active,
              flagged_count: o.flagged_count,
            }))}
            onChanged={reload}
          />
        )}
      </OwnerBundleGate>
    </div>
  );
}

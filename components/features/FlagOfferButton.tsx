'use client';

import { useState, useTransition } from 'react';
import { flagOffer } from '@/lib/api/offers';

export function FlagOfferButton({ offerId }: { offerId: string }) {
  const [flagged, setFlagged] = useState(false);
  const [, startTransition] = useTransition();

  if (flagged) {
    return (
      <span className="text-text-muted text-[12px]">
        Thanks — we told the owner.
      </span>
    );
  }

  return (
    <button
      type="button"
      className="text-text-muted text-[12px] underline-offset-2 hover:underline"
      onClick={() =>
        startTransition(async () => {
          setFlagged(true);
          // flagOffer is best-effort: it swallows failures so a bad flag never
          // disrupts the page.
          await flagOffer(offerId);
        })
      }
    >
      This offer looks wrong
    </button>
  );
}

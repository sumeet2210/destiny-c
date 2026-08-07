'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/Toast';
import { flagOffer } from '@/lib/offers/actions';

export function FlagOfferButton({ offerId }: { offerId: string }) {
  const [flagged, setFlagged] = useState(false);
  const [, startTransition] = useTransition();
  const toast = useToast();

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
          const res = await flagOffer(offerId);
          if (!res.ok) toast('Could not send that — try again later', 'error');
        })
      }
    >
      This offer looks wrong
    </button>
  );
}

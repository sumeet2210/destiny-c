'use client';

import { useTransition } from 'react';
import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { deleteOffer, listFlaggedOffers, moderateOffer } from '@/lib/api/admin';
import type { FlaggedOffer } from '@/lib/api/types';
import { useApi } from '@/lib/hooks/useApi';

export function FlaggedOffersView() {
  const { data, error, reload } = useApi(() => listFlaggedOffers(), []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Flagged offers
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Offers students reported. Clear the flags if they&rsquo;re fine,
          deactivate to pull them from the feed, or delete outright.
        </p>
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingBlock label="Loading flagged offers…" />
      ) : data.length === 0 ? (
        <p className="text-text-muted text-sm">
          Nothing flagged — the offer feed is clean.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((o) => (
            <OfferRow key={o.id} offer={o} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferRow({
  offer,
  onChanged,
}: {
  offer: FlaggedOffer;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const run = (fn: () => Promise<void>, message: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast(message, 'positive');
        onChanged();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not update', 'error');
      }
    });

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-paper text-sm font-semibold">{offer.title}</p>
        <span className="text-accent-urgent-text shrink-0 text-[12px]">
          {offer.flagged_count} {offer.flagged_count === 1 ? 'flag' : 'flags'}
        </span>
      </div>
      {offer.restaurantName && (
        <p className="text-text-muted text-[12px]">{offer.restaurantName}</p>
      )}
      {offer.discount_text && (
        <p className="text-accent-primary text-[12px] font-bold">
          {offer.discount_text}
        </p>
      )}
      {offer.description && (
        <p className="text-text-muted text-[13px]">{offer.description}</p>
      )}
      <p className="text-text-muted text-[12px]">
        {offer.is_active ? 'Live' : 'Inactive'}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(() => moderateOffer(offer.id, 'clear_flags'), 'Flags cleared')
          }
        >
          Clear flags
        </Button>
        {offer.is_active && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => moderateOffer(offer.id, 'deactivate'),
                'Offer deactivated',
              )
            }
          >
            Deactivate
          </Button>
        )}
        <Button
          variant="urgent-text"
          size="sm"
          disabled={pending}
          onClick={() => run(() => deleteOffer(offer.id), 'Offer deleted')}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { listRestaurants, setRestaurantStatus } from '@/lib/api/admin';
import type { AdminRestaurant } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useApi } from '@/lib/hooks/useApi';

type StatusFilter = 'pending_approval' | 'active' | 'suspended' | 'all';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'pending_approval', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'all', label: 'All' },
];

const STATUS_LABEL: Record<AdminRestaurant['status'], string> = {
  pending_approval: 'Pending approval',
  active: 'Active',
  suspended: 'Suspended',
};

const STATUS_TONE: Record<AdminRestaurant['status'], string> = {
  pending_approval: 'text-accent-urgent-text',
  active: 'text-accent-secondary',
  suspended: 'text-text-muted',
};

export function RestaurantsView() {
  const [filter, setFilter] = useState<StatusFilter>('pending_approval');
  const { data, loading, error, reload } = useApi(
    () => listRestaurants(filter === 'all' ? undefined : filter),
    [filter],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Restaurants
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Approve new listings, suspend ones that break the rules, and reinstate
          them when they&rsquo;re back in line.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingBlock label="Loading restaurants…" />
      ) : data.length === 0 ? (
        <p className="text-text-muted text-sm">Nothing in this bucket.</p>
      ) : (
        <div className={cn('space-y-3', loading && 'opacity-60')}>
          {data.map((r) => (
            <RestaurantRow key={r.id} restaurant={r} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantRow({
  restaurant,
  onChanged,
}: {
  restaurant: AdminRestaurant;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const act = (status: AdminRestaurant['status'], message: string) =>
    startTransition(async () => {
      try {
        await setRestaurantStatus(restaurant.id, status);
        toast(message, 'positive');
        onChanged();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not update', 'error');
      }
    });

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-paper text-sm font-semibold">{restaurant.name}</p>
        <span className={cn('shrink-0 text-[12px]', STATUS_TONE[restaurant.status])}>
          {STATUS_LABEL[restaurant.status]}
        </span>
      </div>
      <p className="text-text-muted text-[12px]">
        {restaurant.area}
        {restaurant.address ? ` · ${restaurant.address}` : ''}
        {restaurant.phone ? ` · ${restaurant.phone}` : ''}
      </p>
      {restaurant.owner && (
        <p className="text-text-muted text-[12px]">
          Owner:{' '}
          <span className="text-paper">
            {restaurant.owner.full_name ?? restaurant.owner.email}
          </span>{' '}
          ({restaurant.owner.email})
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {restaurant.status !== 'active' && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => act('active', 'Restaurant approved')}
          >
            {restaurant.status === 'suspended' ? 'Reactivate' : 'Approve'}
          </Button>
        )}
        {restaurant.status !== 'suspended' && (
          <Button
            variant="urgent-text"
            size="sm"
            disabled={pending}
            onClick={() => act('suspended', 'Restaurant suspended')}
          >
            Suspend
          </Button>
        )}
        {restaurant.status !== 'pending_approval' && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => act('pending_approval', 'Moved back to pending')}
          >
            Mark pending
          </Button>
        )}
      </div>
    </Card>
  );
}

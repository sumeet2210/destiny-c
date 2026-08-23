'use client';

import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { Card } from '@/components/ui/Card';
import { getOverview } from '@/lib/api/admin';
import { useApi } from '@/lib/hooks/useApi';
import { cn } from '@/lib/cn';

export function AdminOverviewView() {
  const { data, error, reload } = useApi(() => getOverview(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Platform overview
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          A live snapshot of accounts, listings, reservations and the moderation
          queue.
        </p>
      </div>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingBlock label="Loading overview…" />
      ) : (
        <div className="space-y-6">
          <Section title="Users" total={data.users.total}>
            <Stat label="Students" value={data.users.student} />
            <Stat label="Owners" value={data.users.owner} />
            <Stat label="Admins" value={data.users.admin} />
          </Section>
          <Section title="Restaurants" total={data.restaurants.total}>
            <Stat
              label="Pending approval"
              value={data.restaurants.pending_approval}
              tone="urgent"
            />
            <Stat label="Active" value={data.restaurants.active} />
            <Stat label="Suspended" value={data.restaurants.suspended} />
          </Section>
          <Section title="Bookings">
            <Stat label="Requested" value={data.bookings.requested} />
            <Stat label="Confirmed" value={data.bookings.confirmed} />
            <Stat label="Completed" value={data.bookings.completed} />
            <Stat label="Cancelled" value={data.bookings.cancelled} />
          </Section>
          <Section title="Moderation">
            <Stat label="Live offers" value={data.moderation.offers_live} />
            <Stat
              label="Flagged offers"
              value={data.moderation.offers_flagged}
              tone="urgent"
            />
            <Stat label="Events" value={data.moderation.events} />
            <Stat label="Reviews" value={data.moderation.reviews} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  total,
  children,
}: {
  title: string;
  total?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-paper text-sm font-semibold">{title}</h2>
        {total !== undefined && (
          <span className="text-text-muted text-[12px]">{total} total</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'urgent';
}) {
  return (
    <Card className="space-y-1">
      <p
        className={cn(
          'font-display text-2xl font-extrabold',
          tone === 'urgent' && value > 0
            ? 'text-accent-urgent-text'
            : 'text-paper',
        )}
      >
        {value}
      </p>
      <p className="text-text-muted text-[12px]">{label}</p>
    </Card>
  );
}

'use client';

// Owner dashboard, client-rendered. Auth moved into Express, so the bundle and
// analytics are fetched after mount instead of on the server. The old
// isSupabaseConfigured() seed-mode notice is gone — the frontend can no longer
// see whether the backend is in seed mode, and that concern now lives entirely
// server-side.
import { useState } from 'react';
import Link from 'next/link';
import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { CreateRestaurantForm } from '@/components/features/owner/CreateRestaurantForm';
import { Card } from '@/components/ui/Card';
import { getOwnerAnalytics, getOwnerBundle } from '@/lib/api/owner';
import type { OwnerBundle } from '@/lib/api/types';
import { useApi } from '@/lib/hooks/useApi';
import { nowMs } from '@/lib/now';

export function DashboardView() {
  const { data: bundle, loading, error, reload } = useApi(
    () => getOwnerBundle(),
    [],
  );

  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (loading && !bundle) return <LoadingBlock label="Loading your dashboard…" />;

  if (!bundle) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Add your restaurant
        </h1>
        <p className="text-text-muted text-sm">
          Tell us the basics. Once submitted it goes for a quick manual approval
          — students can&apos;t see it until then.
        </p>
        <CreateRestaurantForm onChanged={reload} />
      </div>
    );
  }

  const { restaurant } = bundle;

  // P4-4: the awaiting-approval holding screen.
  if (restaurant.status === 'pending_approval') {
    return (
      <Notice title="Awaiting approval">
        <span className="text-paper">{restaurant.name}</span> is submitted and
        waiting on a quick manual check — usually within a day. You can already
        set up your{' '}
        <Link
          href="/owner/menu"
          className="text-accent-primary hover:underline"
        >
          menu
        </Link>
        ,{' '}
        <Link
          href="/owner/photos"
          className="text-accent-primary hover:underline"
        >
          photos
        </Link>{' '}
        and{' '}
        <Link
          href="/owner/profile"
          className="text-accent-primary hover:underline"
        >
          hours
        </Link>{' '}
        so everything goes live at once.
      </Notice>
    );
  }

  if (restaurant.status === 'suspended') {
    return (
      <Notice title="Listing suspended">
        Your listing is currently hidden. Get in touch with the Destiny team to
        sort it out.
      </Notice>
    );
  }

  return <ActiveDashboard bundle={bundle} />;
}

function ActiveDashboard({ bundle }: { bundle: OwnerBundle }) {
  const { restaurant, menu, offers, events } = bundle;
  // Analytics only matters for a live listing, so it's fetched here rather than
  // alongside the bundle — pending/suspended restaurants never request it.
  const { data: analytics } = useApi(() => getOwnerAnalytics(), []);
  const [now] = useState(() => nowMs());

  const liveOffers = offers.filter(
    (o) => o.is_active && new Date(o.expires_at).getTime() > now,
  );
  const upcomingEvents = events.filter(
    (e) => !e.is_cancelled && new Date(e.starts_at).getTime() > now,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          {restaurant.name}
        </h1>
        <p className="text-accent-secondary text-[13px]">Live on Destiny</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Profile views, last 7 days"
          value={analytics?.totals.last7 ?? 0}
          hint="Page views on Destiny — not footfall."
        />
        <Stat label="Live offers" value={liveOffers.length} />
        <Stat label="Upcoming events" value={upcomingEvents.length} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink
          href="/owner/offers"
          title="Post a live offer"
          body="Today's special, a student discount, whatever gets them in the door. Expires end-of-day unless you say otherwise."
        />
        <QuickLink
          href="/owner/events"
          title="Post an event"
          body="Live music, quiz night, a screening — events reach the whole campus feed."
        />
        <QuickLink
          href="/owner/menu"
          title={`Menu (${menu.length} items)`}
          body="Prices and availability. Students search by dish, so every item you list is a doorway."
        />
        <QuickLink
          href="/owner/bookings"
          title="Bookings"
          body="Review incoming reservation requests, accept or reject them, and leave a note for the student."
        />
      </div>
    </div>
  );
}

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="max-w-lg space-y-2">
      <h1 className="font-display text-paper text-xl font-bold">{title}</h1>
      <p className="text-text-muted text-sm">{children}</p>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-text-muted text-[13px]">{label}</p>
      <p className="font-display text-paper mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-text-muted mt-1 text-[11px]">{hint}</p>}
    </Card>
  );
}

function QuickLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-accent-primary h-full transition-colors">
        <p className="text-paper text-sm font-semibold">{title}</p>
        <p className="text-text-muted mt-1 text-[13px]">{body}</p>
      </Card>
    </Link>
  );
}

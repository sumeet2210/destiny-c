import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { CreateRestaurantForm } from '@/components/features/owner/CreateRestaurantForm';
import { getOwnerBundle } from '@/lib/queries/owner';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const metadata = { title: 'Owner dashboard' };

export default async function OwnerDashboard() {
  if (!isSupabaseConfigured()) {
    return (
      <Notice title="Running on seed data">
        Owner tools need a live Supabase project. Add the env vars from
        .env.example and restart.
      </Notice>
    );
  }

  const bundle = await getOwnerBundle();

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
        <CreateRestaurantForm />
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

  redirect('/owner/analytics');
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

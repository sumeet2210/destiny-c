import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { ProfileReviewSubmit } from '@/components/features/owner/ProfileReviewSubmit';
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
      <Notice title="No approved restaurant linked">
        Restaurant accounts are created only from an approved application.
        Return to the restaurant portal or contact Destiny support if your
        application was already approved.
      </Notice>
    );
  }

  const { restaurant } = bundle;

  if (
    String(restaurant.status) === 'profile_incomplete' ||
    String(restaurant.status) === 'pending_approval'
  ) {
    return (
      <Notice title="Complete your restaurant profile">
        Your application is approved and the account is ready. Complete your{' '}
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
        , then submit the completed profile for final review.
        <ProfileReviewSubmit />
      </Notice>
    );
  }

  if (String(restaurant.status) === 'profile_review') {
    return (
      <Notice title="Profile under review">
        Destiny is reviewing the completed profile for {restaurant.name}. It
        will become publicly visible only after activation.
      </Notice>
    );
  }

  if (String(restaurant.status) === 'suspended') {
    return (
      <Notice title="Listing suspended">
        Your listing is currently hidden. Get in touch with the Destiny team to
        sort it out.
      </Notice>
    );
  }

  if (
    String(restaurant.status) === 'live' ||
    String(restaurant.status) === 'active'
  ) {
    redirect('/owner/analytics');
  }

  return <Notice title="Profile unavailable">Contact Destiny support.</Notice>;
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
      <div className="text-text-muted text-sm">{children}</div>
    </Card>
  );
}

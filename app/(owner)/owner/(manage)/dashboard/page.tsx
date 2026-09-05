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
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-6">
        <Card
          role="status"
          className="bg-surface-raised flex min-h-80 w-full max-w-2xl flex-col items-center justify-center px-6 py-10 text-center shadow-xl sm:min-h-96 sm:px-12"
        >
          <span
            className="bg-accent-primary mb-6 block h-1 w-12 rounded-full"
            aria-hidden
          />
          <h1 className="font-display text-paper text-2xl font-extrabold sm:text-3xl">
            Awaiting approval
          </h1>
          <p className="text-text-muted mt-4 max-w-xl text-sm leading-6 sm:text-base sm:leading-7">
            <span className="text-paper font-semibold">{restaurant.name}</span>{' '}
            is submitted and waiting on a quick manual check — usually within a
            day.
          </p>
          <p className="text-text-muted mt-3 max-w-xl text-sm leading-6 sm:text-base sm:leading-7">
            You can already set up your{' '}
            <span className="text-paper font-semibold">menu</span>,{' '}
            <span className="text-paper font-semibold">photos</span> and{' '}
            <span className="text-paper font-semibold">hours</span> so
            everything goes live at once.
          </p>
        </Card>
      </div>
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

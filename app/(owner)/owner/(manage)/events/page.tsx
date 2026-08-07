import { redirect } from 'next/navigation';
import { EventManager } from '@/components/features/owner/EventManager';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Events' };

export default async function OwnerEventsPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Events
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Events show on your profile, the events page and the homepage — a
          campus crowd plans evenings around them.
        </p>
      </div>
      <EventManager
        events={bundle.events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          event_type: e.event_type,
          starts_at: e.starts_at,
          ends_at: e.ends_at,
          is_cancelled: e.is_cancelled,
        }))}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { HoursEditor } from '@/components/features/owner/HoursEditor';
import type { OpeningHours } from '@/lib/domain/hours';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Timing & Hours' };

export default async function OwnerHoursPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="w-full">
      <HoursEditor
        initial={(bundle.restaurant.opening_hours as OpeningHours | null) ?? {}}
      />
    </div>
  );
}

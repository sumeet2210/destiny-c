import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/features/owner/ProfileForm';
import { HoursEditor } from '@/components/features/owner/HoursEditor';
import { getOwnerBundle } from '@/lib/queries/owner';
import type { OpeningHours } from '@/lib/domain/hours';

export const metadata = { title: 'Profile & hours' };

export default async function OwnerProfilePage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');
  const r = bundle.restaurant;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        Profile &amp; hours
      </h1>
      <ProfileForm
        initial={{
          name: r.name,
          description: r.description,
          area: r.area,
          address: r.address,
          phone: r.phone,
          lat: r.lat,
          lng: r.lng,
          is_veg_only: r.is_veg_only,
          has_ac: r.has_ac,
          dine_in: r.dine_in,
          takeaway: r.takeaway,
          student_discount: r.student_discount,
          price_per_head: r.price_per_head,
          vibe_tags: r.vibe_tags,
        }}
      />
      <HoursEditor initial={(r.opening_hours as OpeningHours | null) ?? {}} />
    </div>
  );
}

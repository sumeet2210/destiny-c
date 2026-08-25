import { redirect } from 'next/navigation';
import { HoursEditor } from '@/components/features/owner/HoursEditor';
import { ProfileForm } from '@/components/features/owner/ProfileForm';
import type { OpeningHours } from '@/lib/domain/hours';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Profile' };

export default async function OwnerProfilePage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');
  const r = bundle.restaurant;

  return (
    <div className="w-full space-y-8">
      <ProfileForm
        initial={{
          name: r.name,
          owner_name: r.owner_name ?? null,
          description: r.description,
          restaurant_category: r.restaurant_category ?? null,
          cuisines: r.cuisines ?? [],
          area: r.area,
          address: r.address,
          phone: r.phone,
          lat: r.lat,
          lng: r.lng,
          has_ac: r.has_ac,
          dine_in: r.dine_in,
          takeaway: r.takeaway,
          delivery: r.delivery ?? false,
          outdoor_seating: r.outdoor_seating ?? false,
          parking: r.parking ?? false,
          wifi: r.wifi ?? false,
          upi_card: r.upi_card ?? false,
          wheelchair_accessible: r.wheelchair_accessible ?? false,
          family_friendly: r.family_friendly ?? false,
          student_discount: r.student_discount,
          vibe_tags: r.vibe_tags,
        }}
      />
      <HoursEditor initial={(r.opening_hours as OpeningHours | null) ?? {}} />
    </div>
  );
}

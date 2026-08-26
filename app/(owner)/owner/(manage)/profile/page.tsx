import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/features/owner/ProfileForm';
import { HoursEditor } from '@/components/features/owner/HoursEditor';
import { getOwnerBundle } from '@/lib/queries/owner';
import type { OpeningHours } from '@/lib/domain/hours';

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
          owner_name: r.owner_name,
          restaurant_category: r.restaurant_category,
          cuisines: r.cuisines,
          delivery: r.delivery,
          outdoor_seating: r.outdoor_seating,
          parking: r.parking,
          wifi: r.wifi,
          upi_card: r.upi_card,
          wheelchair_accessible: r.wheelchair_accessible,
          family_friendly: r.family_friendly,
        }}
      />
      <HoursEditor initial={(r.opening_hours as OpeningHours | null) ?? {}} />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/features/owner/ProfileForm';
import { getSessionUser } from '@/lib/auth/session';
import { maskAccountEmail } from '@/lib/domain/owner-password';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Profile' };

export default async function OwnerProfilePage() {
  const [bundle, user] = await Promise.all([
    getOwnerBundle(),
    getSessionUser(),
  ]);
  if (!bundle) redirect('/owner/dashboard');
  const r = bundle.restaurant;

  return (
    <div className="w-full space-y-8">
      <ProfileForm
        maskedEmail={maskAccountEmail(user?.email ?? '')}
        coverUrl={r.cover_image_url}
        photos={bundle.photos
          .filter((photo) => photo.kind === 'gallery')
          .map((photo) => ({ id: photo.id, url: photo.url }))}
        initial={{
          name: r.name,
          description: r.description,
          area: r.area,
          address: r.address,
          phone: r.phone,
          google_maps_url: r.google_maps_url,
          is_veg_only: r.is_veg_only,
          has_ac: r.has_ac,
          dine_in: r.dine_in,
          takeaway: r.takeaway,
          student_discount: r.student_discount,
          price_per_head: r.price_per_head,
          vibe_tags: r.vibe_tags,
          owner_name: r.owner_name,
          restaurant_categories:
            (r.restaurant_categories?.length ?? 0) > 0
              ? r.restaurant_categories
              : r.restaurant_category
                ? [r.restaurant_category]
                : [],
          cuisines: r.cuisines,
          custom_facilities: r.custom_facilities ?? [],
          delivery: r.delivery,
          outdoor_seating: r.outdoor_seating,
          parking: r.parking,
          wifi: r.wifi,
          upi_card: r.upi_card,
          wheelchair_accessible: r.wheelchair_accessible,
          family_friendly: r.family_friendly,
        }}
      />
    </div>
  );
}

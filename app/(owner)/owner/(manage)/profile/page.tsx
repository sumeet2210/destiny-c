import { redirect } from 'next/navigation';
import { OwnerPasswordManager } from '@/components/features/owner/OwnerPasswordManager';
import { ProfileForm } from '@/components/features/owner/ProfileForm';
import { PhotoManager } from '@/components/features/owner/PhotoManager';
import { getSessionUser } from '@/lib/auth/session';
import { maskAccountEmail } from '@/lib/domain/owner-password';
import { getOwnerBundle, getOwnerGalleryFolders } from '@/lib/queries/owner';

export const metadata = { title: 'Profile' };

export default async function OwnerProfilePage() {
  const [bundle, folders, user] = await Promise.all([
    getOwnerBundle(),
    getOwnerGalleryFolders(),
    getSessionUser(),
  ]);
  if (!bundle) redirect('/owner/dashboard');
  const r = bundle.restaurant;

  return (
    <div className="w-full space-y-8">
      <OwnerPasswordManager maskedEmail={maskAccountEmail(user?.email ?? '')} />
      <ProfileForm
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
      <PhotoManager
        coverUrl={r.cover_image_url}
        folderNames={folders.map((folder) => folder.name)}
        photos={bundle.photos.map((photo) => ({
          id: photo.id,
          url: photo.url,
          kind: photo.kind,
          gallery_category: photo.gallery_category,
        }))}
      />
    </div>
  );
}

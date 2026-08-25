import { redirect } from 'next/navigation';
import { PhotoManager } from '@/components/features/owner/PhotoManager';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Photos' };

export default async function OwnerPhotosPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="w-full space-y-6">
      <PhotoManager
        coverUrl={bundle.restaurant.cover_image_url}
        photos={bundle.photos.map((p) => ({
          id: p.id,
          url: p.url,
          kind: p.kind,
          gallery_category: p.gallery_category ?? null,
        }))}
      />
    </div>
  );
}

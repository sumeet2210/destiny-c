import { redirect } from 'next/navigation';
import { PhotoManager } from '@/components/features/owner/PhotoManager';
import { getOwnerBundle } from '@/lib/queries/owner';

export const metadata = { title: 'Photos' };

export default async function OwnerPhotosPage() {
  const bundle = await getOwnerBundle();
  if (!bundle) redirect('/owner/dashboard');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-paper text-2xl font-extrabold">
          Photos
        </h1>
        <p className="text-text-muted mt-1 text-[13px]">
          Cover, gallery, and menu photos. Images are resized on your device
          before upload, so even phone photos are quick.
        </p>
      </div>
      <PhotoManager
        coverUrl={bundle.restaurant.cover_image_url}
        photos={bundle.photos.map((p) => ({
          id: p.id,
          url: p.url,
          kind: p.kind,
          gallery_category: p.gallery_category,
        }))}
      />
    </div>
  );
}

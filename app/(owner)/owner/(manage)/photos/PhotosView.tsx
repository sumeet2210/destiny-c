'use client';

import { OwnerBundleGate } from '@/components/features/owner/OwnerBundleGate';
import { PhotoManager } from '@/components/features/owner/PhotoManager';

export function PhotosView() {
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
      <OwnerBundleGate>
        {(bundle, reload) => (
          <PhotoManager
            coverUrl={bundle.restaurant.cover_image_url}
            photos={bundle.photos.map((p) => ({
              id: p.id,
              url: p.url,
              kind: p.kind,
            }))}
            onChanged={reload}
          />
        )}
      </OwnerBundleGate>
    </div>
  );
}

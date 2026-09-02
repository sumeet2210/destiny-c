'use client';

// P5-5 / P5-6: upload with client-side resize to ≤1600px WebP, plus gallery
// and menu-photo management (reorder, delete).

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { deletePhoto, reorderPhotos, uploadPhoto } from '@/lib/owner/actions';

type Photo = {
  id: string;
  url: string;
  kind: 'gallery' | 'menu_photo';
};

const MAX_PHOTOS_PER_UPLOAD = 6;

export async function resizeToWebp(file: File, maxDim = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not encode image'))),
      'image/webp',
      0.82,
    ),
  );
}

export function PhotoManager({
  coverUrl,
  photos,
  mode = 'gallery',
}: {
  coverUrl?: string | null;
  photos: Photo[];
  mode?: 'gallery' | 'menu';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const coverFileRef = useRef<HTMLInputElement>(null);
  const photosFileRef = useRef<HTMLInputElement>(null);

  const gallery = photos.filter((p) => p.kind === 'gallery');
  const menuPhotos = photos.filter((p) => p.kind === 'menu_photo');

  const onFiles = async (
    files: File[],
    target: { kind: 'gallery' | 'menu_photo'; asCover: boolean },
  ) => {
    if (files.length === 0) return;
    if (!target.asCover && files.length > MAX_PHOTOS_PER_UPLOAD) {
      toast(`Select up to ${MAX_PHOTOS_PER_UPLOAD} photos at a time.`, 'error');
      if (photosFileRef.current) photosFileRef.current.value = '';
      return;
    }

    const selectedFiles = target.asCover ? files.slice(0, 1) : files;
    setUploading(true);
    let uploaded = 0;
    let failureMessage = '';

    for (const file of selectedFiles) {
      try {
        const blob = await resizeToWebp(file);
        const fd = new FormData();
        fd.set('file', new File([blob], 'photo.webp', { type: 'image/webp' }));
        fd.set('kind', target.kind);
        if (target.asCover) fd.set('as_cover', '1');
        const result = await uploadPhoto(fd);
        if (result.ok) uploaded += 1;
        else if (!failureMessage) {
          failureMessage = result.message ?? 'Upload failed';
        }
      } catch {
        if (!failureMessage) failureMessage = 'Could not process an image';
      }
    }

    if (uploaded > 0) router.refresh();
    if (uploaded === selectedFiles.length) {
      toast(
        target.asCover
          ? 'Cover photo uploaded'
          : `${uploaded} ${uploaded === 1 ? 'photo' : 'photos'} uploaded`,
        'positive',
      );
    } else {
      toast(
        uploaded > 0
          ? `${uploaded} of ${selectedFiles.length} photos uploaded. ${failureMessage}`
          : failureMessage,
        'error',
      );
    }

    setUploading(false);
    if (coverFileRef.current) coverFileRef.current.value = '';
    if (photosFileRef.current) photosFileRef.current.value = '';
  };

  const move = (list: Photo[], index: number, dir: -1 | 1) => {
    const next = [...list];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    startTransition(async () => {
      const res = await reorderPhotos(next.map((p) => p.id));
      if (res.ok) router.refresh();
      else toast(res.message ?? 'Could not reorder photos', 'error');
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      const res = await deletePhoto(id);
      if (res.ok) router.refresh();
      else toast(res.message ?? 'Could not delete', 'error');
    });

  return (
    <div className="space-y-6">
      <input
        ref={coverFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) =>
          void onFiles(Array.from(event.target.files ?? []), {
            kind: 'gallery',
            asCover: true,
          })
        }
      />
      <input
        ref={photosFileRef}
        type="file"
        accept="image/*"
        multiple={mode === 'gallery'}
        className="hidden"
        onChange={(event) =>
          void onFiles(Array.from(event.target.files ?? []), {
            kind: mode === 'gallery' ? 'gallery' : 'menu_photo',
            asCover: false,
          })
        }
      />

      {mode === 'gallery' ? (
        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card className="w-full max-w-sm space-y-3 lg:max-w-none">
            <h2 className="text-paper text-sm font-semibold">Cover photo</h2>
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage URL, pre-resized
              <img
                src={coverUrl}
                alt="Cover"
                className="rounded-control aspect-[8/5] w-full max-w-xs object-cover"
              />
            ) : (
              <p className="text-text-muted text-[13px]">
                No cover yet — this is the first thing students see.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => coverFileRef.current?.click()}
            >
              {uploading
                ? 'Uploading…'
                : coverUrl
                  ? 'Replace cover'
                  : 'Upload cover'}
            </Button>
          </Card>

          <PhotoSection
            title="Gallery"
            description={`Select up to ${MAX_PHOTOS_PER_UPLOAD} photos at a time.`}
            addLabel={uploading ? 'Uploading…' : '+ Add photos'}
            emptyMessage="No gallery photos yet. Add photos to get started."
            photos={gallery}
            onAdd={() => photosFileRef.current?.click()}
            onMove={(i, d) => move(gallery, i, d)}
            onRemove={remove}
            disabled={uploading || pending}
          />
        </div>
      ) : (
        <PhotoSection
          title="Menu photos"
          photos={menuPhotos}
          onAdd={() => photosFileRef.current?.click()}
          onMove={(i, d) => move(menuPhotos, i, d)}
          onRemove={remove}
          disabled={uploading || pending}
        />
      )}
    </div>
  );
}

function PhotoSection({
  title,
  description,
  addLabel = '+ Add',
  emptyMessage = 'Nothing here yet.',
  photos,
  onAdd,
  onMove,
  onRemove,
  disabled,
}: {
  title: string;
  description?: string;
  addLabel?: string;
  emptyMessage?: string;
  photos: Photo[];
  onAdd: () => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-paper text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="text-text-muted mt-1 text-[12px]">{description}</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
      {photos.length === 0 ? (
        <p className="text-text-muted text-[13px]">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <div key={p.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage URL, pre-resized */}
              <img
                src={p.url}
                alt=""
                className="rounded-control aspect-[8/5] w-full object-cover"
              />
              <div className="flex justify-between text-[13px]">
                <span>
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={disabled || i === 0}
                    onClick={() => onMove(i, -1)}
                    className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={disabled || i === photos.length - 1}
                    onClick={() => onMove(i, 1)}
                    className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(p.id)}
                  className="text-accent-urgent-text px-1"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

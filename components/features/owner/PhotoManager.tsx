'use client';

// P5-5 / P5-6: upload with client-side resize to ≤1600px WebP, plus gallery
// and menu-photo management (reorder, delete).

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { deletePhoto, reorderPhotos, uploadPhoto } from '@/lib/owner/actions';

type Photo = { id: string; url: string; kind: 'gallery' | 'menu_photo' };

async function resizeToWebp(file: File, maxDim = 1600): Promise<Blob> {
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
}: {
  coverUrl: string | null;
  photos: Photo[];
}) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<{
    kind: 'gallery' | 'menu_photo';
    asCover: boolean;
  }>({
    kind: 'gallery',
    asCover: false,
  });

  const gallery = photos.filter((p) => p.kind === 'gallery');
  const menuPhotos = photos.filter((p) => p.kind === 'menu_photo');

  const pickFile = (kind: 'gallery' | 'menu_photo', asCover = false) => {
    targetRef.current = { kind, asCover };
    fileRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeToWebp(file);
      const fd = new FormData();
      fd.set('file', new File([blob], 'photo.webp', { type: 'image/webp' }));
      fd.set('kind', targetRef.current.kind);
      if (targetRef.current.asCover) fd.set('as_cover', '1');
      const res = await uploadPhoto(fd);
      toast(
        res.ok ? 'Photo uploaded' : (res.message ?? 'Upload failed'),
        res.ok ? 'positive' : 'error',
      );
    } catch {
      toast('Could not process that image', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const move = (list: Photo[], index: number, dir: -1 | 1) => {
    const next = [...list];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    startTransition(async () => {
      await reorderPhotos(next.map((p) => p.id));
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      const res = await deletePhoto(id);
      if (!res.ok) toast(res.message ?? 'Could not delete', 'error');
    });

  return (
    <div className="space-y-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <Card className="space-y-3">
        <h2 className="text-paper text-sm font-semibold">Cover photo</h2>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL, pre-resized
          <img
            src={coverUrl}
            alt="Cover"
            className="rounded-control aspect-[8/5] w-full object-cover"
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
          onClick={() => pickFile('gallery', true)}
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
        photos={gallery}
        onAdd={() => pickFile('gallery')}
        onMove={(i, d) => move(gallery, i, d)}
        onRemove={remove}
        disabled={uploading || pending}
      />
      <PhotoSection
        title="Menu photos"
        subtitle="For menus easier to photograph than to type."
        photos={menuPhotos}
        onAdd={() => pickFile('menu_photo')}
        onMove={(i, d) => move(menuPhotos, i, d)}
        onRemove={remove}
        disabled={uploading || pending}
      />
    </div>
  );
}

function PhotoSection({
  title,
  subtitle,
  photos,
  onAdd,
  onMove,
  onRemove,
  disabled,
}: {
  title: string;
  subtitle?: string;
  photos: Photo[];
  onAdd: () => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-paper text-sm font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-text-muted text-[12px]">{subtitle}</p>
          )}
        </div>
        <Button variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
          + Add
        </Button>
      </div>
      {photos.length === 0 ? (
        <p className="text-text-muted text-[13px]">Nothing here yet.</p>
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

'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { deletePhoto, reorderPhotos, uploadPhoto } from '@/lib/owner/actions';

type MenuPhoto = { id: string; url: string };

async function resizeToWebp(file: File, maxDimension = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not encode image')),
      'image/webp',
      0.82,
    ),
  );
}

export function MenuPhotoManager({ photos }: { photos: MenuPhoto[] }) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeToWebp(file);
      const formData = new FormData();
      formData.set(
        'file',
        new File([blob], 'menu-photo.webp', { type: 'image/webp' }),
      );
      formData.set('kind', 'menu_photo');
      const result = await uploadPhoto(formData);
      toast(
        result.ok ? 'Menu photo uploaded' : (result.message ?? 'Upload failed'),
        result.ok ? 'positive' : 'error',
      );
    } catch {
      toast('Could not process that image', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...photos];
    const destination = index + direction;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    startTransition(async () => {
      await reorderPhotos(next.map((photo) => photo.id));
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      const result = await deletePhoto(id);
      if (!result.ok) toast(result.message ?? 'Could not delete', 'error');
    });

  const disabled = uploading || pending;
  return (
    <Card className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-paper text-sm font-semibold">Menu photos</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Uploading…' : '+ Add'}
        </Button>
      </div>
      {photos.length === 0 ? (
        <p className="text-text-muted text-[13px]">Nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- storage URL, pre-resized */}
              <img
                src={photo.url}
                alt="Menu"
                className="rounded-control aspect-[8/5] w-full object-cover"
              />
              <div className="flex justify-between text-[13px]">
                <span>
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={disabled || index === 0}
                    onClick={() => move(index, -1)}
                    className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={disabled || index === photos.length - 1}
                    onClick={() => move(index, 1)}
                    className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(photo.id)}
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

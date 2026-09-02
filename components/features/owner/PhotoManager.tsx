'use client';

// P5-5 / P5-6: client-side resize to ≤1600px WebP plus staged menu-photo
// management. The resize helper is also shared by offer/event photo uploads.

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { deletePhoto, reorderPhotos, uploadPhoto } from '@/lib/owner/actions';

type Photo = {
  id: string;
  url: string;
};

type DraftPhoto = Photo & {
  file?: File;
};

const MAX_PHOTOS_PER_SELECTION = 6;

const toDraftPhotos = (photos: Photo[]): DraftPhoto[] =>
  photos.map((photo) => ({ ...photo }));

export async function resizeToWebp(file: File, maxDim = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
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

export function PhotoManager({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(photos.length === 0);
  const [items, setItems] = useState<DraftPhoto[]>(() => toDraftPhotos(photos));
  const [savedOrder, setSavedOrder] = useState(() =>
    photos.map((photo) => photo.id),
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const draftUrlsRef = useRef(new Set<string>());

  const currentOrder = items
    .map((photo) => photo.id)
    .filter((id) => !id.startsWith('draft-'));
  const orderChanged =
    currentOrder.length !== savedOrder.length ||
    currentOrder.some((id, index) => id !== savedOrder[index]);
  const dirty =
    deletedIds.length > 0 || items.some((photo) => photo.file) || orderChanged;

  useEffect(
    () => () => {
      for (const url of draftUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    },
    [],
  );

  const releaseDraftUrl = (url: string) => {
    URL.revokeObjectURL(url);
    draftUrlsRef.current.delete(url);
  };

  const reset = () => {
    for (const photo of items) {
      if (photo.file) releaseDraftUrl(photo.url);
    }
    setItems(toDraftPhotos(photos));
    setSavedOrder(photos.map((photo) => photo.id));
    setDeletedIds([]);
    setEditing(photos.length === 0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const save = () => {
    startTransition(async () => {
      const workingItems = [...items];

      for (let index = 0; index < workingItems.length; index += 1) {
        const photo = workingItems[index];
        if (!photo.file) continue;
        try {
          const blob = await resizeToWebp(photo.file);
          const formData = new FormData();
          formData.set(
            'file',
            new File([blob], 'menu-photo.webp', { type: 'image/webp' }),
          );
          formData.set('kind', 'menu_photo');
          const result = await uploadPhoto(formData);
          if (!result.ok || !result.id || !result.url) {
            setItems(workingItems);
            toast(result.message ?? 'Could not save a menu photo.', 'error');
            return;
          }
          releaseDraftUrl(photo.url);
          workingItems[index] = { id: result.id, url: result.url };
          setItems([...workingItems]);
        } catch {
          setItems(workingItems);
          toast('Could not process a menu photo.', 'error');
          return;
        }
      }

      let remainingDeletedIds = [...deletedIds];
      for (const id of deletedIds) {
        const result = await deletePhoto(id);
        if (!result.ok) {
          setDeletedIds(remainingDeletedIds);
          toast(result.message ?? 'Could not delete a menu photo.', 'error');
          return;
        }
        remainingDeletedIds = remainingDeletedIds.filter(
          (deletedId) => deletedId !== id,
        );
        setDeletedIds(remainingDeletedIds);
      }

      const finalOrder = workingItems.map((photo) => photo.id);
      const reorderResult = await reorderPhotos(finalOrder);
      if (!reorderResult.ok) {
        toast(
          reorderResult.message ?? 'Could not reorder menu photos.',
          'error',
        );
        return;
      }

      setItems(workingItems);
      setSavedOrder(finalOrder);
      setDeletedIds([]);
      setEditing(finalOrder.length === 0);
      toast('Menu photos saved', 'positive');
      router.refresh();
    });
  };

  return (
    <Card className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length === 0) return;
          if (files.length > MAX_PHOTOS_PER_SELECTION) {
            toast(
              `Select up to ${MAX_PHOTOS_PER_SELECTION} photos at a time.`,
              'error',
            );
            event.target.value = '';
            return;
          }
          const drafts = files.map((file) => {
            const url = URL.createObjectURL(file);
            draftUrlsRef.current.add(url);
            return {
              id: `draft-${crypto.randomUUID()}`,
              url,
              file,
            };
          });
          setItems((current) => [...current, ...drafts]);
          event.target.value = '';
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-paper text-sm font-semibold">Menu photos</h2>
          <p className="text-text-muted mt-1 text-[12px]">
            {editing
              ? `Select up to ${MAX_PHOTOS_PER_SELECTION} photos at a time. Changes are applied when you save.`
              : 'Click Edit to add, remove, or reorder menu photos.'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              {dirty || savedOrder.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={reset}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                + Add photos
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-text-muted text-[13px]">
          No menu photos yet. Add photos to get started.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((photo, index) => (
            <div key={photo.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview or pre-resized storage URL */}
              <img
                src={photo.url}
                alt=""
                className="rounded-control aspect-[8/5] w-full object-cover"
              />
              {editing ? (
                <div className="flex justify-between text-[13px]">
                  <span>
                    <button
                      type="button"
                      aria-label="Move earlier"
                      disabled={pending || index === 0}
                      onClick={() => {
                        const next = [...items];
                        [next[index - 1], next[index]] = [
                          next[index],
                          next[index - 1],
                        ];
                        setItems(next);
                      }}
                      className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Move later"
                      disabled={pending || index === items.length - 1}
                      onClick={() => {
                        const next = [...items];
                        [next[index], next[index + 1]] = [
                          next[index + 1],
                          next[index],
                        ];
                        setItems(next);
                      }}
                      className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                    >
                      →
                    </button>
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (photo.file) releaseDraftUrl(photo.url);
                      else {
                        setDeletedIds((current) => [...current, photo.id]);
                      }
                      setItems((current) =>
                        current.filter((item) => item.id !== photo.id),
                      );
                    }}
                    className="text-accent-urgent-text px-1"
                  >
                    delete
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {editing && dirty ? (
        <Button type="button" disabled={pending} onClick={save}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
      ) : null}
    </Card>
  );
}

'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { resizeToWebp } from '@/components/features/owner/PhotoManager';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  deletePhoto,
  reorderPhotos,
  uploadPhoto,
  type ActionResult,
} from '@/lib/owner/actions';

export type ProfilePhoto = {
  id: string;
  url: string;
};

export type ProfilePhotoEditorHandle = {
  reset: () => void;
  save: () => Promise<ActionResult>;
};

type DraftPhoto = ProfilePhoto & {
  file?: File;
};

type CoverDraft = {
  file: File;
  url: string;
};

const MAX_PHOTOS_PER_SELECTION = 6;

const toDraftPhotos = (photos: ProfilePhoto[]): DraftPhoto[] =>
  photos.map((photo) => ({ ...photo }));

export const ProfilePhotoEditor = forwardRef<
  ProfilePhotoEditorHandle,
  {
    coverUrl: string | null;
    photos: ProfilePhoto[];
    editing: boolean;
    saving: boolean;
    onDirtyChange: (dirty: boolean) => void;
  }
>(function ProfilePhotoEditor(
  { coverUrl, photos, editing, saving, onDirtyChange },
  ref,
) {
  const toast = useToast();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [savedCoverUrl, setSavedCoverUrl] = useState(coverUrl);
  const [coverDraft, setCoverDraft] = useState<CoverDraft | null>(null);
  const [items, setItems] = useState<DraftPhoto[]>(() => toDraftPhotos(photos));
  const [savedOrder, setSavedOrder] = useState(() =>
    photos.map((photo) => photo.id),
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const itemsRef = useRef(items);
  const coverDraftRef = useRef(coverDraft);
  const initialSignature = `${coverUrl ?? ''}|${photos
    .map((photo) => `${photo.id}:${photo.url}`)
    .join('|')}`;
  const lastInitialSignatureRef = useRef(initialSignature);

  itemsRef.current = items;
  coverDraftRef.current = coverDraft;

  const currentOrder = items
    .map((photo) => photo.id)
    .filter((id) => !id.startsWith('draft-'));
  const orderChanged =
    currentOrder.length !== savedOrder.length ||
    currentOrder.some((id, index) => id !== savedOrder[index]);
  const dirty =
    coverDraft !== null ||
    deletedIds.length > 0 ||
    items.some((photo) => photo.file) ||
    orderChanged;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (lastInitialSignatureRef.current === initialSignature) return;
    lastInitialSignatureRef.current = initialSignature;
    if (dirty) return;
    setSavedCoverUrl(coverUrl);
    setItems(toDraftPhotos(photos));
    setSavedOrder(photos.map((photo) => photo.id));
  }, [coverUrl, dirty, initialSignature, photos]);

  useEffect(
    () => () => {
      if (coverDraftRef.current) {
        URL.revokeObjectURL(coverDraftRef.current.url);
      }
      for (const photo of itemsRef.current) {
        if (photo.file) URL.revokeObjectURL(photo.url);
      }
    },
    [],
  );

  const reset = () => {
    if (coverDraft) URL.revokeObjectURL(coverDraft.url);
    for (const photo of items) {
      if (photo.file) URL.revokeObjectURL(photo.url);
    }
    setSavedCoverUrl(coverUrl);
    setCoverDraft(null);
    setItems(toDraftPhotos(photos));
    setSavedOrder(photos.map((photo) => photo.id));
    setDeletedIds([]);
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  useImperativeHandle(ref, () => ({
    reset,
    save: async () => {
      const workingItems = [...items];

      if (coverDraft) {
        try {
          const blob = await resizeToWebp(coverDraft.file);
          const formData = new FormData();
          formData.set(
            'file',
            new File([blob], 'cover.webp', { type: 'image/webp' }),
          );
          formData.set('kind', 'gallery');
          formData.set('as_cover', '1');
          const result = await uploadPhoto(formData);
          if (!result.ok) return result;
          setSavedCoverUrl(result.url ?? savedCoverUrl);
          URL.revokeObjectURL(coverDraft.url);
          setCoverDraft(null);
        } catch {
          return { ok: false, message: 'Could not process the cover photo.' };
        }
      }

      for (let index = 0; index < workingItems.length; index += 1) {
        const photo = workingItems[index];
        if (!photo.file) continue;
        try {
          const blob = await resizeToWebp(photo.file);
          const formData = new FormData();
          formData.set(
            'file',
            new File([blob], 'photo.webp', { type: 'image/webp' }),
          );
          formData.set('kind', 'gallery');
          const result = await uploadPhoto(formData);
          if (!result.ok || !result.id || !result.url) {
            setItems(workingItems);
            return {
              ok: false,
              message: result.message ?? 'Could not save a gallery photo.',
            };
          }
          URL.revokeObjectURL(photo.url);
          workingItems[index] = {
            id: result.id,
            url: result.url,
          };
          setItems([...workingItems]);
        } catch {
          setItems(workingItems);
          return { ok: false, message: 'Could not process a gallery photo.' };
        }
      }

      let remainingDeletedIds = [...deletedIds];
      for (const id of deletedIds) {
        const result = await deletePhoto(id);
        if (!result.ok) {
          setDeletedIds(remainingDeletedIds);
          return result;
        }
        remainingDeletedIds = remainingDeletedIds.filter(
          (deletedId) => deletedId !== id,
        );
        setDeletedIds(remainingDeletedIds);
      }

      const finalOrder = workingItems.map((photo) => photo.id);
      const reorderResult = await reorderPhotos(finalOrder);
      if (!reorderResult.ok) return reorderResult;

      setItems(workingItems);
      setSavedOrder(finalOrder);
      setDeletedIds([]);
      return { ok: true };
    },
  }));

  const disabled = !editing || saving;
  const displayCoverUrl = coverDraft?.url ?? savedCoverUrl;

  return (
    <section className="border-border-hairline space-y-4 border-t pt-6">
      <div>
        <h2 className="font-display text-paper text-lg font-bold">Photos</h2>
        <p className="text-text-muted mt-1 text-xs">
          {editing
            ? `Select up to ${MAX_PHOTOS_PER_SELECTION} gallery photos at a time. Changes are applied when you save.`
            : 'Click Edit to change the cover photo or gallery.'}
        </p>
      </div>

      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (coverDraft) URL.revokeObjectURL(coverDraft.url);
          setCoverDraft({ file, url: URL.createObjectURL(file) });
          event.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
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
          setItems((current) => [
            ...current,
            ...files.map((file) => ({
              id: `draft-${crypto.randomUUID()}`,
              url: URL.createObjectURL(file),
              file,
            })),
          ]);
          event.target.value = '';
        }}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="border-border-hairline bg-surface-muted rounded-card space-y-3 border p-4">
          <h3 className="text-paper text-sm font-semibold">Cover photo</h3>
          {displayCoverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview or pre-resized storage URL
            <img
              src={displayCoverUrl}
              alt="Cover"
              className="rounded-control aspect-[8/5] w-full object-cover"
            />
          ) : (
            <p className="text-text-muted text-[13px]">No cover photo yet.</p>
          )}
          {editing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => coverInputRef.current?.click()}
            >
              {displayCoverUrl ? 'Replace cover' : 'Add cover'}
            </Button>
          ) : null}
        </div>

        <div className="border-border-hairline bg-surface-muted rounded-card space-y-3 border p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-paper text-sm font-semibold">
              Gallery ({items.length})
            </h3>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => galleryInputRef.current?.click()}
              >
                + Add photos
              </Button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="text-text-muted text-[13px]">
              No gallery photos yet.
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
                          disabled={disabled || index === 0}
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
                          disabled={disabled || index === items.length - 1}
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
                        disabled={disabled}
                        onClick={() => {
                          if (photo.file) URL.revokeObjectURL(photo.url);
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
        </div>
      </div>
    </section>
  );
});

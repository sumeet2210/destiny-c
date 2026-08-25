'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  deletePhoto,
  renameGalleryFolder,
  reorderPhotos,
  uploadPhoto,
} from '@/lib/owner/actions';

type Photo = {
  id: string;
  url: string;
  kind: 'gallery' | 'menu_photo';
  gallery_category: string | null;
};

const folderOf = (photo: Photo) => photo.gallery_category?.trim() || 'Gallery';

async function resizeToWebp(file: File, maxDim = 1600): Promise<Blob> {
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

export function PhotoManager({
  coverUrl,
  photos,
}: {
  coverUrl: string | null;
  photos: Photo[];
}) {
  const gallery = photos.filter((photo) => photo.kind === 'gallery');
  const initialFolders = [...new Set(gallery.map(folderOf))];
  if (initialFolders.length === 0) initialFolders.push('Gallery');
  const [folders, setFolders] = useState(initialFolders);
  const [activeFolder, setActiveFolder] = useState(initialFolders[0]);
  const [folderName, setFolderName] = useState(initialFolders[0]);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ asCover: boolean; folder: string }>({
    asCover: false,
    folder: initialFolders[0],
  });
  const toast = useToast();
  const folderPhotos = gallery.filter(
    (photo) => folderOf(photo) === activeFolder,
  );

  const pickFile = (asCover = false, folder = activeFolder) => {
    uploadTarget.current = { asCover, folder };
    fileRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeToWebp(file);
      const formData = new FormData();
      formData.set(
        'file',
        new File([blob], 'photo.webp', { type: 'image/webp' }),
      );
      formData.set('kind', 'gallery');
      formData.set('gallery_category', uploadTarget.current.folder);
      if (uploadTarget.current.asCover) formData.set('as_cover', '1');
      const result = await uploadPhoto(formData);
      toast(
        result.ok ? 'Photo uploaded' : (result.message ?? 'Upload failed'),
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
    const next = [...folderPhotos];
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
    <div className="space-y-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0])}
      />

      <Card className="flex flex-wrap items-center gap-4">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL, pre-resized
          <img
            src={coverUrl}
            alt="Cover"
            className="rounded-control h-24 w-36 shrink-0 object-cover"
          />
        ) : (
          <div className="border-border-hairline text-text-muted rounded-control flex h-24 w-36 shrink-0 items-center justify-center border border-dashed text-xs">
            No cover
          </div>
        )}
        <div className="min-w-44 flex-1 space-y-2">
          <h2 className="text-paper text-sm font-semibold">Cover photo</h2>
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => pickFile(true)}
          >
            {uploading
              ? 'Uploading…'
              : coverUrl
                ? 'Replace cover'
                : 'Upload cover'}
          </Button>
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-paper text-lg font-bold">
              Gallery
            </h2>
            <p className="text-text-muted mt-1 text-xs">
              Organize your restaurant story into visual folders.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setAddingFolder((current) => !current)}
            aria-expanded={addingFolder}
          >
            {addingFolder ? 'Cancel' : '+ Add folder'}
          </Button>
        </div>

        {addingFolder ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const name = newFolderName.trim().slice(0, 40);
              if (!name) return;
              if (!folders.includes(name)) {
                setFolders((current) => [...current, name]);
              }
              setActiveFolder(name);
              setFolderName(name);
              setNewFolderName('');
              setAddingFolder(false);
            }}
          >
            <Input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              maxLength={40}
              placeholder="New folder name"
              aria-label="New gallery folder name"
              autoFocus
            />
            <Button type="submit" size="sm" className="shrink-0">
              Create
            </Button>
          </form>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {folders.map((folder) => {
            const count = gallery.filter(
              (photo) => folderOf(photo) === folder,
            ).length;
            const active = activeFolder === folder;
            return (
              <button
                key={folder}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setActiveFolder(folder);
                  setFolderName(folder);
                }}
                className={`rounded-control border p-3 text-left transition-colors ${
                  active
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-hairline bg-surface-raised hover:border-text-muted'
                }`}
              >
                <span className="text-paper block text-sm font-semibold">
                  {folder}
                </span>
                <span className="text-text-muted text-xs">
                  {count} {count === 1 ? 'photo' : 'photos'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="border-border-hairline border-t pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <form
              className="flex min-w-56 flex-1 gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const nextName = folderName.trim().slice(0, 40);
                if (!nextName || nextName === activeFolder) return;
                const previousName = activeFolder;
                startTransition(async () => {
                  const result = await renameGalleryFolder(
                    previousName,
                    nextName,
                  );
                  toast(
                    result.ok
                      ? 'Folder renamed'
                      : (result.message ?? 'Could not rename folder'),
                    result.ok ? 'positive' : 'error',
                  );
                  if (result.ok) {
                    setFolders((current) => [
                      ...new Set(
                        current.map((name) =>
                          name === previousName ? nextName : name,
                        ),
                      ),
                    ]);
                    setActiveFolder(nextName);
                  }
                });
              }}
            >
              <Input
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                maxLength={40}
                aria-label="Folder name"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={pending || !folderName.trim()}
              >
                Rename
              </Button>
            </form>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => pickFile(false, activeFolder)}
            >
              {uploading ? 'Uploading…' : '+ Add photo'}
            </Button>
          </div>
          {folderPhotos.length === 0 ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => pickFile(false, activeFolder)}
              className="border-border-hairline text-text-muted rounded-control hover:border-accent-primary hover:text-paper flex min-h-28 w-full items-center justify-center border border-dashed text-sm transition-colors"
            >
              Add the first photo to {activeFolder}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {folderPhotos.map((photo, index) => (
                <div key={photo.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage URL, pre-resized */}
                  <img
                    src={photo.url}
                    alt={`${activeFolder} photo`}
                    className="rounded-control aspect-square w-full object-cover"
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
                        disabled={disabled || index === folderPhotos.length - 1}
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
        </div>
      </Card>
    </div>
  );
}

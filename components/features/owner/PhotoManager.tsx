'use client';

// P5-5 / P5-6: upload with client-side resize to ≤1600px WebP, plus gallery
// and menu-photo management (reorder, delete).

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  createGalleryFolder,
  deletePhoto,
  renameGalleryFolder,
  reorderPhotos,
  setPhotoFolder,
  uploadPhoto,
} from '@/lib/owner/actions';

type Photo = {
  id: string;
  url: string;
  kind: 'gallery' | 'menu_photo';
  gallery_category: string | null;
};

/** Label for photos the owner has not filed into an album. */
const UNFILED = 'Unfiled';

/** Suggested albums, offered as a datalist so owners can still type their own. */
const SUGGESTED_FOLDERS = [
  'Ambience',
  'Food & Drinks',
  'Interior',
  'Exterior',
  'Outdoor Seating',
];

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
  folderNames = [],
  photos,
  mode = 'gallery',
}: {
  coverUrl?: string | null;
  folderNames?: string[];
  photos: Photo[];
  mode?: 'gallery' | 'menu';
}) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState('');
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<{
    kind: 'gallery' | 'menu_photo';
    asCover: boolean;
    folder: string;
  }>({
    kind: 'gallery',
    asCover: false,
    folder: '',
  });

  const gallery = photos.filter((p) => p.kind === 'gallery');
  const menuPhotos = photos.filter((p) => p.kind === 'menu_photo');

  // Persisted folders can be empty. Photo-derived names are retained as a
  // compatibility fallback for rows created before persistent folders existed.
  const namedFolders = [...new Set(folderNames)];
  let hasUnfiled = false;
  for (const photo of gallery) {
    if (!photo.gallery_category) {
      hasUnfiled = true;
    } else if (!namedFolders.includes(photo.gallery_category)) {
      namedFolders.push(photo.gallery_category);
    }
  }
  const folders = hasUnfiled ? [...namedFolders, UNFILED] : namedFolders;
  const folderSuggestions = Array.from(
    new Set([...SUGGESTED_FOLDERS, ...namedFolders]),
  );

  const pickFile = (
    kind: 'gallery' | 'menu_photo',
    asCover = false,
    folder = '',
  ) => {
    targetRef.current = { kind, asCover, folder };
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
      if (targetRef.current.folder) {
        fd.set('gallery_category', targetRef.current.folder);
      }
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

  /**
   * Swap two photos that sit next to each other *within a folder*, but write
   * sort_order across the whole gallery. Folders are a view over one ordered
   * list, so per-folder numbering would collide and scramble the public gallery.
   */
  const moveInFolder = (folderPhotos: Photo[], index: number, dir: -1 | 1) => {
    const neighbour = folderPhotos[index + dir];
    if (!neighbour) return;
    const next = [...gallery];
    const a = next.findIndex((p) => p.id === folderPhotos[index].id);
    const b = next.findIndex((p) => p.id === neighbour.id);
    if (a === -1 || b === -1) return;
    [next[a], next[b]] = [next[b], next[a]];
    startTransition(async () => {
      await reorderPhotos(next.map((p) => p.id));
    });
  };

  const moveToFolder = (id: string, folder: string) =>
    startTransition(async () => {
      const res = await setPhotoFolder(id, folder || null);
      if (!res.ok) toast(res.message ?? 'Could not move that photo', 'error');
    });

  const commitRename = (from: string) => {
    const to = renameTo;
    startTransition(async () => {
      const res = await renameGalleryFolder(from, to);
      toast(
        res.ok ? 'Folder renamed' : (res.message ?? 'Could not rename'),
        res.ok ? 'positive' : 'error',
      );
      if (res.ok) {
        setRenaming(null);
        setRenameTo('');
      }
    });
  };

  const commitCreate = () => {
    startTransition(async () => {
      const res = await createGalleryFolder(newFolderName);
      toast(
        res.ok ? 'Folder created' : (res.message ?? 'Could not create folder'),
        res.ok ? 'positive' : 'error',
      );
      if (res.ok) {
        setAddingFolder(false);
        setNewFolderName('');
      }
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
              onClick={() => pickFile('gallery', true)}
            >
              {uploading
                ? 'Uploading…'
                : coverUrl
                  ? 'Replace cover'
                  : 'Upload cover'}
            </Button>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-paper text-sm font-semibold">Gallery</h2>
                <p className="text-text-muted text-[12px]">
                  Group photos into folders so students can jump straight to the
                  ambience or the food.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || pending}
                onClick={() => {
                  setNewFolderName('');
                  setAddingFolder(true);
                }}
              >
                + Add Folder
              </Button>
            </div>

            {addingFolder ? (
              <form
                className="border-border-hairline bg-surface-raised rounded-control flex flex-wrap items-end gap-2 border p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  commitCreate();
                }}
              >
                <div className="min-w-44 flex-1">
                  <Label htmlFor="ph-new-folder">Folder name</Label>
                  <Input
                    id="ph-new-folder"
                    list="ph-folder-suggestions"
                    value={newFolderName}
                    autoFocus
                    required
                    onChange={(event) => setNewFolderName(event.target.value)}
                  />
                  <datalist id="ph-folder-suggestions">
                    {folderSuggestions.map((folder) => (
                      <option key={folder} value={folder} />
                    ))}
                  </datalist>
                </div>
                <Button type="submit" size="sm" disabled={pending}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingFolder(false)}
                >
                  Cancel
                </Button>
              </form>
            ) : null}

            {folders.length === 0 ? (
              <p className="text-text-muted text-[13px]">
                Create your first folder, then add photos inside it.
              </p>
            ) : (
              folders.map((folder) => {
                const inFolder = gallery.filter(
                  (p) => (p.gallery_category ?? UNFILED) === folder,
                );
                const renamable = folder !== UNFILED;
                return (
                  <section key={folder} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-paper text-[13px] font-semibold">
                        {folder}{' '}
                        <span className="text-text-muted font-normal">
                          ({inFolder.length})
                        </span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {renamable &&
                          (renaming === folder ? (
                            <form
                              className="flex items-center gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                commitRename(folder);
                              }}
                            >
                              <Input
                                aria-label={`New name for ${folder}`}
                                value={renameTo}
                                autoFocus
                                onChange={(e) => setRenameTo(e.target.value)}
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={pending}
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRenaming(null)}
                              >
                                Cancel
                              </Button>
                            </form>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={pending}
                              onClick={() => {
                                setRenaming(folder);
                                setRenameTo(folder);
                              }}
                            >
                              Rename
                            </Button>
                          ))}
                        {renamable && renaming !== folder ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={uploading || pending}
                            onClick={() => pickFile('gallery', false, folder)}
                          >
                            + Add photo
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {inFolder.length === 0 ? (
                      <p className="text-text-muted text-[12px]">
                        No photos in this folder yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {inFolder.map((p, i) => (
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
                                  disabled={pending || uploading || i === 0}
                                  onClick={() => moveInFolder(inFolder, i, -1)}
                                  className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                                >
                                  ←
                                </button>
                                <button
                                  type="button"
                                  aria-label="Move later"
                                  disabled={
                                    pending ||
                                    uploading ||
                                    i === inFolder.length - 1
                                  }
                                  onClick={() => moveInFolder(inFolder, i, 1)}
                                  className="text-text-muted hover:text-paper px-1 disabled:opacity-30"
                                >
                                  →
                                </button>
                              </span>
                              <button
                                type="button"
                                disabled={pending || uploading}
                                onClick={() => remove(p.id)}
                                className="text-accent-urgent-text px-1"
                              >
                                delete
                              </button>
                            </div>
                            <Select
                              aria-label="Folder for this photo"
                              value={p.gallery_category ?? ''}
                              disabled={pending || uploading}
                              onChange={(e) =>
                                moveToFolder(p.id, e.target.value)
                              }
                              className="text-[12px]"
                            >
                              {p.gallery_category === null ? (
                                <option value="">{UNFILED}</option>
                              ) : null}
                              {namedFolders.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </Card>
        </div>
      ) : (
        <PhotoSection
          title="Menu photos"
          photos={menuPhotos}
          onAdd={() => pickFile('menu_photo')}
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
  photos,
  onAdd,
  onMove,
  onRemove,
  disabled,
}: {
  title: string;
  photos: Photo[];
  onAdd: () => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-paper text-sm font-semibold">{title}</h2>
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

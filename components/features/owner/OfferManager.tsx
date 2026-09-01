'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { resizeToWebp } from '@/components/features/owner/PhotoManager';
import {
  createOffer,
  updateOffer,
  uploadPromotionImage,
} from '@/lib/owner/actions';

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discount_text: string | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  flagged_count: number;
  image_url: string | null;
};

export function OfferManager({ offers }: { offers: Offer[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Offer> | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          <span className="text-paper font-mono font-semibold">
            {offers.length}
          </span>{' '}
          total
        </p>
        <Button className="min-h-11" onClick={() => setEditing({})}>
          New offer
        </Button>
      </div>

      {offers.length === 0 && (
        <div className="border-border-hairline rounded-card border border-dashed px-4 py-8 text-center">
          <p className="text-paper text-sm font-semibold">No offers yet</p>
          <p className="text-text-muted mx-auto mt-1 max-w-xs text-[13px] leading-5">
            Post a timely deal when you want to bring more students in.
          </p>
        </div>
      )}

      {offers.length > 0 && (
        <div className="grid gap-3">
          {offers.map((o) => {
            const status = getOfferStatus(o, mountedAt);
            return (
              <article
                key={o.id}
                className="border-border-hairline rounded-card overflow-hidden border bg-[#1a1a1a]"
              >
                <div className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row">
                  {o.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- owner uploads are resized before storage.
                    <img
                      src={o.image_url}
                      alt=""
                      className="rounded-control h-32 w-full shrink-0 object-cover sm:h-28 sm:w-28"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-paper text-sm leading-5 font-bold">
                        {o.title}
                      </h3>
                      <div className="-mt-2 -mr-2 flex shrink-0 items-center gap-1">
                        <span className={status.className}>{status.label}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-11"
                          onClick={() => setEditing(o)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <p className="text-accent-primary mt-1 text-[12px] font-semibold">
                      {o.discount_text || 'Offer details in description'}
                    </p>
                    {o.description && (
                      <p className="text-text-muted mt-2 line-clamp-2 text-[12px] leading-5">
                        {o.description}
                      </p>
                    )}
                    <p className="text-text-muted mt-2 font-mono text-[11px]">
                      {status.key === 'scheduled'
                        ? `Starts ${formatOwnerDateTime(o.starts_at)}`
                        : `Ends ${formatOwnerDateTime(o.expires_at)}`}
                    </p>
                  </div>
                </div>
                <div className="border-border-hairline flex items-center justify-between gap-3 border-t px-3 py-2.5">
                  <p className="text-text-muted text-[11px]">
                    {o.flagged_count > 0
                      ? `${o.flagged_count} student${o.flagged_count > 1 ? 's' : ''} flagged this`
                      : `Started ${formatOwnerDateTime(o.starts_at)}`}
                  </p>
                  {status.key === 'live' || status.key === 'scheduled' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await updateOffer(o.id, {
                            is_active: false,
                          });
                          toast(
                            res.ok
                              ? 'Offer taken down'
                              : (res.message ?? 'Failed'),
                            res.ok ? 'positive' : 'error',
                          );
                          if (res.ok) router.refresh();
                        })
                      }
                    >
                      Take down
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit offer' : 'Post an offer'}
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const photo = fd.get('photo');
              const photoFile =
                photo instanceof File && photo.size > 0 ? photo : null;
              if (!editing.id && !photoFile) {
                toast('Add an offer photo.', 'error');
                return;
              }
              const startsLocal = String(fd.get('starts_at') || '');
              const expiresLocal = String(fd.get('expires_at') || '');
              startTransition(async () => {
                let imageUrl = editing.image_url ?? null;
                if (photoFile) {
                  let upload;
                  try {
                    const blob = await resizeToWebp(photoFile);
                    const imageData = new FormData();
                    imageData.set(
                      'file',
                      new File([blob], 'offer.webp', { type: 'image/webp' }),
                    );
                    upload = await uploadPromotionImage(imageData);
                  } catch {
                    toast('Could not process that image', 'error');
                    return;
                  }
                  if (!upload.ok || !upload.url) {
                    toast(upload.message ?? 'Could not upload photo', 'error');
                    return;
                  }
                  imageUrl = upload.url;
                }

                const fields = {
                  title: String(fd.get('title')),
                  discount_text: String(fd.get('discount_text') || ''),
                };
                const res = editing.id
                  ? await updateOffer(editing.id, {
                      ...fields,
                      ...(startsLocal
                        ? { starts_at: new Date(startsLocal).toISOString() }
                        : {}),
                      ...(expiresLocal
                        ? { expires_at: new Date(expiresLocal).toISOString() }
                        : {}),
                      ...(imageUrl ? { image_url: imageUrl } : {}),
                    })
                  : await createOffer({
                      ...fields,
                      starts_at: startsLocal
                        ? new Date(startsLocal).toISOString()
                        : null,
                      expires_at: expiresLocal
                        ? new Date(expiresLocal).toISOString()
                        : undefined,
                      image_url: imageUrl ?? '',
                    });
                toast(
                  res.ok
                    ? editing.id
                      ? 'Offer updated'
                      : 'Offer is live'
                    : (res.message ?? 'Failed'),
                  res.ok ? 'positive' : 'error',
                );
                if (res.ok) {
                  setEditing(null);
                  router.refresh();
                }
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="of-photo">
                Offer photo{editing.id ? ' (optional to replace)' : ''}
              </Label>
              <Input
                id="of-photo"
                name="photo"
                type="file"
                accept="image/*"
                required={!editing.id}
              />
            </div>
            <div>
              <Label htmlFor="of-title">Offer title</Label>
              <Input
                id="of-title"
                name="title"
                required
                placeholder="Student lunch special"
                defaultValue={editing.title ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="of-discount">Discount / Offer Value</Label>
              <Input
                id="of-discount"
                name="discount_text"
                required
                placeholder="20% OFF, ₹100 OFF, or BOGO"
                defaultValue={editing.discount_text ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="of-start">
                Start date and time (leave empty = right now)
              </Label>
              <Input
                id="of-start"
                name="starts_at"
                type="datetime-local"
                className="font-mono"
                defaultValue={toLocalInput(editing.starts_at ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="of-exp">
                End date and time (leave empty = end of today)
              </Label>
              <Input
                id="of-exp"
                name="expires_at"
                type="datetime-local"
                className="font-mono"
                defaultValue={toLocalInput(editing.expires_at ?? null)}
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending
                ? editing.id
                  ? 'Saving…'
                  : 'Posting…'
                : editing.id
                  ? 'Save offer'
                  : 'Publish offer'}
            </Button>
          </form>
        )}
      </Sheet>
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatOwnerDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function getOfferStatus(offer: Offer, now: number) {
  const startsAt = new Date(offer.starts_at).getTime();
  const expiresAt = new Date(offer.expires_at).getTime();
  const baseClass =
    'rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase';

  if (!offer.is_active || expiresAt <= now) {
    return {
      key: 'ended' as const,
      label: 'Ended',
      className: `${baseClass} border-border-hairline text-text-muted`,
    };
  }
  if (startsAt > now) {
    return {
      key: 'scheduled' as const,
      label: 'Scheduled',
      className: `${baseClass} border-border-hairline text-paper`,
    };
  }
  return {
    key: 'live' as const,
    label: 'Live',
    className: `${baseClass} border-accent-primary/40 bg-accent-primary/8 text-accent-primary`,
  };
}

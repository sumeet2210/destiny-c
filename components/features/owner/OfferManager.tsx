'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { OfferBadge } from '@/components/features/OfferBadge';
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
  const [creating, setCreating] = useState(false);
  const [mountedAt] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const started = (o: Offer) => new Date(o.starts_at).getTime() <= mountedAt;
  const live = offers.filter(
    (o) =>
      o.is_active && started(o) && new Date(o.expires_at).getTime() > mountedAt,
  );
  // Scheduled for later — active but not yet started, so it must not be
  // reported as live.
  const scheduled = offers.filter(
    (o) =>
      o.is_active &&
      !started(o) &&
      new Date(o.expires_at).getTime() > mountedAt,
  );
  const past = offers.filter(
    (o) => !o.is_active || new Date(o.expires_at).getTime() <= mountedAt,
  );

  return (
    <div className="space-y-5">
      <Button onClick={() => setCreating(true)}>+ Post an offer</Button>

      {live.length === 0 && (
        <p className="text-text-muted text-sm">
          Nothing live right now. An offer posted before lunch does the most
          work.
        </p>
      )}

      {live.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          {live.map((o) => (
            <Card key={o.id} className="p-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                {o.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- owner uploads are resized before storage.
                  <img
                    src={o.image_url}
                    alt=""
                    className="rounded-control h-28 w-full shrink-0 object-cover sm:w-32"
                  />
                ) : null}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-paper text-sm font-bold">{o.title}</p>
                      <p className="text-accent-primary mt-0.5 text-[12px] font-semibold">
                        {o.discount_text || 'Offer details in description'}
                      </p>
                    </div>
                    <OfferBadge
                      title={o.title}
                      discountText={o.discount_text}
                      expiresAt={o.expires_at}
                    />
                  </div>
                  {o.description && (
                    <p className="text-text-muted text-[12px] leading-relaxed">
                      {o.description}
                    </p>
                  )}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/8 pt-2 text-[11px]">
                    <div>
                      <dt className="text-text-muted">Started</dt>
                      <dd className="text-paper">
                        {formatOwnerDateTime(o.starts_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Ends</dt>
                      <dd className="text-paper">
                        {formatOwnerDateTime(o.expires_at)}
                      </dd>
                    </div>
                  </dl>
                  {o.flagged_count > 0 && (
                    <p className="text-accent-urgent-text text-[11px]">
                      {o.flagged_count} student
                      {o.flagged_count > 1 ? 's' : ''} flagged this as wrong or
                      expired.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {scheduled.length > 0 && (
        <div className="space-y-2">
          <p className="text-text-muted text-sm">
            Scheduled to go live later ({scheduled.length})
          </p>
          {scheduled.map((o) => (
            <Card key={o.id} className="py-2 text-[13px]">
              <span className="text-paper font-medium">{o.title}</span>
              <span className="text-text-muted">
                {' '}
                · starts{' '}
                {new Date(o.starts_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'Asia/Kolkata',
                })}
              </span>
            </Card>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <details className="text-text-muted text-sm">
          <summary className="cursor-pointer">
            Past offers ({past.length})
          </summary>
          <div className="mt-2 space-y-2">
            {past.map((o) => (
              <Card key={o.id} className="py-2 text-[13px]">
                {o.title}
                <span className="text-text-muted">
                  {' '}
                  · ended{' '}
                  {new Date(o.expires_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </Card>
            ))}
          </div>
        </details>
      )}

      <Sheet
        open={creating}
        onClose={() => setCreating(false)}
        title="Post an offer"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const photo = fd.get('photo');
            if (!(photo instanceof File) || photo.size === 0) {
              toast('Add an offer photo.', 'error');
              return;
            }
            const startsLocal = String(fd.get('starts_at') || '');
            const expiresLocal = String(fd.get('expires_at') || '');
            startTransition(async () => {
              let upload;
              try {
                const blob = await resizeToWebp(photo);
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
              const res = await createOffer({
                title: String(fd.get('title')),
                description: String(fd.get('description') || ''),
                discount_text: String(fd.get('discount_text') || ''),
                starts_at: startsLocal
                  ? new Date(startsLocal).toISOString()
                  : null,
                expires_at: expiresLocal
                  ? new Date(expiresLocal).toISOString()
                  : undefined,
                image_url: upload.url,
              });
              toast(
                res.ok ? 'Offer is live' : (res.message ?? 'Failed'),
                res.ok ? 'positive' : 'error',
              );
              if (res.ok) {
                setCreating(false);
                router.refresh();
              }
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="of-photo">Offer photo</Label>
            <Input
              id="of-photo"
              name="photo"
              type="file"
              accept="image/*"
              required
            />
          </div>
          <div>
            <Label htmlFor="of-title">Title</Label>
            <Input
              id="of-title"
              name="title"
              required
              placeholder="Student thali at ₹99"
            />
          </div>
          <div>
            <Label htmlFor="of-discount">Discount text (short)</Label>
            <Input
              id="of-discount"
              name="discount_text"
              placeholder="₹21 off / B2G1 / 20% off"
            />
          </div>
          <div>
            <Label htmlFor="of-desc">Details</Label>
            <Textarea
              id="of-desc"
              name="description"
              placeholder="Any conditions — timings, ID needed…"
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
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Posting…' : 'Publish offer'}
          </Button>
        </form>
      </Sheet>
    </div>
  );
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

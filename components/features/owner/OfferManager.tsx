'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { OfferBadge } from '@/components/features/OfferBadge';
import { createOffer, updateOffer } from '@/lib/api/owner';

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discount_text: string | null;
  expires_at: string;
  is_active: boolean;
  flagged_count: number;
};

export function OfferManager({
  offers,
  onChanged,
}: {
  offers: Offer[];
  onChanged?: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [mountedAt] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const live = offers.filter(
    (o) => o.is_active && new Date(o.expires_at).getTime() > mountedAt,
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

      {live.map((o) => (
        <Card key={o.id} className="space-y-2">
          <OfferBadge
            title={o.title}
            discountText={o.discount_text}
            expiresAt={o.expires_at}
          />
          <p className="text-paper text-sm font-medium">{o.title}</p>
          {o.description && (
            <p className="text-text-muted text-[13px]">{o.description}</p>
          )}
          {o.flagged_count > 0 && (
            <p className="text-accent-urgent-text text-[12px]">
              {o.flagged_count} student{o.flagged_count > 1 ? 's' : ''} flagged
              this as wrong or expired — worth a check.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await updateOffer(o.id, { is_active: false });
                    toast('Offer taken down', 'positive');
                    onChanged?.();
                  } catch (err) {
                    toast(
                      err instanceof Error ? err.message : 'Failed',
                      'error',
                    );
                  }
                })
              }
            >
              Take down
            </Button>
          </div>
        </Card>
      ))}

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
            const expiresLocal = String(fd.get('expires_at') || '');
            startTransition(async () => {
              try {
                await createOffer({
                  title: String(fd.get('title')),
                  description: String(fd.get('description') || ''),
                  discount_text: String(fd.get('discount_text') || ''),
                  expires_at: expiresLocal
                    ? new Date(expiresLocal).toISOString()
                    : undefined,
                });
                toast('Offer is live', 'positive');
                setCreating(false);
                onChanged?.();
              } catch (err) {
                toast(err instanceof Error ? err.message : 'Failed', 'error');
              }
            });
          }}
          className="space-y-4"
        >
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
            <Label htmlFor="of-exp">Expires (leave empty = end of today)</Label>
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

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { createRestaurant } from '@/lib/owner/actions';

export function CreateRestaurantForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const address = String(fd.get('address') || '');
          startTransition(async () => {
            setError(null);
            const res = await createRestaurant({
              name: String(fd.get('name')),
              area: address,
              address,
              phone: String(fd.get('phone') || '') || null,
              description: String(fd.get('description') || '') || null,
              google_maps_url: String(fd.get('google_maps_url') || '') || null,
            });
            if (!res.ok) setError(res.message ?? 'Could not submit.');
            else router.refresh();
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="name">Restaurant name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div>
          <Label htmlFor="google-maps-url">Google Maps link</Label>
          <Input
            id="google-maps-url"
            name="google_maps_url"
            type="url"
            inputMode="url"
            placeholder="https://maps.app.goo.gl/..."
          />
          <p className="text-text-muted mt-1 text-xs">
            Open your restaurant in Google Maps, choose Share, and paste the
            copied link.
          </p>
        </div>
        <div>
          <Label htmlFor="description">Short description</Label>
          <Textarea id="description" name="description" />
        </div>
        {error && (
          <p className="text-accent-urgent-text text-[13px]">{error}</p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Submitting…' : 'Submit for approval'}
        </Button>
      </form>
    </Card>
  );
}

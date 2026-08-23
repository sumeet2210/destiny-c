'use client';

import { useState, useTransition } from 'react';
import { AREAS } from '@/config/areas';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { createRestaurant } from '@/lib/api/owner';

export function CreateRestaurantForm({
  onChanged,
}: {
  onChanged?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            setError(null);
            try {
              await createRestaurant({
                name: String(fd.get('name')),
                area: String(fd.get('area')),
                address: String(fd.get('address') || '') || null,
                phone: String(fd.get('phone') || '') || null,
                description: String(fd.get('description') || '') || null,
                lat: fd.get('lat') ? Number(fd.get('lat')) : null,
                lng: fd.get('lng') ? Number(fd.get('lng')) : null,
              });
              onChanged?.();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not submit.');
            }
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="name">Restaurant name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="area">Area</Label>
          <Select id="area" name="area" required defaultValue={AREAS[0]}>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              placeholder="17.98"
            />
          </div>
          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              placeholder="79.53"
            />
          </div>
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

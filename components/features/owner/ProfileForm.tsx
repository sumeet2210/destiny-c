'use client';

import { useState, useTransition } from 'react';
import { AREAS } from '@/config/areas';
import { VIBES } from '@/config/vibes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { updateRestaurant } from '@/lib/owner/actions';

type ProfileFields = {
  name: string;
  description: string | null;
  area: string;
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  is_veg_only: boolean;
  has_ac: boolean;
  dine_in: boolean;
  takeaway: boolean;
  student_discount: boolean;
  price_per_head: number | null;
  vibe_tags: string[];
};

export function ProfileForm({ initial }: { initial: ProfileFields }) {
  const [fields, setFields] = useState(initial);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const set = <K extends keyof ProfileFields>(
    key: K,
    value: ProfileFields[K],
  ) => setFields((f) => ({ ...f, [key]: value }));

  const toggleVibe = (tag: string) =>
    set(
      'vibe_tags',
      fields.vibe_tags.includes(tag)
        ? fields.vibe_tags.filter((t) => t !== tag)
        : [...fields.vibe_tags, tag],
    );

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const res = await updateRestaurant(fields);
            toast(
              res.ok ? 'Profile saved' : (res.message ?? 'Could not save'),
              res.ok ? 'positive' : 'error',
            );
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            value={fields.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-area">Area</Label>
            <Select
              id="p-area"
              value={fields.area}
              onChange={(e) => set('area', e.target.value)}
            >
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="p-price">Price per head (₹)</Label>
            <Input
              id="p-price"
              type="number"
              min={0}
              value={fields.price_per_head ?? ''}
              onChange={(e) =>
                set(
                  'price_per_head',
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
        </div>
        <div>
          <Label htmlFor="p-address">Address</Label>
          <Input
            id="p-address"
            value={fields.address ?? ''}
            onChange={(e) => set('address', e.target.value || null)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="p-phone">Phone</Label>
            <Input
              id="p-phone"
              type="tel"
              value={fields.phone ?? ''}
              onChange={(e) => set('phone', e.target.value || null)}
            />
          </div>
          <div>
            <Label htmlFor="p-lat">Latitude</Label>
            <Input
              id="p-lat"
              type="number"
              step="any"
              value={fields.lat ?? ''}
              onChange={(e) =>
                set('lat', e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
          <div>
            <Label htmlFor="p-lng">Longitude</Label>
            <Input
              id="p-lng"
              type="number"
              step="any"
              value={fields.lng ?? ''}
              onChange={(e) =>
                set('lng', e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
        </div>

        <div>
          <Label>Basics</Label>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={fields.is_veg_only}
              onClick={() => set('is_veg_only', !fields.is_veg_only)}
            >
              Pure veg
            </Chip>
            <Chip
              active={fields.has_ac}
              onClick={() => set('has_ac', !fields.has_ac)}
            >
              AC
            </Chip>
            <Chip
              active={fields.dine_in}
              onClick={() => set('dine_in', !fields.dine_in)}
            >
              Dine-in
            </Chip>
            <Chip
              active={fields.takeaway}
              onClick={() => set('takeaway', !fields.takeaway)}
            >
              Takeaway
            </Chip>
            <Chip
              active={fields.student_discount}
              onClick={() => set('student_discount', !fields.student_discount)}
            >
              Student discount
            </Chip>
          </div>
        </div>

        <div>
          <Label>Vibes (what is this place for?)</Label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <Chip
                key={v.tag}
                active={fields.vibe_tags.includes(v.tag)}
                onClick={() => toggleVibe(v.tag)}
              >
                {v.label}
              </Chip>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </Card>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { AREAS } from '@/config/areas';
import {
  AMENITIES,
  CUISINES,
  RESTAURANT_CATEGORIES,
  type AmenityKey,
} from '@/config/restaurant-profile';
import { VIBES } from '@/config/vibes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { PHONE_HELP } from '@/lib/domain/owner-profile';
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
  owner_name: string | null;
  restaurant_category: string | null;
  cuisines: string[];
} & Record<AmenityKey, boolean>;

export function ProfileForm({ initial }: { initial: ProfileFields }) {
  const [fields, setFields] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dirty = JSON.stringify(fields) !== JSON.stringify(saved);

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

  const toggleCuisine = (cuisine: string) =>
    set(
      'cuisines',
      fields.cuisines.includes(cuisine)
        ? fields.cuisines.filter((c) => c !== cuisine)
        : [...fields.cuisines, cuisine],
    );

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!editing || !dirty) return;
          startTransition(async () => {
            const res = await updateRestaurant(fields);
            toast(
              res.ok ? 'Profile saved' : (res.message ?? 'Could not save'),
              res.ok ? 'positive' : 'error',
            );
            if (res.ok) {
              setSaved(fields);
              setEditing(false);
            }
          });
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-paper text-lg font-bold">
            Basic info
          </h2>
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setFields(saved);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
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

        <div>
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            readOnly={!editing}
            required
          />
        </div>
        <div>
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            value={fields.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
            readOnly={!editing}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-owner">Owner / manager name</Label>
            <Input
              id="p-owner"
              value={fields.owner_name ?? ''}
              onChange={(e) => set('owner_name', e.target.value || null)}
              readOnly={!editing}
            />
          </div>
          <div>
            <Label htmlFor="p-category">Category</Label>
            <Select
              id="p-category"
              value={fields.restaurant_category ?? ''}
              disabled={!editing}
              onChange={(e) =>
                set('restaurant_category', e.target.value || null)
              }
            >
              <option value="">Not set</option>
              {RESTAURANT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-area">Area</Label>
            <Select
              id="p-area"
              value={fields.area}
              disabled={!editing}
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
              readOnly={!editing}
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
            readOnly={!editing}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="p-phone">Phone</Label>
            <Input
              id="p-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-describedby="p-phone-help"
              value={fields.phone ?? ''}
              onChange={(e) => set('phone', e.target.value || null)}
              readOnly={!editing}
            />
            <p id="p-phone-help" className="text-paper/60 mt-1 text-xs">
              {PHONE_HELP}
            </p>
          </div>
          <div>
            <Label htmlFor="p-lat">Latitude</Label>
            <Input
              id="p-lat"
              type="number"
              step="any"
              value={fields.lat ?? ''}
              readOnly={!editing}
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
              readOnly={!editing}
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
              disabled={!editing}
              onClick={() => set('is_veg_only', !fields.is_veg_only)}
            >
              Pure veg
            </Chip>
            <Chip
              active={fields.has_ac}
              disabled={!editing}
              onClick={() => set('has_ac', !fields.has_ac)}
            >
              AC
            </Chip>
            <Chip
              active={fields.dine_in}
              disabled={!editing}
              onClick={() => set('dine_in', !fields.dine_in)}
            >
              Dine-in
            </Chip>
            <Chip
              active={fields.takeaway}
              disabled={!editing}
              onClick={() => set('takeaway', !fields.takeaway)}
            >
              Takeaway
            </Chip>
            <Chip
              active={fields.student_discount}
              disabled={!editing}
              onClick={() => set('student_discount', !fields.student_discount)}
            >
              Student discount
            </Chip>
          </div>
        </div>

        <div>
          <Label>Cuisines</Label>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <Chip
                key={c}
                active={fields.cuisines.includes(c)}
                disabled={!editing}
                onClick={() => toggleCuisine(c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label>Facilities</Label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <Chip
                key={a.key}
                active={fields[a.key]}
                disabled={!editing}
                onClick={() => set(a.key, !fields[a.key])}
              >
                {a.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label>Vibes (what is this place for?)</Label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <Chip
                key={v.tag}
                active={fields.vibe_tags.includes(v.tag)}
                disabled={!editing}
                onClick={() => toggleVibe(v.tag)}
              >
                {v.label}
              </Chip>
            ))}
          </div>
        </div>

        {editing && dirty ? (
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        ) : null}
      </form>
    </Card>
  );
}

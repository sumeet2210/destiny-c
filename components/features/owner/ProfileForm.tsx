'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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

const PRIMARY_FACILITIES = [
  { key: 'has_ac', label: 'AC' },
  { key: 'dine_in', label: 'Dine-in' },
  { key: 'takeaway', label: 'Takeaway' },
] as const;

const phoneDigitsFrom = (phone: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.slice(0, 10);
};

export function ProfileForm({ initial }: { initial: ProfileFields }) {
  const [fields, setFields] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [manualLocation, setManualLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const dirty = JSON.stringify(fields) !== JSON.stringify(saved);
  const phoneDigits = phoneDigitsFrom(fields.phone);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(72, textarea.scrollHeight)}px`;
  }, [fields.description]);

  const set = <K extends keyof ProfileFields>(
    key: K,
    value: ProfileFields[K],
  ) => setFields((current) => ({ ...current, [key]: value }));

  const toggleVibe = (tag: string) =>
    set(
      'vibe_tags',
      fields.vibe_tags.includes(tag)
        ? fields.vibe_tags.filter((item) => item !== tag)
        : [...fields.vibe_tags, tag],
    );

  const toggleCuisine = (cuisine: string) =>
    set(
      'cuisines',
      fields.cuisines.includes(cuisine)
        ? fields.cuisines.filter((item) => item !== cuisine)
        : [...fields.cuisines, cuisine],
    );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast('Location access is not available in this browser.', 'error');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFields((current) => ({
          ...current,
          lat: Number(coords.latitude.toFixed(6)),
          lng: Number(coords.longitude.toFixed(6)),
        }));
        setManualLocation(false);
        setLocating(false);
        toast('Current location added.', 'positive');
      },
      () => {
        setLocating(false);
        toast('Could not access your current location.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <Card>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!editing || !dirty) return;
          if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
            toast('Enter a valid 10-digit Indian mobile number.', 'error');
            return;
          }
          startTransition(async () => {
            const result = await updateRestaurant(fields);
            toast(
              result.ok
                ? 'Profile saved'
                : (result.message ?? 'Could not save'),
              result.ok ? 'positive' : 'error',
            );
            if (result.ok) {
              setSaved(fields);
              setEditing(false);
            }
          });
        }}
        className="space-y-7"
      >
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-paper text-lg font-bold">
              Basic information
            </h2>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setFields(saved);
                  setManualLocation(false);
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="p-name">Restaurant name</Label>
              <Input
                id="p-name"
                value={fields.name}
                onChange={(event) => set('name', event.target.value)}
                readOnly={!editing}
                required
              />
            </div>
            <div>
              <Label htmlFor="p-owner">Owner name</Label>
              <Input
                id="p-owner"
                value={fields.owner_name ?? ''}
                onChange={(event) =>
                  set('owner_name', event.target.value || null)
                }
                readOnly={!editing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              ref={descriptionRef}
              id="p-desc"
              rows={2}
              maxLength={600}
              className="min-h-[4.5rem] resize-none overflow-hidden"
              value={fields.description ?? ''}
              onChange={(event) =>
                set('description', event.target.value || null)
              }
              readOnly={!editing}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="p-category">Restaurant category</Label>
              <Select
                id="p-category"
                value={fields.restaurant_category ?? ''}
                disabled={!editing}
                onChange={(event) =>
                  set('restaurant_category', event.target.value || null)
                }
              >
                <option value="">Not set</option>
                {RESTAURANT_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="p-phone">Phone no.</Label>
              <div className="border-border-hairline bg-surface-muted rounded-control flex items-center border">
                <span className="text-paper border-border-hairline border-r px-3.5 text-sm">
                  +91
                </span>
                <input
                  id="p-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  aria-describedby="p-phone-help"
                  className="text-paper placeholder:text-text-muted min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none read-only:cursor-default"
                  value={phoneDigits}
                  pattern="[6-9][0-9]{9}"
                  minLength={10}
                  maxLength={10}
                  required
                  readOnly={!editing}
                  onChange={(event) => {
                    const digits = event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10);
                    set('phone', digits ? `+91${digits}` : null);
                  }}
                />
              </div>
              <p id="p-phone-help" className="text-text-muted mt-1 text-xs">
                Enter exactly 10 digits.
              </p>
            </div>
          </div>
        </section>

        <section className="border-border-hairline space-y-4 border-t pt-6">
          <h2 className="font-display text-paper text-lg font-bold">
            Locality
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="p-area">Area/Locality</Label>
              <Input
                id="p-area"
                value={fields.area}
                onChange={(event) => set('area', event.target.value)}
                readOnly={!editing}
                required
              />
            </div>
            <div>
              <Label htmlFor="p-address">Full address</Label>
              <Input
                id="p-address"
                value={fields.address ?? ''}
                onChange={(event) => set('address', event.target.value || null)}
                readOnly={!editing}
              />
            </div>
          </div>

          <div>
            <Label>Location on map</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!editing || locating}
                onClick={useCurrentLocation}
              >
                {locating ? 'Finding location…' : 'Use current location'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!editing}
                onClick={() => setManualLocation((shown) => !shown)}
              >
                Choose your own location
              </Button>
            </div>

            {manualLocation ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="p-lat">Latitude</Label>
                  <Input
                    id="p-lat"
                    type="number"
                    step="any"
                    value={fields.lat ?? ''}
                    onChange={(event) =>
                      set(
                        'lat',
                        event.target.value ? Number(event.target.value) : null,
                      )
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
                    onChange={(event) =>
                      set(
                        'lng',
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  />
                </div>
              </div>
            ) : fields.lat !== null && fields.lng !== null ? (
              <p className="text-text-muted mt-2 text-xs">
                Location saved: {fields.lat.toFixed(6)}, {fields.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-text-muted mt-2 text-xs">
                No location added yet.
              </p>
            )}
          </div>
        </section>

        <section className="border-border-hairline space-y-3 border-t pt-6">
          <h2 className="font-display text-paper text-lg font-bold">Cuisine</h2>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((cuisine) => (
              <Chip
                key={cuisine}
                active={fields.cuisines.includes(cuisine)}
                disabled={!editing}
                onClick={() => toggleCuisine(cuisine)}
              >
                {cuisine}
              </Chip>
            ))}
          </div>
        </section>

        <section className="border-border-hairline space-y-3 border-t pt-6">
          <h2 className="font-display text-paper text-lg font-bold">
            Facilities
          </h2>
          <div className="flex flex-wrap gap-2">
            {PRIMARY_FACILITIES.map((facility) => (
              <Chip
                key={facility.key}
                active={fields[facility.key]}
                disabled={!editing}
                onClick={() => set(facility.key, !fields[facility.key])}
              >
                {facility.label}
              </Chip>
            ))}
            {AMENITIES.map((amenity) => (
              <Chip
                key={amenity.key}
                active={fields[amenity.key]}
                disabled={!editing}
                onClick={() => set(amenity.key, !fields[amenity.key])}
              >
                {amenity.label}
              </Chip>
            ))}
            <Chip
              active={fields.student_discount}
              disabled={!editing}
              onClick={() => set('student_discount', !fields.student_discount)}
            >
              Student Discount
            </Chip>
          </div>
        </section>

        <section className="border-border-hairline space-y-3 border-t pt-6">
          <h2 className="font-display text-paper text-lg font-bold">
            Vibe / Purpose
          </h2>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((vibe) => (
              <Chip
                key={vibe.tag}
                active={fields.vibe_tags.includes(vibe.tag)}
                disabled={!editing}
                onClick={() => toggleVibe(vibe.tag)}
              >
                {vibe.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="border-border-hairline space-y-3 border-t pt-6">
          <h2 className="font-display text-paper text-lg font-bold">
            Dining details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Food preference</Label>
              <Chip
                active={fields.is_veg_only}
                disabled={!editing}
                onClick={() => set('is_veg_only', !fields.is_veg_only)}
              >
                Pure veg
              </Chip>
            </div>
            <div>
              <Label htmlFor="p-price">Price per head (₹)</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={fields.price_per_head ?? ''}
                readOnly={!editing}
                onChange={(event) =>
                  set(
                    'price_per_head',
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              />
            </div>
          </div>
        </section>

        {editing && dirty ? (
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        ) : null}
      </form>
    </Card>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { CUISINES, RESTAURANT_CATEGORIES } from '@/config/restaurant-profile';
import { VIBES } from '@/config/vibes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input, Label, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { updateRestaurant } from '@/lib/owner/actions';
import { LocationPicker } from './LocationPicker';

type ProfileFields = {
  name: string;
  owner_name: string | null;
  description: string | null;
  restaurant_category: string | null;
  cuisines: string[];
  area: string;
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  has_ac: boolean;
  dine_in: boolean;
  takeaway: boolean;
  delivery: boolean;
  outdoor_seating: boolean;
  parking: boolean;
  wifi: boolean;
  upi_card: boolean;
  wheelchair_accessible: boolean;
  family_friendly: boolean;
  student_discount: boolean;
  vibe_tags: string[];
};

type BooleanField = {
  [K in keyof ProfileFields]: ProfileFields[K] extends boolean ? K : never;
}[keyof ProfileFields];

const FACILITIES: { key: BooleanField; label: string }[] = [
  { key: 'has_ac', label: 'AC' },
  { key: 'dine_in', label: 'Dine-in' },
  { key: 'takeaway', label: 'Takeaway' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'outdoor_seating', label: 'Outdoor Seating' },
  { key: 'parking', label: 'Parking' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'upi_card', label: 'UPI/Card' },
  { key: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { key: 'family_friendly', label: 'Family Friendly' },
  { key: 'student_discount', label: 'Student Discount' },
];

const DESCRIPTION_WORD_LIMIT = 100;

const countWords = (value: string) =>
  value.trim() ? value.trim().split(/\s+/).length : 0;

const limitWords = (value: string) => {
  if (countWords(value) <= DESCRIPTION_WORD_LIMIT) return value;
  return (value.match(/\S+\s*/g) ?? [])
    .slice(0, DESCRIPTION_WORD_LIMIT)
    .join('')
    .trimEnd();
};

export function ProfileForm({ initial }: { initial: ProfileFields }) {
  const initialFields = {
    ...initial,
    cuisines: initial.cuisines ?? [],
    vibe_tags: initial.vibe_tags ?? [],
    phone: null,
  };
  const [fields, setFields] = useState(initialFields);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const set = <K extends keyof ProfileFields>(
    key: K,
    value: ProfileFields[K],
  ) => setFields((current) => ({ ...current, [key]: value }));
  const toggleList = (key: 'cuisines' | 'vibe_tags', value: string) =>
    set(
      key,
      fields[key].includes(value)
        ? fields[key].filter((item) => item !== value)
        : [...fields[key], value],
    );

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateRestaurant({
            ...fields,
            phone: fields.phone ? `+91${fields.phone}` : null,
          });
          toast(
            result.ok
              ? 'Profile saved'
              : (result.message ?? 'Could not save profile'),
            result.ok ? 'positive' : 'error',
          );
          if (result.ok) setEditing(false);
        });
      }}
    >
      <Section
        title="Basic information"
        disabled={!editing}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (editing) setFields(initialFields);
              setEditing((current) => !current);
            }}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Restaurant name" id="p-name">
            <Input
              id="p-name"
              value={fields.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </Field>
          <Field label="Owner name" id="p-owner-name">
            <Input
              id="p-owner-name"
              value={fields.owner_name ?? ''}
              onChange={(e) => set('owner_name', e.target.value || null)}
              required
            />
          </Field>
        </div>
        <Field label="Description" id="p-description">
          <Textarea
            id="p-description"
            aria-describedby="p-description-count"
            className="h-20 max-h-40 min-h-20"
            value={fields.description ?? ''}
            onChange={(e) =>
              set('description', limitWords(e.target.value) || null)
            }
            placeholder="What makes your restaurant special?"
          />
          <p
            id="p-description-count"
            className="text-text-muted mt-1.5 text-right text-xs"
          >
            {countWords(fields.description ?? '')}/{DESCRIPTION_WORD_LIMIT}{' '}
            words
          </p>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Restaurant category" id="p-category">
            <Select
              id="p-category"
              value={fields.restaurant_category ?? ''}
              onChange={(e) =>
                set('restaurant_category', e.target.value || null)
              }
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {RESTAURANT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phone no." id="p-phone">
            <div className="relative">
              <span className="text-paper pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm">
                +91
              </span>
              <Input
                id="p-phone"
                className="pl-12"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[0-9]{10}"
                minLength={10}
                maxLength={10}
                value={fields.phone ?? ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  set('phone', digits || null);
                }}
                placeholder="9876543210"
                title="Enter exactly 10 digits"
                required
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section
        title="Locality"
        description="Help customers find you easily."
        disabled={!editing}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Area / Locality" id="p-area">
            <Input
              id="p-area"
              value={fields.area}
              onChange={(e) => set('area', e.target.value)}
              placeholder="Enter area or locality"
              required
            />
          </Field>
          <Field label="Full address" id="p-address">
            <Input
              id="p-address"
              value={fields.address ?? ''}
              onChange={(e) => set('address', e.target.value || null)}
              required
            />
          </Field>
        </div>
        <div>
          <Label>Location on map</Label>
          <LocationPicker
            lat={fields.lat}
            lng={fields.lng}
            onChange={({ lat, lng }) =>
              setFields((current) => ({ ...current, lat, lng }))
            }
          />
        </div>
      </Section>

      <Section title="Cuisine" disabled={!editing}>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((cuisine) => (
            <Chip
              key={cuisine}
              active={fields.cuisines.includes(cuisine)}
              onClick={() => toggleList('cuisines', cuisine)}
            >
              {cuisine}
            </Chip>
          ))}
        </div>
      </Section>

      <Section
        title="Facilities"
        description="Select every facility available at your restaurant."
        disabled={!editing}
      >
        <div className="flex flex-wrap gap-2">
          {FACILITIES.map((facility) => (
            <Chip
              key={facility.key}
              active={fields[facility.key]}
              onClick={() => set(facility.key, !fields[facility.key])}
            >
              {facility.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section
        title="Vibe / Purpose"
        description="What is this place best for? Select all that apply."
        disabled={!editing}
      >
        <div className="flex flex-wrap gap-2">
          {VIBES.map((vibe) => (
            <Chip
              key={vibe.tag}
              active={fields.vibe_tags.includes(vibe.tag)}
              onClick={() => toggleList('vibe_tags', vibe.tag)}
            >
              {vibe.label}
            </Chip>
          ))}
        </div>
      </Section>

      {editing ? (
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function Section({
  title,
  description,
  action,
  disabled = false,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-paper text-xl font-bold">{title}</h2>
          {description ? (
            <p className="text-text-muted mt-1 text-sm">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <fieldset
        disabled={disabled}
        className={cn(
          'min-w-0 space-y-5 border-0 p-0 transition-opacity',
          disabled && 'pointer-events-none',
        )}
      >
        {children}
      </fieldset>
    </Card>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

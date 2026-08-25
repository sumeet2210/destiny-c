'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import {
  parseStatusFilter,
  type BookingStatusFilter,
} from '@/lib/domain/booking-filters';

// Owners only need current work and cancellations at this level. Incoming,
// accepted, and awaiting-confirmation rows all belong under Coming.
const options: { value: BookingStatusFilter; label: string }[] = [
  { value: 'coming', label: 'Coming' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * URL-backed booking filters; the server remains the filtering authority.
 *
 * The active chip comes from the same parser the page uses, so a stale or
 * hand-edited ?status= highlights "Coming" — matching the rows actually shown.
 */
export function BookingFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [guest, setGuest] = useState(params.get('guest') ?? '');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `/owner/bookings?${query}` : '/owner/bookings', {
      scroll: false,
    });
  };

  const active = parseStatusFilter(params.get('status'));

  return (
    <div className="space-y-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {options.map((option) => (
          <Chip
            key={option.value}
            active={active === option.value}
            onClick={() =>
              set({ status: option.value === 'coming' ? null : option.value })
            }
          >
            {option.label}
          </Chip>
        ))}
      </div>
      <Input
        type="search"
        value={guest}
        placeholder="Search by guest name"
        aria-label="Search bookings by guest name"
        onChange={(event) => {
          const value = event.target.value;
          setGuest(value);
          if (debounce.current) clearTimeout(debounce.current);
          debounce.current = setTimeout(
            () => set({ guest: value || null }),
            300,
          );
        }}
      />
    </div>
  );
}

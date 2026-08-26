'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

// Offers/events and reviews/analytics each live on one page now, so the nav is
// seven entries instead of nine. The old routes still resolve — they redirect —
// but they are deliberately absent here: a `/owner/offers` entry would also
// match `/owner/offers-events` under the startsWith test below.
const items = [
  { href: '/owner/dashboard', label: 'Overview' },
  { href: '/owner/profile', label: 'Profile & hours' },
  { href: '/owner/menu', label: 'Menu' },
  { href: '/owner/offers-events', label: 'Offers & Events' },
  { href: '/owner/photos', label: 'Photos' },
  { href: '/owner/bookings', label: 'Bookings' },
  { href: '/owner/analytics', label: 'Analytics' },
] as const;

export function OwnerNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Owner tools"
      className={cn(
        horizontal
          ? 'no-scrollbar flex gap-1 overflow-x-auto'
          : 'flex flex-col gap-1',
      )}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-control shrink-0 px-3 py-2 text-sm',
            pathname.startsWith(item.href)
              ? 'bg-surface-raised text-paper'
              : 'text-text-muted hover:text-paper',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

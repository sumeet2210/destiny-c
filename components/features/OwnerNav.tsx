'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const items = [
  { href: '/owner/profile', label: 'Profile' },
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
          ? 'no-scrollbar flex gap-1.5 overflow-x-auto'
          : 'flex flex-col gap-2',
      )}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-control relative shrink-0 transition-all',
            horizontal ? 'px-4 py-2.5 text-[15px] font-semibold' : 'px-4 py-3',
            pathname.startsWith(item.href)
              ? horizontal
                ? 'from-accent-primary/15 to-surface-raised text-accent-primary bg-gradient-to-b shadow-sm'
                : 'from-accent-primary/10 via-canvas to-canvas text-accent-primary -mr-4 rounded-r-none bg-gradient-to-r pr-8 shadow-[0_12px_30px_rgba(0,0,0,0.12)]'
              : horizontal
                ? 'text-text-muted hover:text-paper'
                : 'text-text-muted hover:text-paper hover:translate-x-1',
          )}
        >
          <span className={cn('block', !horizontal && 'text-lg font-semibold')}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}

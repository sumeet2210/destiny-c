'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const items = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/restaurants', label: 'Restaurants' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/offers', label: 'Flagged offers' },
  { href: '/admin/reviews', label: 'Reviews' },
] as const;

export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        horizontal
          ? 'no-scrollbar flex gap-1 overflow-x-auto'
          : 'flex flex-col gap-1',
      )}
    >
      {items.map((item) => {
        // `/admin` is matched exactly; startsWith would light Overview up on
        // every child route.
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-control shrink-0 px-3 py-2 text-sm',
              active
                ? 'bg-surface-raised text-paper'
                : 'text-text-muted hover:text-paper',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

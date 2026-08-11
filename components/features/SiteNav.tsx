'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

type NavIconName = 'home' | 'search' | 'events' | 'saved' | 'bookings';

const tabs: ReadonlyArray<{
  href: string;
  label: string;
  icon: NavIconName;
}> = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/events', label: 'Events', icon: 'events' },
  { href: '/saved', label: 'Saved', icon: 'saved' },
  { href: '/bookings', label: 'Bookings', icon: 'bookings' },
];

export function SiteHeader({
  accountHref,
  accountLabel,
}: {
  accountHref: string;
  accountLabel: string;
}) {
  const pathname = usePathname();
  const onHome = pathname === '/';

  return (
    <header
      data-home={onHome || undefined}
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur',
        onHome
          ? 'border-black/10 bg-[#F8FAFA]/95 text-black'
          : 'border-border-hairline bg-canvas/95',
      )}
    >
      <div
        className={cn(
          'mx-auto flex items-center justify-between gap-4 px-4',
          onHome ? 'h-16 max-w-[100rem] sm:px-6 lg:px-10' : 'h-14 max-w-5xl',
        )}
      >
        <Link
          href="/"
          aria-label="Destiny home"
          className={cn(
            onHome
              ? 'relative h-11 w-[7.2rem] shrink-0 overflow-hidden'
              : 'font-display text-accent-primary text-xl font-extrabold',
          )}
        >
          {onHome ? (
            // The supplied square asset is intentionally cropped to its wordmark.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/brand/destiny-wordmark.png"
              alt="Destiny"
              className="absolute top-[-2.15rem] left-0 h-[7.2rem] w-[7.2rem] max-w-none"
            />
          ) : (
            'Destiny'
          )}
        </Link>

        <nav
          aria-label="Primary navigation"
          className={cn(
            'hidden items-center',
            onHome
              ? 'gap-0.5 rounded-full border border-black/15 bg-white p-1 lg:flex'
              : 'gap-1 sm:flex',
          )}
        >
          {tabs.slice(1).map((tab) => (
            <NavLink
              key={tab.href}
              href={tab.href}
              label={tab.label}
              onHome={onHome}
            />
          ))}
          <NavLink href="/friends" label="Friends" onHome={onHome} />
        </nav>

        <Link
          href={accountHref}
          className={cn(
            'inline-flex items-center justify-center font-semibold',
            onHome
              ? 'min-h-11 rounded-full bg-[#00B89C] px-4 text-[13px] text-black hover:bg-black hover:text-white'
              : accountLabel === 'Log in'
                ? 'rounded-control bg-accent-primary text-ink-on-primary min-h-9 px-3.5 py-1.5 text-[13px]'
                : 'rounded-chip border-border-hairline bg-surface-raised text-paper min-h-9 border px-3 py-1.5 text-[13px]',
          )}
        >
          {accountLabel}
        </Link>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  onHome,
}: {
  href: string;
  label: string;
  onHome: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'px-3 py-1.5 text-sm transition-colors',
        onHome
          ? cn(
              'rounded-full text-black hover:bg-black hover:text-white',
              active && 'bg-black text-white',
            )
          : cn(
              'rounded-control',
              active
                ? 'bg-surface-raised text-paper'
                : 'text-text-muted hover:text-paper',
            ),
      )}
    >
      {label}
    </Link>
  );
}

/** Mobile bottom tab bar — this is a phone product first (build plan §1). */
export function MobileTabBar() {
  const pathname = usePathname();
  const onHome = pathname === '/';
  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)]',
        onHome
          ? 'border-white/15 bg-black/95 text-white backdrop-blur lg:hidden'
          : 'border-border-hairline bg-surface-muted sm:hidden',
      )}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px]',
                onHome
                  ? active
                    ? 'text-[#00B89C]'
                    : 'text-[#E6FAF6]'
                  : active
                    ? 'text-accent-primary'
                    : 'text-text-muted',
              )}
            >
              <NavIcon name={tab.icon} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 19,
    height: 19,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="m3.5 10.5 8.5-7 8.5 7" />
        <path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" />
      </svg>
    );
  }
  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </svg>
    );
  }
  if (name === 'events') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }
  if (name === 'saved') {
    return (
      <svg {...common}>
        <path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.8 6.5 21V4.5Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M7 3v5M4.5 3v3.5A2.5 2.5 0 0 0 7 9v12M9.5 3v3.5A2.5 2.5 0 0 1 7 9M16 3v18M16 3c3 1.6 4.5 4 4.5 7.2H16" />
    </svg>
  );
}

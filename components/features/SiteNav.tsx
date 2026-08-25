'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import styles from './site-nav.module.css';

type NavIconName = 'home' | 'events' | 'profile';

const tabs: ReadonlyArray<{
  href: string;
  label: string;
  icon: NavIconName;
}> = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/events', label: 'Events', icon: 'events' },
  { href: '/account', label: 'Profile', icon: 'profile' },
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
  const onSaved = pathname === '/saved' || pathname.startsWith('/saved/');
  const onEvents = pathname === '/events' || pathname.startsWith('/events/');
  const onStudentLogin = pathname === '/login';
  const onStudentProfile =
    pathname === '/account' || pathname.startsWith('/account/');
  const onStudentBookings =
    pathname === '/bookings' || pathname.startsWith('/bookings/');
  const onStudentReviews =
    pathname === '/reviews' || pathname.startsWith('/reviews/');
  const onRestaurantProfile = /^\/restaurant\/[^/]+\/?$/.test(pathname);
  const onBookingPage = /^\/restaurant\/[^/]+\/book\/?$/.test(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMenuOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  if (
    onEvents ||
    onStudentLogin ||
    onStudentProfile ||
    onStudentBookings ||
    onStudentReviews ||
    onRestaurantProfile ||
    onBookingPage
  )
    return null;

  if (onHome || onSaved) {
    return (
      <>
        <header className="pointer-events-none fixed inset-x-0 top-0 z-40 text-black">
          <div
            className={cn(
              'mx-auto flex max-w-[100rem] items-start justify-end px-3 sm:px-5 lg:px-8',
              onHome ? 'h-24 pt-10 sm:pt-12' : 'h-16 pt-3',
            )}
          >
            <MenuButton
              open={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            />
          </div>
        </header>
        <NavigationDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      </>
    );
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[#505050] bg-[#EDEDED] text-black"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Wordmark />

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 rounded-full border border-[#505050] bg-white p-1 lg:flex"
          >
            {tabs.slice(1).map((tab) => (
              <NavLink
                key={tab.href}
                href={tab.href}
                label={tab.label}
                icon={tab.icon}
              />
            ))}
            <NavLink href="/friends" label="Friends" />
          </nav>

          <Link
            href={accountHref}
            className="hidden min-h-11 items-center justify-center rounded-full border border-[#1DB954] bg-[#1DB954] px-4 text-[13px] font-extrabold text-black transition-colors hover:border-[#1DB954] hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] lg:inline-flex"
          >
            {accountLabel}
          </Link>

          <div className="lg:hidden">
            <MenuButton
              open={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            />
          </div>
        </div>
      </header>
      <NavigationDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function MenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Open Destiny menu"
      aria-expanded={open}
      aria-controls="destiny-navigation-drawer"
      onClick={onClick}
      className={cn(
        open && styles.open,
        'pointer-events-auto grid h-10 w-10 place-items-center rounded-[12px] border border-white/15 bg-[#171717]/95 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[background,transform] hover:bg-[#232323] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954] active:scale-95',
      )}
    >
      <AnimatedMenuIcon />
    </button>
  );
}

function NavigationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const contactPanelId = useId();
  const aboutPanelId = useId();
  const [contactOpen, setContactOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const links = [{ href: '/saved', label: 'Saved' }];

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className={cn(styles.drawerLayer, open && styles.drawerLayerOpen)}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.drawerOverlay}
        tabIndex={open ? 0 : -1}
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        id="destiny-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Destiny navigation"
        inert={open ? undefined : true}
        className={styles.drawerPanel}
      >
        <div className={styles.drawerHeader}>
          <button
            type="button"
            className={cn(styles.drawerClose, styles.open)}
            onClick={onClose}
            aria-label="Close Destiny menu"
          >
            <AnimatedMenuIcon />
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="Destiny menu links">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                styles.drawerLink,
                isActive(link.href) && styles.drawerLinkActive,
              )}
              style={{ '--menu-index': index } as CSSProperties}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          <div
            className={cn(
              styles.contactItem,
              contactOpen && styles.contactItemOpen,
            )}
          >
            <button
              type="button"
              className={styles.contactTrigger}
              aria-expanded={contactOpen}
              aria-controls={contactPanelId}
              onClick={() => setContactOpen((current) => !current)}
            >
              <span>Contact Us</span>
              <ChevronIcon />
            </button>
            <div
              id={contactPanelId}
              className={styles.contactPanel}
              aria-hidden={!contactOpen}
              inert={contactOpen ? undefined : true}
            >
              <div>
                <ContactLink
                  href="mailto:hello@destiny.app"
                  label="Email"
                  value="hello@destiny.app"
                />
                <ContactLink
                  href="mailto:partners@destiny.app"
                  label="Partnerships"
                  value="partners@destiny.app"
                />
                <ContactLink
                  href="tel:+919848000000"
                  label="Phone"
                  value="+91 98480 00000"
                />
              </div>
            </div>
          </div>

          <div
            className={cn(
              styles.contactItem,
              aboutOpen && styles.contactItemOpen,
            )}
          >
            <button
              type="button"
              className={styles.contactTrigger}
              aria-expanded={aboutOpen}
              aria-controls={aboutPanelId}
              onClick={() => setAboutOpen((current) => !current)}
            >
              <span>About</span>
              <ChevronIcon />
            </button>
            <div
              id={aboutPanelId}
              className={styles.contactPanel}
              aria-hidden={!aboutOpen}
              inert={aboutOpen ? undefined : true}
            >
              <div className={styles.aboutContent}>
                <strong>Made for the NITW scene.</strong>
                <p>
                  Destiny puts nearby restaurants, live offers, events and
                  squad-worthy plans in one quick place.
                </p>
                <span>Student-first · Local · Always fresh</span>
              </div>
            </div>
          </div>
        </nav>

        <div className={styles.drawerDivider} aria-hidden />
        <Link href="/owner" onClick={onClose} className={styles.portalCta}>
          <span className={styles.portalIcon} aria-hidden>
            <PortalIcon />
          </span>
          <span className={styles.portalCopy}>
            <small>For restaurant partners</small>
            <strong>Restaurant Portal</strong>
          </span>
          <b className={styles.portalArrow} aria-hidden>
            →
          </b>
        </Link>
      </aside>
    </div>
  );
}

function ContactLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <a href={href} className={styles.contactLink}>
      <small>{label}</small>
      <strong>{value}</strong>
    </a>
  );
}

function ChevronIcon() {
  return (
    <svg className={styles.contactChevron} viewBox="0 0 24 24" aria-hidden>
      <path d="m7 9.5 5 5 5-5" />
    </svg>
  );
}

function PortalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 10h16M5.5 10v10h13V10M7 4h10l3 6H4l3-6Z" />
      <path d="M9 20v-5h6v5M8 10v2M12 10v2M16 10v2" />
    </svg>
  );
}

function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="Destiny home"
      className="relative block h-11 w-28 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/destiny-wordmark.png"
        alt="Destiny"
        className="absolute top-1/2 left-1/2 w-28 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </Link>
  );
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: NavIconName;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]',
        active && href === '/events'
          ? 'bg-[#1DB954] text-black'
          : active
            ? 'bg-black text-white'
            : 'text-black hover:bg-[#EDEDED]',
      )}
    >
      {icon ? <NavIcon name={icon} /> : null}
      {label}
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const onRestaurantProfile = /^\/restaurant\/[^/]+\/?$/.test(pathname);
  const onReservePage = /^\/restaurant\/[^/]+\/book\/?$/.test(pathname);
  const hideForContextualPage = onRestaurantProfile || onReservePage;
  const [hidden, setHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => isTabActive(pathname, tab.href)),
  );

  useEffect(() => {
    if (hideForContextualPage) return;
    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const currentY = Math.max(0, window.scrollY);

        if (currentY <= 80) {
          lastScrollYRef.current = currentY;
          setHidden(false);
          return;
        }

        const delta = currentY - lastScrollYRef.current;
        if (Math.abs(delta) < 10) return;

        setHidden(delta > 0);
        lastScrollYRef.current = currentY;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hideForContextualPage]);

  useEffect(() => {
    if (hideForContextualPage) return;
    const frame = window.requestAnimationFrame(() => {
      setHidden(false);
      lastScrollYRef.current = window.scrollY;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hideForContextualPage, pathname]);

  if (hideForContextualPage) return null;

  return (
    <nav
      aria-label="Primary app navigation"
      aria-hidden={hidden || undefined}
      inert={hidden ? true : undefined}
      className={cn(
        'fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%_-_2rem)] max-w-[22.5rem] -translate-x-1/2 rounded-[20px] border border-white/15 bg-[#101010]/92 p-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_42px_rgba(0,0,0,0.48),0_3px_10px_rgba(0,0,0,0.34)] backdrop-blur-[18px] transition-[transform,opacity] will-change-[transform,opacity]',
        hidden
          ? 'pointer-events-none translate-y-[130%] opacity-0 duration-[600ms] ease-[cubic-bezier(0.22,0.7,0.2,1)]'
          : 'translate-y-0 opacity-100 duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
      )}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="relative grid grid-cols-3">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 flex h-9 w-1/3 justify-center transition-transform duration-300 ease-[cubic-bezier(0.2,0.85,0.25,1.1)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        >
          <span className="h-9 w-12 rounded-[12px] bg-[#1DB954] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_5px_16px_rgba(29,185,84,0.3)]" />
        </div>

        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group focus-visible:outline-inset relative z-10 flex min-h-[4.1rem] flex-col items-center justify-start gap-1 rounded-[14px] pt-0 pb-1 text-[11px] transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-[#1DB954] active:scale-[0.97]',
              )}
            >
              <span
                className={cn(
                  'grid h-9 min-w-12 place-items-center px-2 transition-colors duration-200',
                  active
                    ? 'text-[#101010]'
                    : 'text-[#8A8A8A] group-hover:text-white',
                )}
              >
                <NavIcon name={tab.icon} />
              </span>
              <span
                className={cn(
                  'leading-none tracking-[-0.01em] transition-colors duration-200',
                  active
                    ? 'font-extrabold text-[#1DB954]'
                    : 'font-semibold text-[#8A8A8A] group-hover:text-white',
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isTabActive(pathname: string, href: string) {
  if (href === '/') {
    return (
      ['/discover', '/search', '/quiz', '/restaurant'].some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      ) || pathname === '/'
    );
  }
  if (href === '/events') {
    return pathname === '/events' || pathname.startsWith('/events/');
  }
  return [
    '/account',
    '/bookings',
    '/friends',
    '/account',
    '/login',
    '/owner',
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function AnimatedMenuIcon() {
  return (
    <span className={styles.menuGlyph} aria-hidden>
      <span />
      <span />
      <span />
    </span>
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
  if (name === 'events') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }
  if (name === 'profile') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="6" cy="6" r="1.5" />
      <circle cx="18" cy="6" r="1.5" />
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
    </svg>
  );
}

import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import styles from './others.module.css';

export const metadata = { title: 'Others' };

type MenuIconName =
  'saved' | 'bookings' | 'friends' | 'account' | 'help' | 'about' | 'portal';

export default async function OthersPage() {
  const user = await getSessionUser();
  const accountHref = user
    ? user.role === 'owner'
      ? '/owner/dashboard'
      : '/account'
    : '/login';
  const portalHref =
    user?.role === 'owner' ? '/owner/dashboard' : '/owner/login';

  const destinations: ReadonlyArray<{
    href: string;
    label: string;
    description: string;
    icon: MenuIconName;
    anchor?: boolean;
  }> = [
    {
      href: '/saved',
      label: 'Saved',
      description: 'The places you want to come back to.',
      icon: 'saved',
    },
    {
      href: '/bookings',
      label: 'My Bookings',
      description: 'Upcoming tables and past plans.',
      icon: 'bookings',
    },
    {
      href: '/friends',
      label: 'Friends',
      description: 'See what your people are choosing.',
      icon: 'friends',
    },
    {
      href: accountHref,
      label: user ? 'Account' : 'Log in',
      description: 'Preferences, sharing, and profile controls.',
      icon: 'account',
    },
    {
      href: '#help',
      label: 'Help',
      description: 'Quick answers for bookings and restaurant pages.',
      icon: 'help',
      anchor: true,
    },
    {
      href: '#about',
      label: 'About',
      description: 'Why Destiny exists for the NITW crowd.',
      icon: 'about',
      anchor: true,
    },
    {
      href: portalHref,
      label: 'Restaurant Portal',
      description: 'Manage menus, offers, events, and bookings.',
      icon: 'portal',
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.intro}>
          <span>Everything else</span>
          <h1>Your Destiny toolbox.</h1>
          <p>Saved plans, bookings, account controls, and restaurant tools.</p>
        </header>

        <nav className={styles.menuGrid} aria-label="More Destiny destinations">
          {destinations.map((item) => {
            const content = (
              <>
                <span className={styles.iconWrap}>
                  <MenuIcon name={item.icon} />
                </span>
                <span className={styles.cardCopy}>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <ArrowIcon />
              </>
            );

            return item.anchor ? (
              <a key={item.label} href={item.href} className={styles.menuCard}>
                {content}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={styles.menuCard}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div className={styles.infoGrid}>
          <section id="help" className={styles.infoCard}>
            <span>Help</span>
            <h2>Need to change a plan?</h2>
            <p>
              Open My Bookings to review a reservation. For restaurant-specific
              questions, use the contact details on that restaurant&apos;s page.
            </p>
            <Link href="/bookings">Open My Bookings</Link>
          </section>

          <section id="about" className={styles.infoCard}>
            <span>About</span>
            <h2>Made for quick campus decisions.</h2>
            <p>
              Destiny brings NITW restaurants, current offers, and nearby events
              into one short path from “where?” to a real plan.
            </p>
            <Link href="/discover">Discover a place</Link>
          </section>
        </div>
      </div>
    </main>
  );
}

function MenuIcon({ name }: { name: MenuIconName }) {
  const common = {
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  if (name === 'saved') {
    return (
      <svg {...common}>
        <path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.8 6.5 21V4.5Z" />
      </svg>
    );
  }
  if (name === 'bookings') {
    return (
      <svg {...common}>
        <path d="M7 3v5M4.5 3v3.5A2.5 2.5 0 0 0 7 9v12M9.5 3v3.5A2.5 2.5 0 0 1 7 9M16 3v18M16 3c3 1.6 4.5 4 4.5 7.2H16" />
      </svg>
    );
  }
  if (name === 'friends') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M3.5 20c.5-4 2.3-6 5.5-6s5 2 5.5 6M14 14.8c3.4-.7 5.6 1 6.3 4.2" />
      </svg>
    );
  }
  if (name === 'account') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.7-4.5 3.2-6.8 7.5-6.8s6.8 2.3 7.5 6.8" />
      </svg>
    );
  }
  if (name === 'help') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.5 2.5 0 1 1 3.6 2.2c-.9.5-1.3 1-1.3 2M12 17.3h.01" />
      </svg>
    );
  }
  if (name === 'about') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10.5V17M12 7h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 21V7l8-4 8 4v14M8 21v-5h8v5M8 9h.01M12 9h.01M16 9h.01M8 12.5h.01M12 12.5h.01M16 12.5h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

import Link from 'next/link';
import { ToolboxDisclosure } from './ToolboxDisclosure';
import { RestaurantPortalLink } from './RestaurantPortalLink';
import styles from './others.module.css';

export const metadata = { title: 'Others' };

type MenuIconName = 'saved' | 'portal';

export default function OthersPage() {
  const destinations: ReadonlyArray<{
    href: string;
    label: string;
    icon: MenuIconName;
  }> = [
    {
      href: '/saved',
      label: 'Saved',
      icon: 'saved',
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.menuGrid} aria-label="More Destiny destinations">
          {destinations.map((item) => {
            const content = (
              <>
                <span className={styles.iconWrap}>
                  <MenuIcon name={item.icon} />
                </span>
                <span className={styles.cardCopy}>
                  <strong>{item.label}</strong>
                </span>
                <ArrowIcon />
              </>
            );

            return (
              <Link
                key={item.label}
                href={item.href}
                className={styles.menuCard}
              >
                {content}
              </Link>
            );
          })}

          <ToolboxDisclosure kind="about" />
          <ToolboxDisclosure kind="contact" />
        </nav>

        <RestaurantPortalLink className={styles.portalCard}>
          <span className={styles.portalIconWrap}>
            <MenuIcon name="portal" />
          </span>
          <span className={styles.portalCopy}>
            <small>For restaurant partners</small>
            <strong>Restaurant Portal</strong>
          </span>
          <ArrowIcon />
        </RestaurantPortalLink>
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

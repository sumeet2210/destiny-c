import Link from 'next/link';
import { cn } from '@/lib/cn';
import styles from './auth-shell.module.css';

export const authStyles = styles;

type AuthAudience = 'student' | 'owner';

const audienceCopy: Record<
  AuthAudience,
  { image: string; headline: string; detail: string }
> = {
  student: {
    image: '/home/hero-campus-feast.webp',
    headline: 'Your next table starts here.',
    detail: 'Save restaurants, keep track of bookings, and plan with friends.',
  },
  owner: {
    image: '/home/biryani-adda.webp',
    headline: 'Keep your restaurant ready for the next plan.',
    detail: 'Manage your profile, menu, offers, events, photos, and bookings.',
  },
};

export function AuthShell({
  audience,
  title,
  description,
  children,
  footer,
}: {
  audience: AuthAudience;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const copy = audienceCopy[audience];

  return (
    <main
      className={cn(
        styles.page,
        audience === 'student' && styles.inAppShell,
        audience === 'student' && styles.student,
      )}
    >
      <div className={styles.frame}>
        {audience === 'owner' ? (
          <section className={styles.media} aria-label={copy.headline}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={copy.image} alt="" aria-hidden="true" />
            <div className={styles.mediaShade} aria-hidden="true" />
            <div className={styles.mediaCopy}>
              <h2>{copy.headline}</h2>
              <p>{copy.detail}</p>
            </div>
          </section>
        ) : null}

        <section className={styles.formPanel} aria-labelledby="auth-title">
          <div className={styles.panelTop}>
            {audience === 'owner' ? (
              <Link href="/" aria-label="Destiny home" className={styles.logo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/destiny-wordmark.png" alt="Destiny" />
              </Link>
            ) : null}

            <Link
              href="/"
              className={styles.backLink}
              aria-label="Back to discovery"
            >
              <BackIcon />
              {audience === 'owner' ? 'Back to discovery' : null}
            </Link>
          </div>

          <div className={styles.formWrap}>
            <header className={styles.heading}>
              <h1 id="auth-title">{title}</h1>
              <p>{description}</p>
            </header>

            {children}

            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path
        d="M19 12H5m6-6-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SubmitArrow() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

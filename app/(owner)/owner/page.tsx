import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PortalLoginForm } from '@/components/features/PortalLoginForm';
import { getSessionUser } from '@/lib/auth/session';
import styles from './portal.module.css';

export const metadata = { title: 'Restaurant Portal' };

export default async function RestaurantPortalPage() {
  const user = await getSessionUser();

  if (user?.role === 'owner') redirect('/owner/dashboard');

  return (
    <main className={styles.page}>
      <section className={styles.content} aria-labelledby="portal-title">
        <Link
          href="/"
          className={styles.backLink}
          aria-label="Back to discovery"
        >
          <BackIcon />
        </Link>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>For restaurant partners</span>
          <h1 id="portal-title">
            <span>Welcome to</span>
            <span>destiny</span>
          </h1>
        </div>

        <div className={styles.actions}>
          <div className={styles.choices}>
            <PortalLoginForm />

            <Link href="/owner/apply" className={styles.choiceCard}>
              <span className={styles.choiceCopy}>
                <strong>New to Destiny</strong>
                <small>Create a restaurant profile and join Destiny.</small>
              </span>
              <span className={`${styles.cardAction} ${styles.signupAction}`}>
                List your restaurant
                <ArrowIcon />
              </span>
            </Link>
          </div>

          <p className={styles.support}>
            Manage your profile, menu, bookings, offers, and insights in one
            place.
          </p>
        </div>
      </section>
    </main>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5m6-6-6 6 6 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

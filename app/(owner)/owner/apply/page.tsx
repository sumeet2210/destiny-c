import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RestaurantApplicationForm } from '@/components/features/owner/RestaurantApplicationForm';
import { getSessionUser } from '@/lib/auth/session';
import styles from '../application.module.css';

export const metadata = { title: 'List your restaurant' };

export default async function RestaurantApplicationPage() {
  const user = await getSessionUser();
  if (user?.role === 'owner') redirect('/owner/dashboard');

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/owner" className={styles.back} aria-label="Back">
          ←
        </Link>
        <header className={styles.heading}>
          <span className={styles.applicationHeading}>
            Restaurant application
          </span>
          <p>
            Submit the essentials for verification. You’ll create your account
            and complete the full profile only after approval.
          </p>
        </header>
        <RestaurantApplicationForm />
      </div>
    </main>
  );
}

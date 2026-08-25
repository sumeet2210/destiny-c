import Link from 'next/link';
import { signOut } from '@/lib/auth/actions';
import { requireAdmin } from '@/lib/auth/session';
import styles from '../admin.module.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <Link href="/admin">Restaurant approvals</Link>
        <form action={signOut}>
          <button type="submit">Log out</button>
        </form>
      </header>
      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}

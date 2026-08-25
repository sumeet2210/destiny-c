import Link from 'next/link';
import {
  listAdminApplications,
  listRestaurantsForProfileReview,
} from '@/lib/queries/admin';
import styles from '../admin.module.css';

export const metadata = { title: 'Restaurant approvals' };

export default async function AdminDashboardPage() {
  const [applications, profiles] = await Promise.all([
    listAdminApplications(),
    listRestaurantsForProfileReview(),
  ]);
  return (
    <>
      <section className={styles.adminTitle}>
        <span>Destiny administration</span>
        <h1>Restaurant applications</h1>
        <p>
          {applications.filter((item) => item.status === 'pending').length}{' '}
          awaiting verification
        </p>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableHead}>
          <span>Application</span>
          <span>Contact</span>
          <span>Status</span>
          <span>Date</span>
        </div>
        {applications.length ? (
          applications.map((application) => (
            <Link
              href={`/admin/applications/${application.id}`}
              className={styles.tableRow}
              key={application.id}
            >
              <span>
                <strong>{application.restaurant_name}</strong>
                <small>{application.application_id}</small>
              </span>
              <span>
                <strong>{application.owner_name}</strong>
                <small>{application.email}</small>
              </span>
              <span>
                <b data-status={application.status}>
                  {application.status.replaceAll('_', ' ')}
                </b>
              </span>
              <span>
                <small>
                  {new Date(application.created_at).toLocaleDateString('en-IN')}
                </small>
              </span>
            </Link>
          ))
        ) : (
          <p className={styles.empty}>No restaurant applications yet.</p>
        )}
      </section>

      <section className={styles.adminTitle}>
        <span>Final approval</span>
        <h2>Profiles awaiting activation</h2>
      </section>
      <section className={styles.reviewGrid}>
        {profiles.length ? (
          profiles.map((restaurant) => (
            <article className={styles.reviewCard} key={restaurant.id}>
              <div>
                <strong>{restaurant.name}</strong>
                <small>
                  {restaurant.owner_name} · {restaurant.area}
                </small>
              </div>
              <Link
                className={styles.reviewLink}
                href={`/admin/restaurants/${restaurant.id}`}
              >
                Review profile →
              </Link>
            </article>
          ))
        ) : (
          <p className={styles.empty}>No profiles are awaiting review.</p>
        )}
      </section>
    </>
  );
}

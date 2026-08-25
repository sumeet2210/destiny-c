import Link from 'next/link';
import { ApprovedAccountForm } from '@/components/features/owner/ApprovedAccountForm';
import { MoreInformationForm } from '@/components/features/owner/MoreInformationForm';
import { getApplicationByAccess } from '@/lib/onboarding/actions';
import styles from '../../application.module.css';

export const metadata = {
  title: 'Restaurant application status',
  referrer: 'no-referrer',
};

export default async function RestaurantApplicationStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const token = typeof query.token === 'string' ? query.token : '';
  const application = await getApplicationByAccess(id, token);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/owner" className={styles.back} aria-label="Back">
          ←
        </Link>
        <header className={styles.heading}>
          <span>Restaurant application</span>
          <h1>
            {application ? application.restaurant_name : 'Status unavailable'}
          </h1>
        </header>

        {!application ? (
          <section className={styles.statusCard}>
            <h2>Invalid or expired link</h2>
            <p>
              Use the private status link provided when the application was
              submitted or approved.
            </p>
          </section>
        ) : (
          <ApplicationStatus application={application} token={token} />
        )}
      </div>
    </main>
  );
}

function ApplicationStatus({
  application,
  token,
}: {
  application: NonNullable<Awaited<ReturnType<typeof getApplicationByAccess>>>;
  token: string;
}) {
  return (
    <section className={styles.statusCard}>
      <span className={styles.statusLabel}>
        {application.status.replaceAll('_', ' ')}
      </span>
      <p>
        Application ID:{' '}
        <strong className={styles.applicationId}>
          {application.application_id}
        </strong>
      </p>

      {application.status === 'pending' ? (
        <>
          <h2>Application submitted successfully</h2>
          <p>
            Our team will verify your details and notify you once your
            restaurant is approved. An account cannot be created while
            verification is pending.
          </p>
        </>
      ) : null}

      {application.status === 'approved' && !application.claimed_at ? (
        <>
          <h2>Your restaurant is approved</h2>
          <p>
            Create your password to open the restaurant dashboard and complete
            the profile.
          </p>
          <ApprovedAccountForm
            applicationId={application.application_id}
            email={application.email}
            token={token}
          />
        </>
      ) : null}

      {application.status === 'approved' && application.claimed_at ? (
        <>
          <h2>Account created</h2>
          <p>
            Your approved application has been claimed. Continue through the
            restaurant portal.
          </p>
          <Link className={styles.inlineAction} href="/owner/login">
            Open restaurant login →
          </Link>
        </>
      ) : null}

      {application.status === 'rejected' ? (
        <>
          <h2>Application not approved</h2>
          <p>
            {application.rejection_reason ||
              'The application did not pass verification.'}
          </p>
        </>
      ) : null}

      {application.status === 'more_info_required' ? (
        <>
          <h2>More information required</h2>
          <p>{application.more_info_request}</p>
          <MoreInformationForm
            applicationId={application.application_id}
            token={token}
          />
        </>
      ) : null}
    </section>
  );
}

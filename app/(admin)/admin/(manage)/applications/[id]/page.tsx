import { notFound } from 'next/navigation';
import { AdminApplicationActions } from '@/components/features/admin/AdminApplicationActions';
import { getAdminApplication } from '@/lib/queries/admin';
import styles from '../../../admin.module.css';

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getAdminApplication(id);
  if (!bundle) notFound();
  const { application, audit } = bundle;
  const items = [
    ['Application ID', application.application_id],
    ['Restaurant Name', application.restaurant_name],
    ['Owner Name', application.owner_name],
    ['Phone', application.phone],
    ['Email', application.email],
    ['Address', application.restaurant_address],
    [
      'Application Date',
      new Date(application.created_at).toLocaleString('en-IN'),
    ],
    ['Current Status', application.status.replaceAll('_', ' ')],
  ];
  return (
    <>
      <section className={styles.adminTitle}>
        <span>{application.application_id}</span>
        <h1>{application.restaurant_name}</h1>
      </section>
      <section className={styles.detailGrid}>
        {items.map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <p>{value}</p>
          </div>
        ))}
        {application.applicant_response ? (
          <div className={styles.detailWide}>
            <small>Applicant’s additional information</small>
            <p>{application.applicant_response}</p>
          </div>
        ) : null}
      </section>
      {application.status === 'pending' ? (
        <AdminApplicationActions id={application.id} />
      ) : null}
      <section className={styles.audit}>
        <h2>Audit history</h2>
        {audit.length ? (
          audit.map((entry) => (
            <p key={entry.id}>
              <strong>{String(entry.action).replaceAll('_', ' ')}</strong> ·{' '}
              {new Date(String(entry.created_at)).toLocaleString('en-IN')}
              {entry.notes ? ` · ${entry.notes}` : ''}
            </p>
          ))
        ) : (
          <p>No admin action recorded yet.</p>
        )}
      </section>
    </>
  );
}

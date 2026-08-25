'use client';

import { useState, useTransition } from 'react';
import { reviewRestaurantApplication } from '@/lib/admin/actions';
import styles from '@/app/(admin)/admin/admin.module.css';

export function AdminApplicationActions({ id }: { id: string }) {
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (decision: 'approved' | 'rejected' | 'more_info_required') =>
    startTransition(async () => {
      const result = await reviewRestaurantApplication({
        id,
        decision,
        reason,
      });
      setMessage(result.message ?? null);
      setUrl(result.secureUrl ?? null);
    });
  return (
    <section className={styles.actionPanel}>
      <h2>Review decision</h2>
      <label>
        <span>Reason or information request</span>
        <textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <div className={styles.actionButtons}>
        <button disabled={pending} onClick={() => run('approved')}>
          Approve
        </button>
        <button disabled={pending} onClick={() => run('more_info_required')}>
          Request More Information
        </button>
        <button disabled={pending} data-danger onClick={() => run('rejected')}>
          Reject
        </button>
      </div>
      {message ? <p>{message}</p> : null}
      {url ? (
        <label>
          <span>Secure applicant link</span>
          <input
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      ) : null}
    </section>
  );
}

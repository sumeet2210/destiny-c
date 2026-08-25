'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { provideMoreInformation } from '@/lib/onboarding/actions';
import styles from '@/app/(owner)/owner/application.module.css';

export function MoreInformationForm({
  applicationId,
  token,
}: {
  applicationId: string;
  token: string;
}) {
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className={styles.moreInfoForm}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await provideMoreInformation({
            applicationId,
            token,
            response,
          });
          if (!result.ok)
            setError(result.message ?? 'Could not send information.');
          else router.refresh();
        });
      }}
    >
      <label className={styles.accountField}>
        <span>Your response</span>
        <textarea
          required
          rows={5}
          maxLength={2000}
          value={response}
          onChange={(event) => setResponse(event.target.value)}
        />
      </label>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send information for review'}
      </button>
    </form>
  );
}

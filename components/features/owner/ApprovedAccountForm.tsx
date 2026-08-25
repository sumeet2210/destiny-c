'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createApprovedOwnerAccount } from '@/lib/onboarding/actions';
import styles from '@/app/(owner)/owner/application.module.css';

export function ApprovedAccountForm({
  applicationId,
  email,
  token,
}: {
  applicationId: string;
  email: string;
  token: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={styles.accountForm}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          setError(null);
          const result = await createApprovedOwnerAccount({
            applicationId,
            token,
            password,
            confirmPassword,
          });
          if (!result.ok)
            setError(result.message ?? 'Could not create the account.');
          else
            router.push(result.message ? '/owner/login' : '/owner/dashboard');
        });
      }}
    >
      <label className={styles.accountField}>
        <span>Approved email</span>
        <input value={email} disabled />
      </label>
      <label className={styles.accountField}>
        <span>Password</span>
        <span className={styles.passwordWrap}>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      <label className={styles.accountField}>
        <span>Confirm password</span>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account and continue'}
      </button>
    </form>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ownerLogin } from '@/lib/auth/actions';
import styles from '@/app/(owner)/owner/portal.module.css';

export function PortalLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className={`${styles.choiceCard} ${styles.loginCard}`}>
      <form
        className={styles.loginForm}
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setError(null);
            const result = await ownerLogin(email.trim(), password);

            if (!result.ok) {
              setError(result.message ?? 'Login failed. Please try again.');
              return;
            }

            router.push('/owner/dashboard');
          });
        }}
      >
        <label className={styles.loginField}>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <div className={styles.loginField}>
          <label htmlFor="portal-password">Password</label>
          <span className={styles.passwordControl}>
            <input
              id="portal-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <EyeIcon hidden={showPassword} />
            </button>
          </span>
        </div>

        {error ? (
          <p className={styles.loginError} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className={styles.cardAction} disabled={pending}>
          {pending ? 'Logging in…' : 'Log in to portal'}
          {!pending ? <ArrowIcon /> : null}
        </button>
      </form>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

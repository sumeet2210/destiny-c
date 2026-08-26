'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  AuthShell,
  SubmitArrow,
  authStyles as styles,
} from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { ownerLogin } from '@/lib/auth/actions';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthShell audience="owner" title="Restaurant Portal" variant="portal">
      <div className={styles.ownerOptions}>
        <section
          className={styles.ownerLoginBox}
          aria-labelledby="owner-login-title"
        >
          <header className={styles.ownerLoginHeading}>
            <h2 id="owner-login-title">Log in to your account</h2>
          </header>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                setError(null);
                const res = await ownerLogin(email.trim(), password);
                if (!res.ok) setError(res.message ?? 'Login failed.');
                else router.replace('/owner/dashboard');
              });
            }}
            className={styles.form}
          >
            <div className={styles.fieldGroup}>
              <Label htmlFor="email" className={styles.label}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                className={styles.field}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <Label htmlFor="password" className={styles.label}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className={styles.field}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className={styles.primaryButton}
              disabled={pending}
            >
              {pending ? 'Logging in...' : 'Log in'}
              {!pending ? <SubmitArrow /> : null}
            </Button>
          </form>
        </section>

        <Link href="/owner/signup" className={styles.ownerJoinCard}>
          <span className={styles.ownerOptionEyebrow}>New to Destiny</span>
          <strong>List your restaurant</strong>
          <span className={styles.ownerOptionArrow} aria-hidden="true">
            <SubmitArrow />
          </span>
        </Link>
      </div>
    </AuthShell>
  );
}

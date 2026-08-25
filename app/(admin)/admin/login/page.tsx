'use client';

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

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <AuthShell
      audience="owner"
      title="Destiny admin"
      description="Authorized team members only."
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await ownerLogin(email.trim(), password);
            if (!result.ok) setError(result.message ?? 'Login failed.');
            else router.push('/admin');
          });
        }}
      >
        <div className={styles.fieldGroup}>
          <Label htmlFor="admin-email" className={styles.label}>
            Email
          </Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            className={styles.field}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <Label htmlFor="admin-password" className={styles.label}>
            Password
          </Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            className={styles.field}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className={styles.primaryButton}
          disabled={pending}
        >
          {pending ? 'Logging in…' : 'Log in'}
          {!pending ? <SubmitArrow /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}

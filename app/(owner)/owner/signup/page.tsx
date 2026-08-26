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
import { ownerSignup } from '@/lib/auth/actions';

export default function OwnerSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthShell
      audience="owner"
      title="List your restaurant."
      description="Create an account, add your restaurant, and we'll approve it—usually within a day. No commission, ever."
      footer={
        <p>
          Already listed? <Link href="/owner/login">Owner login</Link>
        </p>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setError(null);
            setNotice(null);
            const res = await ownerSignup(
              email.trim(),
              password,
              fullName.trim(),
            );
            if (!res.ok) setError(res.message ?? 'Signup failed.');
            else if (res.message) setNotice(res.message);
            else router.push('/owner/dashboard');
          });
        }}
        className={styles.form}
      >
        <div className={styles.fieldGroup}>
          <Label htmlFor="name" className={styles.label}>
            Your name
          </Label>
          <Input
            id="name"
            autoComplete="name"
            required
            autoFocus
            className={styles.field}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <Label htmlFor="email" className={styles.label}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
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
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            className={styles.field}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p id="password-hint" className={styles.fieldHint}>
            At least 8 characters
          </p>
        </div>

        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}

        {notice ? (
          <p role="status" className={styles.notice}>
            {notice}
          </p>
        ) : null}

        <Button
          type="submit"
          className={styles.primaryButton}
          disabled={pending}
        >
          {pending ? 'Creating account...' : 'Create account'}
          {!pending ? <SubmitArrow /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}

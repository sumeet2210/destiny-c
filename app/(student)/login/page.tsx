'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';
import {
  AuthShell,
  authStyles as styles,
} from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { STUDENT_EMAIL_DOMAINS } from '@/config/auth';
import { requestStudentOtp, verifyStudentOtp } from '@/lib/auth/actions';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sendCode = () =>
    startTransition(async () => {
      setError(null);
      const res = await requestStudentOtp({ name, phone, email });
      if (!res.ok) setError(res.message ?? 'Could not send the code.');
      else setStep('code');
    });

  const verify = () =>
    startTransition(async () => {
      setError(null);
      const res = await verifyStudentOtp({
        name,
        phone,
        email,
        token: code.trim(),
      });
      if (!res.ok) setError(res.message ?? "That code didn't work.");
      else router.push(params.get('next') ?? '/');
    });

  return (
    <AuthShell
      audience="student"
      variant="minimal"
      title={
        step === 'email' ? 'Your next table starts here.' : 'Check your inbox.'
      }
      description={
        step === 'code'
          ? 'Enter the one-time code to continue to Destiny.'
          : undefined
      }
    >
      {step === 'email' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendCode();
          }}
          className={styles.form}
        >
          <div className={styles.fieldGroup}>
            <Label htmlFor="name" className={styles.label}>
              Name
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              autoFocus
              maxLength={80}
              className={styles.field}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="phone" className={styles.label}>
              Phone no.
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              pattern="[6-9][0-9]{9}"
              minLength={10}
              maxLength={10}
              placeholder="10-digit mobile number"
              className={styles.field}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
              }
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="email" className={styles.label}>
              NITW email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder={`rollno@${STUDENT_EMAIL_DOMAINS[0]}`}
              className={styles.field}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className={`${styles.primaryButton} ${styles.compactButton}`}
            disabled={pending}
          >
            {pending ? 'Sending...' : 'Send code'}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            verify();
          }}
          className={styles.form}
        >
          <p className={styles.stepDetail}>
            Code sent to <strong>{email}</strong>
          </p>

          <div className={styles.fieldGroup}>
            <Label htmlFor="code" className={styles.label}>
              Login code
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              className={`${styles.field} ${styles.codeField}`}
              value={code}
              // Strip anything that isn't a digit: pasting from the email is the
              // normal path and it tends to bring spaces along. Deliberately no
              // maxLength or length pattern — the linked project issues 8-digit
              // codes even though supabase/config.toml says otp_length = 6, so
              // a hardcoded width here would silently truncate a valid code.
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ''))
              }
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
            {pending ? 'Checking...' : 'Log in'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.secondaryButton}
            onClick={() => {
              setError(null);
              setStep('email');
            }}
          >
            Use a different email
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

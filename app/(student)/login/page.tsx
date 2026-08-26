'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';
import {
  AuthShell,
  SubmitArrow,
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
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Whether the code step has to collect an address too. A flag rather than
  // `!email`, which would hide the field again on the first keystroke.
  const [askEmail, setAskEmail] = useState(false);

  const sendCode = () =>
    startTransition(async () => {
      setError(null);
      const res = await requestStudentOtp(email.trim());
      if (!res.ok) setError(res.message ?? 'Could not send the code.');
      else {
        setAskEmail(false);
        setStep('code');
      }
    });

  const verify = () =>
    startTransition(async () => {
      setError(null);
      const res = await verifyStudentOtp(email.trim(), code.trim());
      if (!res.ok) setError(res.message ?? "That code didn't work.");
      else router.push(params.get('next') ?? '/');
    });

  return (
    <AuthShell
      audience="student"
      title={step === 'email' ? 'Welcome back.' : 'Check your inbox.'}
      description={
        step === 'email'
          ? 'Use your institute email. We will send a one-time code, so there is no password to remember.'
          : 'Enter the one-time code to continue to Destiny.'
      }
      footer={
        <p>
          Run a restaurant? <Link href="/owner/login">Owner login</Link>
        </p>
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
            <Label htmlFor="email" className={styles.label}>
              NITW email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
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
            className={styles.primaryButton}
            disabled={pending}
          >
            {pending ? 'Sending...' : 'Send code'}
            {!pending ? <SubmitArrow /> : null}
          </Button>

          {/* A student who closed the tab still has a code in their inbox,
              and a failed send should not strand them on this step. */}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setAskEmail(true);
              setStep('code');
            }}
            className={styles.textButton}
          >
            I already have a code
          </button>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            verify();
          }}
          className={styles.form}
        >
          {askEmail ? (
            /* Landing straight on this step via "I already have a code" means we
               never captured an address, and verifyOtp matches the code against
               one — without this field the escape hatch can only ever fail. */
            <div className={styles.fieldGroup}>
              <Label htmlFor="code-email" className={styles.label}>
                NITW email
              </Label>
              <Input
                id="code-email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                placeholder={`rollno@${STUDENT_EMAIL_DOMAINS[0]}`}
                className={styles.field}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          ) : (
            <p className={styles.stepDetail}>
              Code sent to <strong>{email}</strong>
            </p>
          )}

          <div className={styles.fieldGroup}>
            <Label htmlFor="code" className={styles.label}>
              Login code
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus={!askEmail}
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
            {!pending ? <SubmitArrow /> : null}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.secondaryButton}
            onClick={() => {
              setError(null);
              setAskEmail(false);
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

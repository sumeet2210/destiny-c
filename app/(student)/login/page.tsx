'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';
import { STUDENT_EMAIL_DOMAINS } from '@/config/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
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

  const sendCode = () =>
    startTransition(async () => {
      setError(null);
      const res = await requestStudentOtp(email.trim());
      if (!res.ok) setError(res.message ?? 'Could not send the code.');
      else setStep('code');
    });

  const verify = () =>
    startTransition(async () => {
      setError(null);
      const res = await verifyStudentOtp(email.trim(), code.trim());
      if (!res.ok) setError(res.message ?? 'That code didn’t work.');
      else router.push(params.get('next') ?? '/');
    });

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        Student login
      </h1>
      <p className="text-text-muted mt-1 text-sm">
        OTP to your institute email — no password to forget.
      </p>

      <Card className="mt-6 space-y-4">
        {step === 'email' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">NITW email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                placeholder={`rollno@${STUDENT_EMAIL_DOMAINS[0]}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-accent-urgent-text text-[13px]">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Sending…' : 'Send code'}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
            className="space-y-4"
          >
            <p className="text-text-muted text-sm">
              Code sent to <span className="text-paper">{email}</span>.
            </p>
            <div>
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                className="font-mono tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-accent-urgent-text text-[13px]">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Checking…' : 'Log in'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setStep('email')}
            >
              Different email
            </Button>
          </form>
        )}
      </Card>

      <p className="text-text-muted mt-6 text-center text-[13px]">
        Run a restaurant?{' '}
        <a
          href="/owner/login"
          className="text-accent-primary underline-offset-2 hover:underline"
        >
          Owner login
        </a>
      </p>
    </main>
  );
}

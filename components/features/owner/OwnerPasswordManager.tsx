'use client';

import { useState, useTransition } from 'react';
import { PasswordInput } from '@/components/features/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import {
  requestOwnerPasswordCode,
  updateOwnerPassword,
  verifyOwnerPasswordCode,
} from '@/lib/auth/actions';

type Step = 'confirm' | 'code' | 'password';

export function OwnerPasswordManager({ maskedEmail }: { maskedEmail: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('confirm');
  const [destination, setDestination] = useState(maskedEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const reset = () => {
    setStep('confirm');
    setCode('');
    setPassword('');
    setConfirmPassword('');
  };

  const close = () => {
    if (pending) return;
    setOpen(false);
    reset();
  };

  const sendCode = () => {
    startTransition(async () => {
      const result = await requestOwnerPasswordCode();
      toast(
        result.ok
          ? `Code sent to ${result.maskedEmail ?? destination}`
          : (result.message ?? 'Could not send the code.'),
        result.ok ? 'positive' : 'error',
      );
      if (result.ok) {
        if (result.maskedEmail) setDestination(result.maskedEmail);
        setCode('');
        setStep('code');
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Forgot password
      </Button>

      <Sheet open={open} onClose={close} title="Change password">
        <PasswordSteps current={step} />

        {step === 'confirm' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-paper font-semibold">Send a code?</h3>
              <p className="text-text-muted mt-1 text-sm leading-6">
                We’ll email a one-time verification code to{' '}
                <span className="text-paper font-medium">{destination}</span>.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="button" disabled={pending} onClick={sendCode}>
                {pending ? 'Sending…' : 'Send code'}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'code' ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await verifyOwnerPasswordCode(code);
                toast(
                  result.ok
                    ? 'Email code verified'
                    : (result.message ?? 'Could not verify the code.'),
                  result.ok ? 'positive' : 'error',
                );
                if (result.ok) {
                  setCode('');
                  setStep('password');
                }
              });
            }}
          >
            <div>
              <h3 className="text-paper font-semibold">Check your email</h3>
              <p className="text-text-muted mt-1 text-sm leading-6">
                Enter the code sent to {destination}. It can only be used once.
              </p>
            </div>
            <div>
              <Label htmlFor="owner-password-code">Verification code</Label>
              <Input
                id="owner-password-code"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 8))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                minLength={6}
                maxLength={8}
                placeholder="Enter the code"
                className="font-mono tracking-[0.18em]"
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={sendCode}
              >
                Send a new code
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Verifying…' : 'Verify code'}
              </Button>
            </div>
          </form>
        ) : null}

        {step === 'password' ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await updateOwnerPassword({
                  password,
                  confirmPassword,
                });
                toast(
                  result.ok
                    ? 'Password changed successfully'
                    : (result.message ?? 'Could not change the password.'),
                  result.ok ? 'positive' : 'error',
                );
                if (result.ok) {
                  setOpen(false);
                  reset();
                }
                if (
                  !result.ok &&
                  result.message?.startsWith('Verify a new email code')
                ) {
                  setStep('confirm');
                }
              });
            }}
          >
            <div>
              <h3 className="text-paper font-semibold">
                Choose a new password
              </h3>
              <p className="text-text-muted mt-1 text-sm leading-6">
                Your email is verified. Use at least 8 characters.
              </p>
            </div>
            <div>
              <Label htmlFor="owner-new-password">New password</Label>
              <PasswordInput
                id="owner-new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                className="pr-12"
                autoFocus
                required
              />
            </div>
            <div>
              <Label htmlFor="owner-confirm-password">Confirm password</Label>
              <PasswordInput
                id="owner-confirm-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                className="pr-12"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : 'Confirm & save password'}
              </Button>
            </div>
          </form>
        ) : null}
      </Sheet>
    </>
  );
}

function PasswordSteps({ current }: { current: Step }) {
  const steps: Array<{ key: Step; label: string }> = [
    { key: 'confirm', label: 'Send' },
    { key: 'code', label: 'Verify' },
    { key: 'password', label: 'Password' },
  ];
  const activeIndex = steps.findIndex((step) => step.key === current);

  return (
    <ol
      className="mb-6 grid grid-cols-3 gap-2"
      aria-label="Password change steps"
    >
      {steps.map((step, index) => (
        <li key={step.key} className="min-w-0">
          <div
            className={`mb-2 h-1 rounded-full ${
              index <= activeIndex ? 'bg-accent-primary' : 'bg-surface-muted'
            }`}
          />
          <span
            className={`text-[11px] font-semibold ${
              index <= activeIndex ? 'text-paper' : 'text-text-muted'
            }`}
          >
            {index + 1}. {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
    <main className="mx-auto max-w-md px-4 py-10">
      <Link
        href="/"
        className="font-display text-accent-primary text-xl font-extrabold"
      >
        Destiny
      </Link>
      <h1 className="font-display text-paper mt-6 text-2xl font-extrabold">
        List your restaurant
      </h1>
      <p className="text-text-muted mt-1 text-sm">
        Create an account, add your restaurant, and we&apos;ll approve it —
        usually within a day. No commission, ever.
      </p>

      <Card className="mt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              setError(null);
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
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-accent-urgent-text text-[13px]">{error}</p>
          )}
          {notice && (
            <p className="text-accent-secondary text-[13px]">{notice}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </Card>

      <p className="text-text-muted mt-6 text-center text-[13px]">
        Already listed?{' '}
        <Link
          href="/owner/login"
          className="text-accent-primary underline-offset-2 hover:underline"
        >
          Owner login
        </Link>
      </p>
    </main>
  );
}

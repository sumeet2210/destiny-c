'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { ownerLogin } from '@/lib/auth/actions';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
        Owner login
      </h1>
      <p className="text-text-muted mt-1 text-sm">
        Manage your profile, menu, offers and events.
      </p>

      <Card className="mt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              setError(null);
              const res = await ownerLogin(email.trim(), password);
              if (!res.ok) setError(res.message ?? 'Login failed.');
              else router.push('/owner/dashboard');
            });
          }}
          className="space-y-4"
        >
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-accent-urgent-text text-[13px]">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </Card>

      <p className="text-text-muted mt-6 text-center text-[13px]">
        New here?{' '}
        <Link
          href="/owner/signup"
          className="text-accent-primary underline-offset-2 hover:underline"
        >
          List your restaurant
        </Link>{' '}
        · Student?{' '}
        <Link
          href="/login"
          className="text-accent-primary underline-offset-2 hover:underline"
        >
          Student login
        </Link>
      </p>
    </main>
  );
}

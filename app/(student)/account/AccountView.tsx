'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SharingToggle } from '@/components/features/SharingToggle';
import { AuthGuard } from '@/components/features/AuthGuard';
import { useSession } from '@/lib/session';

export function AccountView() {
  return (
    <AuthGuard role="student">
      <AccountContent />
    </AuthGuard>
  );
}

function AccountContent() {
  const { user, signOut } = useSession();
  const router = useRouter();

  // The guard only renders children once authenticated; this covers the rare
  // token-without-profile frame and satisfies the type narrowing.
  if (!user) return null;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div>
        <p className="text-accent-primary text-xs font-extrabold tracking-[0.14em] uppercase">
          Student profile
        </p>
        <h1 className="font-display text-paper mt-1 text-2xl font-extrabold">
          Your Destiny
        </h1>
      </div>

      <Card className="space-y-3">
        <ProfileDetail label="Name" value={user.full_name ?? 'NITW student'} />
        <ProfileDetail label="Phone" value={user.phone ?? 'Not added yet'} />
        <ProfileDetail label="Email" value={user.email} />
        {user.nitw_verified && (
          <p className="text-accent-secondary text-[12px]">NITW verified</p>
        )}
      </Card>

      <Link
        href="/bookings"
        className="rounded-card border-border-hairline bg-surface-muted text-paper flex min-h-16 items-center justify-between border px-4 text-sm font-extrabold no-underline transition-colors hover:border-[#1DB954]"
      >
        <span>My bookings</span>
        <span aria-hidden>→</span>
      </Link>

      <SharingToggle
        initialValue={user.share_activity}
        initialHostel={user.hostel}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={async () => {
          await signOut();
          router.push('/');
        }}
      >
        Log out
      </Button>
    </main>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-muted block text-[10px] font-extrabold tracking-[0.12em] uppercase">
        {label}
      </span>
      <p className="text-paper mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

import { Card } from '@/components/ui/Card';
import { requireStudent } from '@/lib/auth/session';
import { signOut } from '@/lib/auth/actions';
import Link from 'next/link';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const user = await requireStudent('/account');

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-paper text-2xl font-extrabold">
            Student profile
          </h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-control inline-flex min-h-8 items-center justify-center bg-[#3a3a3a] px-3 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#d0d0d0] transition-colors hover:bg-[#505050] hover:text-white"
          >
            Log out
          </button>
        </form>
      </div>

      <Card className="space-y-3">
        <ProfileDetail label="Name" value={user.full_name ?? 'NITW student'} />
        <ProfileDetail label="Phone" value={user.phone ?? 'Not added yet'} />
        <ProfileDetail label="Email" value={user.email} />
        {user.nitw_verified && (
          <p className="text-accent-secondary text-[12px]">NITW verified</p>
        )}
      </Card>

      {/* The three places a student's own history lives. Saved and bookings
          already existed; reviews had no route in from anywhere, which is why a
          student could write one and never see it again. */}
      <nav aria-label="Your activity" className="space-y-3">
        <ProfileShortcut href="/saved" label="Saved places" />
        <ProfileShortcut href="/bookings" label="My bookings" />
        <ProfileShortcut href="/reviews" label="My reviews" />
      </nav>
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

function ProfileShortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-card border-border-hairline bg-surface-muted text-paper hover:border-accent-primary flex min-h-12 items-center justify-center border px-3 text-base font-extrabold no-underline transition-colors"
    >
      {label}
    </Link>
  );
}

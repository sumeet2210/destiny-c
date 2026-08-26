import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FoodPreferences } from '@/components/features/FoodPreferences';
import { SharingToggle } from '@/components/features/SharingToggle';
import { requireStudent } from '@/lib/auth/session';
import { signOut } from '@/lib/auth/actions';
import Link from 'next/link';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const user = await requireStudent('/account');

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

      {/* The three places a student's own history lives. Saved and bookings
          already existed; reviews had no route in from anywhere, which is why a
          student could write one and never see it again. */}
      <nav aria-label="Your activity" className="space-y-3">
        <ProfileShortcut href="/saved" label="Saved places" />
        <ProfileShortcut href="/bookings" label="My bookings" />
        <ProfileShortcut href="/reviews" label="My reviews" />
      </nav>

      <FoodPreferences
        initialFoodType={user.food_type}
        initialFavoriteCuisines={user.favorite_cuisines}
        initialSpicePreference={user.spice_preference}
      />

      <SharingToggle
        initialValue={user.share_activity}
        initialHostel={user.hostel}
      />

      <form action={signOut}>
        <Button type="submit" variant="outline" className="w-full">
          Log out
        </Button>
      </form>
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
      className="rounded-card border-border-hairline bg-surface-muted text-paper hover:border-accent-primary flex min-h-16 items-center justify-between border px-4 text-sm font-extrabold no-underline transition-colors"
    >
      <span>{label}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}

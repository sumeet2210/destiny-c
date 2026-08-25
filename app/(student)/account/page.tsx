import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FoodPreferences } from '@/components/features/FoodPreferences';
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
          <p className="text-accent-primary text-xs font-extrabold tracking-[0.14em] uppercase">
            Student profile
          </p>
          <h1 className="font-display text-paper mt-1 text-2xl font-extrabold">
            Your Destiny
          </h1>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
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

      <div className="space-y-3">
        <ProfileShortcut href="/saved" label="Saved" />
        <ProfileShortcut href="/bookings" label="Bookings" />
        <ProfileShortcut href="/reviews" label="My Reviews" />
      </div>

      <FoodPreferences
        initialFoodType={user.food_type}
        initialFavoriteCuisines={user.favorite_cuisines}
        initialSpicePreference={user.spice_preference}
      />
    </main>
  );
}

function ProfileShortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group rounded-card border-border-hairline bg-surface-muted text-paper hover:border-accent-primary flex min-h-16 items-center justify-between border px-4 text-sm font-extrabold no-underline transition-colors"
    >
      <span>{label}</span>
      <b className="text-accent-primary transition-transform group-hover:translate-x-1">
        →
      </b>
    </Link>
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

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SharingToggle } from '@/components/features/SharingToggle';
import { requireStudent } from '@/lib/auth/session';
import { signOut } from '@/lib/auth/actions';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const user = await requireStudent('/account');

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 py-6">
      <h1 className="font-display text-paper text-2xl font-extrabold">
        Account
      </h1>

      <Card className="space-y-1">
        <p className="text-paper text-sm font-medium">{user.full_name}</p>
        <p className="text-text-muted text-[13px]">{user.email}</p>
        {user.nitw_verified && (
          <p className="text-accent-secondary text-[12px]">NITW verified</p>
        )}
      </Card>

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

'use client';

// Client guard for the whole owner console. Auth moved into Express and the Next
// server no longer holds the session, so the old server-side requireOwner() is
// replaced by <AuthGuard role="owner">, which reads the localStorage session
// after mount and redirects non-owners to /owner/login. Every /owner/(manage)/*
// page renders inside this, so individual pages don't need their own guard.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OwnerNav } from '@/components/features/OwnerNav';
import { AuthGuard } from '@/components/features/AuthGuard';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/lib/session';

export default function OwnerManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useSession();
  const router = useRouter();

  return (
    <AuthGuard role="owner">
      <div className="mx-auto flex min-h-full w-full max-w-6xl">
        <aside className="border-border-hairline hidden w-52 shrink-0 flex-col gap-1 border-r p-4 sm:flex">
          <Link
            href="/"
            className="font-display text-accent-primary mb-4 text-lg font-extrabold"
          >
            Destiny
          </Link>
          <OwnerNav />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-auto w-full"
            onClick={async () => {
              await signOut();
              router.push('/owner/login');
            }}
          >
            Log out
          </Button>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="border-border-hairline border-b p-3 sm:hidden">
            <OwnerNav horizontal />
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}

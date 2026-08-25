import { OwnerNav } from '@/components/features/OwnerNav';
import { Button } from '@/components/ui/Button';
import { requireOwner } from '@/lib/auth/session';
import { signOut } from '@/lib/auth/actions';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export default async function OwnerManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seed mode has no auth; let the pages render their not-configured notices.
  if (isSupabaseConfigured()) {
    await requireOwner();
  }

  return (
    <div className="min-h-full w-full">
      <header className="bg-canvas/90 sticky top-0 z-30 px-3 pt-3 backdrop-blur-md sm:px-6 sm:pt-5">
        <div className="rounded-control bg-surface-muted/80 flex items-center gap-2 p-2 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
          <div className="min-w-0 flex-1">
            <OwnerNav horizontal />
          </div>
          <form action={signOut} className="shrink-0">
            <Button
              type="submit"
              size="sm"
              className="w-fit !bg-[#2a2a2a] !text-[#b5b5b5] hover:!bg-[#343434] hover:!text-white"
            >
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

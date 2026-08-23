'use client';

// Shared fetch-on-mount gate for the owner management pages that need the
// restaurant bundle (profile, photos, offers, menu, events). Auth moved into
// Express, so these can no longer read the bundle on the server; each page now
// renders this gate, which fetches the bundle, shows the standard loading/error
// scaffolding, and — when the owner has no restaurant yet — sends them to the
// dashboard, which hosts the create-restaurant flow. The render prop hands the
// loaded bundle plus a `reload` so managers can refresh after a write.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBlock, LoadingBlock } from '@/components/features/AsyncStates';
import { getOwnerBundle } from '@/lib/api/owner';
import type { OwnerBundle } from '@/lib/api/types';
import { useApi } from '@/lib/hooks/useApi';

export function OwnerBundleGate({
  children,
}: {
  children: (bundle: OwnerBundle, reload: () => void) => React.ReactNode;
}) {
  const { data: bundle, loading, error, reload } = useApi(
    () => getOwnerBundle(),
    [],
  );
  const router = useRouter();

  // Loaded, no error, but no restaurant → the dashboard owns onboarding.
  useEffect(() => {
    if (!loading && !error && bundle === null) {
      router.replace('/owner/dashboard');
    }
  }, [loading, error, bundle, router]);

  if (error) return <ErrorBlock message={error} onRetry={reload} />;
  if (!bundle) return <LoadingBlock label="Loading your restaurant…" />;
  return <>{children(bundle, reload)}</>;
}

'use client';

// Small client-side data-fetching hook for pages that used to be Server
// Components reading Supabase directly. Now the Next server holds no session, so
// authed reads happen after mount against the Express API. One hook keeps
// loading/error/empty handling consistent across every migrated page.
//
// Pass a STABLE `deps` array (like useEffect); the fetcher is intentionally not
// in the dependency list so an inline arrow doesn't refetch on every render.
import { useCallback, useEffect, useState } from 'react';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run the fetcher (e.g. after a mutation). */
  reload: () => void;
};

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}

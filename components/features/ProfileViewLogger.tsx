'use client';

import { useEffect } from 'react';
import { logProfileView } from '@/lib/api/views';

/**
 * Fires the profile_views log once per profile mount (P3-13). Client-side so
 * link prefetching doesn't inflate the numbers.
 */
export function ProfileViewLogger({
  restaurantId,
  source,
}: {
  restaurantId: string;
  source: string;
}) {
  useEffect(() => {
    logProfileView(restaurantId, source);
  }, [restaurantId, source]);

  return null;
}

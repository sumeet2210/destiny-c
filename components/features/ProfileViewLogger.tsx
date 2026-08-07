'use client';

import { useEffect } from 'react';

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
    fetch('/api/profile-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, source }),
      keepalive: true,
    }).catch(() => {});
  }, [restaurantId, source]);

  return null;
}

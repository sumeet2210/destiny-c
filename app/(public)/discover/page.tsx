import { SquadGoingSection } from '@/components/features/SquadGoingSection';
import { getSessionUser } from '@/lib/auth/session';
import {
  applyFilters,
  listRestaurantSummaries,
  type RestaurantSummary,
} from '@/lib/queries/catalog';
import { getSavedIds } from '@/lib/queries/social';
import styles from './discover.module.css';

export const metadata = { title: 'Discover' };

const DISCOVER_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
};

function withDiscoverArtwork(restaurants: RestaurantSummary[]) {
  return restaurants.map((restaurant) => {
    const artwork = DISCOVER_ARTWORK[restaurant.name];
    return artwork
      ? { ...restaurant, photos: [artwork, ...restaurant.photos.slice(1)] }
      : restaurant;
  });
}

export default async function DiscoverPage() {
  const [restaurants, user, savedIds] = await Promise.all([
    listRestaurantSummaries(),
    getSessionUser(),
    getSavedIds(),
  ]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <SquadGoingSection
          restaurants={withDiscoverArtwork(
            applyFilters(restaurants, { sort: 'trending' }),
          )}
          loggedIn={user?.role === 'student'}
          initialSavedIds={[...savedIds]}
        />
      </div>
    </main>
  );
}

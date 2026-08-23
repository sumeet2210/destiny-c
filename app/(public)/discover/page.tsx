import { SquadGoingSection } from '@/components/features/SquadGoingSection';
import { listRestaurants } from '@/lib/api/restaurants';
import type { RestaurantSummary } from '@/lib/api/types';
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
  const restaurants = await listRestaurants({ sort: 'trending' });

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <SquadGoingSection restaurants={withDiscoverArtwork(restaurants)} />
      </div>
    </main>
  );
}

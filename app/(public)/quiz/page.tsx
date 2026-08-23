import type { Metadata } from 'next';
import { listRestaurants } from '@/lib/api/restaurants';
import type { RestaurantSummary } from '@/lib/api/types';
import { MatchFinder } from './MatchFinder';
import styles from './quiz.module.css';

const MATCH_ARTWORK: Record<string, string> = {
  'Biryani Adda': '/home/biryani-adda.webp',
  'Momo Nation': '/home/momo-nation.webp',
  'Chai Theory': '/home/chai-theory.webp',
  'Southern Spice Tiffins': '/home/southern-spice.webp',
  'Scoops & Stories': '/home/scoops-stories.webp',
};

export const metadata: Metadata = {
  title: 'Find your perfect spot',
  description:
    'Answer five quick questions and get restaurant matches for your budget, group, food, and mood.',
};

function withMatchArtwork(restaurants: RestaurantSummary[]) {
  return restaurants.map((restaurant) => {
    const artwork = MATCH_ARTWORK[restaurant.name];
    return artwork
      ? { ...restaurant, photos: [artwork, ...restaurant.photos.slice(1)] }
      : restaurant;
  });
}

export default async function QuizPage() {
  const restaurants = withMatchArtwork(await listRestaurants());

  return (
    <main className={styles.finder}>
      <MatchFinder restaurants={restaurants} />
    </main>
  );
}

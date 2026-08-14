import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { listRestaurantSummaries } from '@/lib/queries/catalog';
import type { RestaurantSummary } from '@/lib/queries/catalog';
import { MatchFinder } from './MatchFinder';
import styles from './quiz.module.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-destiny-match',
});

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
  const restaurants = withMatchArtwork(await listRestaurantSummaries());

  return (
    <main className={`${styles.finder} ${manrope.variable}`}>
      <MatchFinder restaurants={restaurants} />
    </main>
  );
}

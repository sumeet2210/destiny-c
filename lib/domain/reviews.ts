// Rating aggregation. Shared by the public catalog and the owner portal on
// purpose: an owner looking at their own rating must see exactly the number a
// student sees, so there is only one place this arithmetic can live.

/** Mean of the given ratings, or null when there is nothing to average. */
export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

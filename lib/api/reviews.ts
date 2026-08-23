// Reviews: student creates a review against a completed booking. Authed.
import { apiFetch } from './client';

export type CreateReviewInput = {
  bookingId: string;
  rating: number;
  comment?: string;
};

export async function createReview(input: CreateReviewInput): Promise<void> {
  await apiFetch('/reviews', { method: 'POST', auth: true, body: input });
}

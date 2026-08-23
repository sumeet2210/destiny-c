'use client';

// The "you visited this place — leave a review" prompt used to be computed on the
// server from the student's bookings. With the session now in the browser, this
// small client overlay fetches the student's bookings and shows the form only
// when a completed, confirmed, not-yet-reviewed booking exists for this place.
import { ReviewForm } from '@/components/features/ReviewForm';
import { listStudentBookings } from '@/lib/api/bookings';
import type { StudentBooking } from '@/lib/api/types';
import { canReview } from '@/lib/domain/booking';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session';
import styles from './restaurant.module.css';

export function ReviewPrompt({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string;
  restaurantName: string;
}) {
  const { role } = useSession();
  const isStudent = role === 'student';
  const { data: bookings, reload } = useApi(
    () =>
      isStudent ? listStudentBookings() : Promise.resolve<StudentBooking[]>([]),
    [isStudent],
  );

  const reviewable = bookings?.find(
    (booking) =>
      booking.restaurant_id === restaurantId &&
      canReview(booking) &&
      !booking.alreadyReviewed,
  );
  if (!reviewable) return null;

  return (
    <div className={styles.writeReview}>
      <span>You visited this place.</span>
      <ReviewForm
        bookingId={reviewable.id}
        restaurantName={restaurantName}
        onPosted={reload}
      />
    </div>
  );
}

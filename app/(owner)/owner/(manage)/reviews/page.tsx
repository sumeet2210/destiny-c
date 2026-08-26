// Reviews moved in with analytics when the owner portal was consolidated. Kept
// as a redirect rather than deleted so an owner's bookmark still works.
import { redirect } from 'next/navigation';

export default function OwnerReviewsPage() {
  redirect('/owner/analytics');
}

// Events moved in with offers when the owner portal was consolidated. Kept as a
// redirect rather than deleted so an owner's bookmark still works.
import { redirect } from 'next/navigation';

export default function OwnerEventsPage() {
  redirect('/owner/offers-events');
}

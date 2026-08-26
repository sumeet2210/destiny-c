// Offers moved in with events when the owner portal was consolidated. Kept as a
// redirect rather than deleted so an owner's bookmark still works.
import { redirect } from 'next/navigation';

export default function OwnerOffersPage() {
  redirect('/owner/offers-events');
}

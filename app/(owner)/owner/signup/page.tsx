import { redirect } from 'next/navigation';

/** Legacy route retained so old links cannot bypass application approval. */
export default function OwnerSignupPage() {
  redirect('/owner/apply');
}

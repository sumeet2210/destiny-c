import { redirect } from 'next/navigation';

export const metadata = { title: 'Photos' };

export default async function OwnerPhotosPage() {
  redirect('/owner/profile');
}

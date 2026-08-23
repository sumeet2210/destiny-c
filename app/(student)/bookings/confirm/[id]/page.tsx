// P6-8: the page the reminder email links to. Server shell keeps the <title>;
// the client view fetches the booking (the Next server no longer holds the
// session, so authed data loads after mount behind the route guard).
import { ConfirmView } from './ConfirmView';

export const metadata = { title: 'Still coming?' };

export default async function ConfirmPage(
  props: PageProps<'/bookings/confirm/[id]'>,
) {
  const { id } = await props.params;
  return <ConfirmView id={id} />;
}

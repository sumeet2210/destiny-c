// Profile-view logger. Fire-and-forget analytics; an optional user is stamped
// when logged in (auth: true attaches a token only if present). Never disrupts
// the page, so all failures are swallowed.
import { apiFetch } from './client';

export async function logProfileView(
  restaurantId: string,
  source?: string,
): Promise<void> {
  try {
    await apiFetch('/views', {
      method: 'POST',
      auth: true,
      body: { restaurantId, source },
    });
  } catch {
    // best-effort
  }
}

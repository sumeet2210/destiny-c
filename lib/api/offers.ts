// Offers: public ticker read + crowd flag write.
import { apiFetch, type ReadOptions } from './client';
import type { TickerOffer } from './types';

export async function listTickerOffers(
  opts: ReadOptions = {},
): Promise<TickerOffer[]> {
  const res = await apiFetch<{ ok: true; offers: TickerOffer[] }>(
    '/offers/ticker',
    opts,
  );
  return res.offers;
}

/** Crowd-sourced "this offer is wrong" flag. The endpoint takes an optional
 *  user (auth: true attaches a token only when logged in), and a failed flag
 *  should never disrupt the page — so swallow errors. */
export async function flagOffer(offerId: string): Promise<void> {
  try {
    await apiFetch(`/offers/${encodeURIComponent(offerId)}/flag`, {
      method: 'POST',
      auth: true,
    });
  } catch {
    // best-effort
  }
}

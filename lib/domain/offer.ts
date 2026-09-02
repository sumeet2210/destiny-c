export const OFFER_DESCRIPTION_MAX_WORDS = 100;
export const OFFER_DESCRIPTION_MAX_CHARACTERS = 1500;

type OfferDescriptionResult =
  | { ok: true; value: string; wordCount: number }
  | { ok: false; message: string; wordCount: number };

export function countOfferDescriptionWords(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const clean = value.trim();
  return clean ? clean.split(/\s+/u).length : 0;
}

export function normalizeOfferDescription(
  value: unknown,
): OfferDescriptionResult {
  const clean =
    typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
  const wordCount = countOfferDescriptionWords(clean);

  if (!clean) {
    return {
      ok: false,
      message: 'Add a description about the offer.',
      wordCount,
    };
  }
  if (
    wordCount > OFFER_DESCRIPTION_MAX_WORDS ||
    clean.length > OFFER_DESCRIPTION_MAX_CHARACTERS
  ) {
    return {
      ok: false,
      message: `Keep the offer description within ${OFFER_DESCRIPTION_MAX_WORDS} words.`,
      wordCount,
    };
  }

  return { ok: true, value: clean, wordCount };
}

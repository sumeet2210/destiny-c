import { describe, expect, it } from 'vitest';
import {
  countOfferDescriptionWords,
  normalizeOfferDescription,
  OFFER_DESCRIPTION_MAX_WORDS,
} from './offer';

describe('offer descriptions', () => {
  it('normalizes whitespace and counts words', () => {
    expect(countOfferDescriptionWords('  lunch\n special  today ')).toBe(3);
    expect(normalizeOfferDescription('  lunch\n special  today ')).toEqual({
      ok: true,
      value: 'lunch special today',
      wordCount: 3,
    });
  });

  it('accepts exactly 100 words', () => {
    const description = Array.from(
      { length: OFFER_DESCRIPTION_MAX_WORDS },
      (_, index) => `word${index}`,
    ).join(' ');

    expect(normalizeOfferDescription(description).ok).toBe(true);
  });

  it('rejects more than 100 words', () => {
    const description = Array.from(
      { length: OFFER_DESCRIPTION_MAX_WORDS + 1 },
      (_, index) => `word${index}`,
    ).join(' ');

    expect(normalizeOfferDescription(description)).toEqual({
      ok: false,
      message: 'Keep the offer description within 100 words.',
      wordCount: 101,
    });
  });

  it('requires a description', () => {
    expect(normalizeOfferDescription('   ')).toEqual({
      ok: false,
      message: 'Add a description about the offer.',
      wordCount: 0,
    });
  });
});

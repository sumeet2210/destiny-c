import { describe, expect, it } from 'vitest';
import {
  hasRecentOwnerEmailOtp,
  maskAccountEmail,
  normalizeOwnerPasswordCode,
  OWNER_PASSWORD_OTP_MAX_AGE_SECONDS,
  validateNewOwnerPassword,
} from './owner-password';

describe('normalizeOwnerPasswordCode', () => {
  it.each(['123456', '12345678', '123 456', '1234 5678'])(
    'accepts a supported numeric code: %s',
    (code) => {
      expect(normalizeOwnerPasswordCode(code).ok).toBe(true);
    },
  );

  it.each(['', '12345', '123456789', '12AB56'])('rejects %s', (code) => {
    expect(normalizeOwnerPasswordCode(code).ok).toBe(false);
  });
});

describe('validateNewOwnerPassword', () => {
  it('accepts matching passwords with at least eight characters', () => {
    expect(
      validateNewOwnerPassword({
        password: 'safer-passphrase',
        confirmPassword: 'safer-passphrase',
      }),
    ).toEqual({ ok: true, password: 'safer-passphrase' });
  });

  it('rejects short and mismatched passwords', () => {
    expect(
      validateNewOwnerPassword({ password: 'short', confirmPassword: 'short' })
        .ok,
    ).toBe(false);
    expect(
      validateNewOwnerPassword({
        password: 'new-password',
        confirmPassword: 'different-password',
      }),
    ).toEqual({ ok: false, message: 'The two passwords do not match.' });
  });
});

describe('hasRecentOwnerEmailOtp', () => {
  const now = 2_000_000;

  it('accepts a recent OTP authentication entry', () => {
    expect(
      hasRecentOwnerEmailOtp(
        [{ method: 'otp', timestamp: now - 60 }],
        now - 60,
        now,
      ),
    ).toBe(true);
  });

  it('uses the signed token issue time for string AMR entries', () => {
    expect(hasRecentOwnerEmailOtp(['email'], now - 60, now)).toBe(true);
  });

  it('rejects password auth and stale OTP sessions', () => {
    expect(
      hasRecentOwnerEmailOtp(
        [{ method: 'password', timestamp: now - 10 }],
        now - 10,
        now,
      ),
    ).toBe(false);
    expect(
      hasRecentOwnerEmailOtp(
        [
          {
            method: 'otp',
            timestamp: now - OWNER_PASSWORD_OTP_MAX_AGE_SECONDS - 1,
          },
        ],
        now - OWNER_PASSWORD_OTP_MAX_AGE_SECONDS - 1,
        now,
      ),
    ).toBe(false);
  });
});

describe('maskAccountEmail', () => {
  it('keeps the destination recognizable without exposing it in full', () => {
    expect(maskAccountEmail('owner@example.com')).toBe('ow***@example.com');
    expect(maskAccountEmail('a@example.com')).toBe('a***@example.com');
  });
});

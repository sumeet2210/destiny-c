import { describe, expect, it } from 'vitest';
import {
  isOwnerPasswordCodeError,
  maskAccountEmail,
  normalizeOwnerPasswordCode,
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

describe('isOwnerPasswordCodeError', () => {
  it.each([
    { code: 'reauthentication_not_valid', message: 'Invalid nonce' },
    { code: 'otp_expired', message: 'Expired' },
    { message: 'Reauthentication nonce is invalid' },
    { message: 'Token has expired or is invalid' },
  ])('recognizes a rejected reauthentication code', (error) => {
    expect(isOwnerPasswordCodeError(error)).toBe(true);
  });

  it('does not treat a password-policy error as a rejected code', () => {
    expect(
      isOwnerPasswordCodeError({
        code: 'weak_password',
        message: 'Password is too weak',
      }),
    ).toBe(false);
  });
});

describe('maskAccountEmail', () => {
  it('keeps the destination recognizable without exposing it in full', () => {
    expect(maskAccountEmail('owner@example.com')).toBe('ow***@example.com');
    expect(maskAccountEmail('a@example.com')).toBe('a***@example.com');
  });
});

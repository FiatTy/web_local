import { describe, expect, it } from 'vitest';
import { getPasswordRules, isPasswordValid } from '@/lib/password-rules';

describe('getPasswordRules', () => {
  it('reports every rule as unmet for an empty password', () => {
    expect(getPasswordRules('')).toEqual({
      minLength: false,
      upper: false,
      lower: false,
      number: false,
      special: false,
    });
  });

  it('reports each rule independently', () => {
    expect(getPasswordRules('abcdefgh')).toMatchObject({
      minLength: true,
      lower: true,
      upper: false,
    });
    expect(getPasswordRules('ABC1')).toMatchObject({
      upper: true,
      number: true,
      minLength: false,
    });
    expect(getPasswordRules('a@b').special).toBe(true);
  });

  it('accepts a dot as a special character', () => {
    expect(getPasswordRules('Passw0rd.').special).toBe(true);
  });
});

describe('isPasswordValid', () => {
  it('accepts a password meeting all five rules', () => {
    expect(isPasswordValid('Pass1234!')).toBe(true);
  });

  it('rejects a password that is long and complex but has no special character', () => {
    expect(isPasswordValid('Password123')).toBe(false);
  });

  it('rejects a password shorter than eight characters', () => {
    expect(isPasswordValid('Pa1!')).toBe(false);
  });
});

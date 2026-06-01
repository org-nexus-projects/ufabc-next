import type { User } from '@ufabc-next/services';
import { describe, expect, test } from 'vitest';

import { createMockJwt } from '@/mocks/jwt';
import { isUserTokenExpired, isValidJwtFormat, parseJwt } from '@/utils/jwt';

describe('jwt utilities', () => {
  describe('parseJwt', () => {
    test('returns decoded payload for a valid token', () => {
      const payload = { _id: '1', ra: 12345 };
      const token = createMockJwt(payload);

      expect(parseJwt(token)).toEqual({ user: payload, error: null });
    });

    test('returns error for a malformed token', () => {
      expect(parseJwt('not-a-jwt')).toEqual({
        user: null,
        error: 'Invalid token format',
      });
    });

    test('returns error for a token with invalid base64 payload', () => {
      expect(parseJwt('header.invalid-payload.signature')).toEqual({
        user: null,
        error: 'Invalid token format',
      });
    });
  });

  describe('isValidJwtFormat', () => {
    test('returns true for a token with three base64url parts', () => {
      const token = createMockJwt({ sub: 'user' });
      expect(isValidJwtFormat(token)).toBe(true);
    });

    test('returns false for a non-JWT string', () => {
      expect(isValidJwtFormat('not-a-jwt')).toBe(false);
    });

    test('returns false for a token missing parts', () => {
      expect(isValidJwtFormat('only.two')).toBe(false);
    });
  });

  describe('isUserTokenExpired', () => {
    test('returns false for a token issued within the last day', () => {
      const user = { iat: Math.floor(Date.now() / 1000) - 60 * 60 } as User;
      expect(isUserTokenExpired(user)).toBe(false);
    });

    test('returns true for a token issued more than 7 days ago', () => {
      const user = {
        iat: Math.floor(Date.now() / 1000) - 8 * 24 * 60 * 60,
      } as User;
      expect(isUserTokenExpired(user)).toBe(true);
    });
  });
});

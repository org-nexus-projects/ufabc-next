import { describe, expect, it } from 'vitest';

import { sanitizeHeaders, serializeQueryParams } from './sanitize.js';

describe('sanitizeHeaders', () => {
  it('redacts sensitive header keys from a plain object', () => {
    const result = sanitizeHeaders({
      Authorization: 'Bearer secret-token',
      Cookie: 'session=abc123',
      'Content-Type': 'application/json',
    });

    expect(result).toEqual({
      Authorization: '[REDACTED]',
      Cookie: '[REDACTED]',
      'Content-Type': 'application/json',
    });
  });

  it('redacts sensitive header keys from a Headers instance', () => {
    const headers = new Headers();
    headers.set('Authorization', 'Bearer secret-token');
    headers.set('Set-Cookie', 'JSESSIONID=xyz');
    headers.set('Accept', 'application/json');

    const result = sanitizeHeaders(headers);

    expect(result).toEqual({
      authorization: '[REDACTED]',
      'set-cookie': '[REDACTED]',
      accept: 'application/json',
    });
  });

  it('returns undefined when headers are undefined', () => {
    expect(sanitizeHeaders(undefined)).toBeUndefined();
  });
});

describe('serializeQueryParams', () => {
  it('serializes a query object into a JSON string', () => {
    expect(serializeQueryParams({ ra: '123', season: '2024:3' })).toBe(
      JSON.stringify({ ra: '123', season: '2024:3' })
    );
  });

  it('returns undefined for an empty query object', () => {
    expect(serializeQueryParams({})).toBeUndefined();
  });

  it('returns undefined for null or non-object values', () => {
    expect(serializeQueryParams(null)).toBeUndefined();
    expect(serializeQueryParams('not-an-object')).toBeUndefined();
  });
});

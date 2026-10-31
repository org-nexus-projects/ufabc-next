import { describe, expect, it } from 'vitest';

import { setTeacherCacheEntry } from '../../src/models/Teacher.js';

describe('setTeacherCacheEntry', () => {
  it('evicts the oldest entry once maxSize is reached', () => {
    const cache = new Map<string, string | null>();

    setTeacherCacheEntry(cache, 'a', 'teacher-a', 2);
    setTeacherCacheEntry(cache, 'b', 'teacher-b', 2);
    setTeacherCacheEntry(cache, 'c', 'teacher-c', 2);

    expect(cache.size).toBe(2);
    expect(cache.has('a')).toBe(false);
    expect(cache.get('b')).toBe('teacher-b');
    expect(cache.get('c')).toBe('teacher-c');
  });

  it('does not evict when updating an existing key at capacity', () => {
    const cache = new Map<string, string | null>();

    setTeacherCacheEntry(cache, 'a', 'teacher-a', 2);
    setTeacherCacheEntry(cache, 'b', 'teacher-b', 2);
    setTeacherCacheEntry(cache, 'a', 'teacher-a-updated', 2);

    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBe('teacher-a-updated');
    expect(cache.get('b')).toBe('teacher-b');
  });
});

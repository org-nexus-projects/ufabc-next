import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';

import { createMockJwt } from '@/mocks/jwt';
import { useAuthStore } from '@/stores/auth';

describe('useAuthStore', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
  });

  test('initial state is logged out', () => {
    expect(authStore.isLoggedIn).toBe(false);
    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
  });

  test('authenticate sets user and token for a valid JWT', () => {
    const payload = { _id: 'user-1', ra: 12345 };
    const token = createMockJwt(payload);

    authStore.authenticate(token);

    expect(authStore.isLoggedIn).toBe(true);
    expect(authStore.token).toBe(token);
    expect(authStore.user).toEqual(payload);
  });

  test('authenticate ignores an invalid token', () => {
    authStore.authenticate('not-a-jwt');

    expect(authStore.isLoggedIn).toBe(false);
    expect(authStore.token).toBeNull();
    expect(authStore.user).toBeNull();
  });

  test('logOut clears user and token', () => {
    const payload = { _id: 'user-1', ra: 12345 };
    authStore.authenticate(createMockJwt(payload));

    authStore.logOut();

    expect(authStore.isLoggedIn).toBe(false);
    expect(authStore.token).toBeNull();
    expect(authStore.user).toBeNull();
  });
});

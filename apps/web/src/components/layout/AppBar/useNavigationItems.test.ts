import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';

import { createMockJwt } from '@/mocks/jwt';
import { useAuthStore } from '@/stores/auth';

import { useNavigationItems } from './useNavigationItems';

function loginWithPermissions(permissions: string[]) {
  const authStore = useAuthStore();
  authStore.authenticate(
    createMockJwt({ _id: 'user-1', confirmed: true, permissions })
  );
}

function getRoutes() {
  const { internalNavigationItems } = useNavigationItems();
  const routes = [];
  for (const item of internalNavigationItems.value) {
    routes.push(item.route);
  }
  return routes;
}

describe('useNavigationItems', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('hides the archives item without permission', () => {
    loginWithPermissions([]);

    expect(getRoutes()).not.toContain('/archives');
  });

  test('shows the archives item for the archives permission', () => {
    loginWithPermissions(['archives']);

    expect(getRoutes()).toContain('/archives');
  });

  test('shows the archives item for admins', () => {
    loginWithPermissions(['admin']);

    expect(getRoutes()).toContain('/archives');
  });
});

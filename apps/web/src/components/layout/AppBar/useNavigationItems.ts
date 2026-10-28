import { api } from '@next/services';
import { computed } from 'vue';

import { useAuthStore } from '@/stores/auth';
import { runtimeConfig } from '@/utils/runtimeConfig';

import {
  getExternalNavigationItems,
  internalNavigationItems as baseInternalItems,
} from './navigation';

function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[] | undefined
) {
  if (!requiredPermissions) {
    return true;
  }

  for (const permission of requiredPermissions) {
    if (userPermissions.includes(permission)) {
      return true;
    }
  }
  return false;
}

export function useNavigationItems() {
  const authStore = useAuthStore();
  const apiURL = api.defaults.baseURL ?? runtimeConfig.apiBaseUrl;

  const internalNavigationItems = computed(() => {
    const userPermissions = authStore.user?.permissions ?? [];
    const isConfirmed = Boolean(authStore.user?.confirmed);
    const visibleItems = [];

    for (const item of baseInternalItems) {
      if (!hasAnyPermission(userPermissions, item.permissions)) {
        continue;
      }

      visibleItems.push({
        icon: item.icon,
        locked: item.locked(isConfirmed),
        releaseDate: item.releaseDate,
        route: item.route,
        title: item.title,
      });
    }

    return visibleItems;
  });

  const externalNavigationItems = computed(() =>
    getExternalNavigationItems({
      apiURL,
      permissions: authStore.user?.permissions ?? [],
      token: authStore.token,
    })
  );

  return { externalNavigationItems, internalNavigationItems };
}

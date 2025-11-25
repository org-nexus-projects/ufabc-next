import { ref } from 'vue';

import { useAuthStore } from '@/stores/auth';

/**
 * Composable used by v-avatar (Vuetify component) to pass the initials of the username
 * @returns - user initials with two characteres
 */
export function useAliasInitials() {
  const authStore = useAuthStore();

  const alias = ref('');

  const userLogin = authStore.user?.email?.replace('@aluno.ufabc.edu.br', '').toUpperCase();

  if (userLogin) {
    const userSplited = userLogin.split('.');

    if (userSplited.length === 1) {
      alias.value = `${userLogin[0]}${userLogin[1]}`;
      return alias;
    }

    alias.value = `${userLogin[0]}${userSplited[1][0]}`;
    return alias;
  } else {
    return alias;
  }
}

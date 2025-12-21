import { computed } from 'vue';

import { useAuthStore } from '@/stores/auth';

export function useCleanUsername() {
  const authStore = useAuthStore();

  const userCleanUsername = computed(
    () => authStore.user?.email?.replace('@aluno.ufabc.edu.br', '') || '',
  );
  return userCleanUsername;
}

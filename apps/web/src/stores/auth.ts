import type { User } from '@next/services';
import { defineStore } from 'pinia';

import { parseJwt } from '@/utils/jwt';

type AuthState = {
  user: User | null;
  token: string | null;
};

export const useAuthStore = defineStore('auth', {
  actions: {
    authenticate(token: string) {
      const { user, error } = parseJwt(token);
      if (error !== null || user === null) {
        return;
      }
      this.token = token;
      this.user = user;
    },
    logOut() {
      this.user = null;
      this.token = null;
    },
  },
  getters: {
    isLoggedIn: (state): boolean => Boolean(state.user),
  },
  persist: true,
  state: (): AuthState => ({
    token: null,
    user: null,
  }),
});

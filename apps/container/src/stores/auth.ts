import type { User } from '@ufabc-next/services';
import { defineStore } from 'pinia';

import { parseJwt } from '@/utils/jwt';

type AuthState = {
  user: User | null;
  token: string | null;
};

export const useAuthStore = defineStore('auth', {
  persist: true,
  state: (): AuthState => {
    return {
      user: null,
      token: null,
    };
  },
  getters: {
    isLoggedIn: (state): boolean => Boolean(state.user),
  },
  actions: {
    authenticate(token: string) {
      const { user, error } = parseJwt(token);
      if (error || !user) {
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
});

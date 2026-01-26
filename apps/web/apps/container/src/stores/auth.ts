import { User } from '@ufabc-next/types';
import { defineStore } from 'pinia';

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
      if (token) {
        const user = JSON.parse(atob(token.split('.')[1])) as User;
        this.token = token;
        this.user = user;
      }
    },
    logOut(redirect = true) {
      localStorage.removeItem('auth');
      this.user = null;
      this.token = null;

      if (redirect) window.location.href = '/';
    },
  },
});

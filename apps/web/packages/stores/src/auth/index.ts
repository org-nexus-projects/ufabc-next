import type { User } from 'types';
import { persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type UseAuthStore = {
  user: User | null;
  token: string | null;
  isLoggedIn: () => boolean;
  authenticate: (token: string) => void;
  logOut: () => void;
};

const useAuthStore = createStore(
  persist<UseAuthStore>(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: () => !!get().user,
      authenticate: (token) => {
        if (token) {
          const user = JSON.parse(atob(token.split('.')[1])) as User;
          set({ token, user });
        }
      },
      logOut: () => {
        set({ user: null, token: null });
        window.location.href = '/';
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
);

export default useAuthStore;

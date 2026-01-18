import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'speakup-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

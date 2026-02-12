import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { presenceService } from '@/services/presenceService';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void | Promise<void>;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user, token, refreshToken) => {
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
      },
      logout: async () => {
        try {
          await presenceService.leave();
        } catch {
          // ignore
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
      },
      setUser: (user) => set({ user }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'speakup-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Re-export permission functions from hooks for backward compatibility
export {
  isAdmin,
  isSuperAdmin,
  canManageSessions,
  canManageUsers,
  canManagePayments,
} from '@/hooks/usePermissions';

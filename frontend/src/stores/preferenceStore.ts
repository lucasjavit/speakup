import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BackgroundTheme = 'light-gray' | 'blue-sky' | 'warm-sunset' | 'cool-mint' | 'soft-purple';

interface PreferenceState {
  // Background
  backgroundTheme: BackgroundTheme;
  setBackgroundTheme: (theme: BackgroundTheme) => void;

  // Network Indicator
  showNetworkIndicator: boolean;
  setShowNetworkIndicator: (show: boolean) => void;

  // Layout (migrating from localStorage)
  layoutMode: 'spotlight' | 'side-equal' | 'side-70-30';
  setLayoutMode: (mode: 'spotlight' | 'side-equal' | 'side-70-30') => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      // Defaults
      backgroundTheme: 'light-gray',
      showNetworkIndicator: true,
      layoutMode: 'spotlight',

      // Setters
      setBackgroundTheme: (theme) => set({ backgroundTheme: theme }),
      setShowNetworkIndicator: (show) => set({ showNetworkIndicator: show }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
    }),
    {
      name: 'speakup-preferences',
      partialize: (state) => ({
        backgroundTheme: state.backgroundTheme,
        showNetworkIndicator: state.showNetworkIndicator,
        layoutMode: state.layoutMode,
      }),
    }
  )
);

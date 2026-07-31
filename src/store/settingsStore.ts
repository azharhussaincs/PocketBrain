import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, type AppSettings } from '../types/settings';

interface SettingsState extends AppSettings {
  hydrated: boolean;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      hydrated: false,
      setSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: '@pocketbrain/settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hydrated: true });
      },
      partialize: (state) => {
        const { hydrated: _h, setSetting: _s, reset: _r, ...settings } = state;
        return settings;
      },
    },
  ),
);

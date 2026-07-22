import { create } from 'zustand';

interface SettingsState {
  volume: number;
  muted: boolean;
  alwaysOnTop: boolean;
  animationEnabled: boolean;
  setVolume: (value: number) => void;
  setMuted: (value: boolean) => void;
  setAlwaysOnTop: (value: boolean) => void;
  setAnimationEnabled: (value: boolean) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  volume: 35,
  muted: false,
  alwaysOnTop: true,
  animationEnabled: true,
  setVolume: (value) => set({ volume: Math.max(0, Math.min(100, value)) }),
  setMuted: (muted) => set({ muted }),
  setAlwaysOnTop: (alwaysOnTop) => set({ alwaysOnTop }),
  setAnimationEnabled: (animationEnabled) => set({ animationEnabled }),
}));

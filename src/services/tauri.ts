import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

const isTauri = () => '__TAURI_INTERNALS__' in window;

export const desktop = {
  async startDragging() {
    if (isTauri()) await getCurrentWindow().startDragging();
  },
  async openPanel(tab: 'profile' | 'settings') {
    if (isTauri()) await invoke('show_panel', { tab });
  },
  async hidePet() {
    if (isTauri()) await getCurrentWindow().hide();
  },
  async quit() {
    if (isTauri()) await invoke('quit_app');
  },
  async setAlwaysOnTop(enabled: boolean) {
    if (isTauri()) await getCurrentWindow().setAlwaysOnTop(enabled);
  },
};

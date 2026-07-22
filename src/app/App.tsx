import { PanelWindow } from '../features/profile/PanelWindow';
import { PetWindow } from '../features/pet/PetWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';

function resolveView(): 'pet' | 'panel' {
  const isPanelWindow =
    '__TAURI_INTERNALS__' in window && getCurrentWindow().label === 'panel';
  return isPanelWindow || new URLSearchParams(window.location.search).get('view') === 'panel'
    ? 'panel'
    : 'pet';
}

export function App() {
  return resolveView() === 'panel' ? <PanelWindow /> : <PetWindow />;
}

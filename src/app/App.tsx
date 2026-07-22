import { PanelWindow } from '../features/profile/PanelWindow';
import { PetWindow } from '../features/pet/PetWindow';

function resolveView(): 'pet' | 'panel' {
  return new URLSearchParams(window.location.search).get('view') === 'panel' ? 'panel' : 'pet';
}

export function App() {
  return resolveView() === 'panel' ? <PanelWindow /> : <PetWindow />;
}

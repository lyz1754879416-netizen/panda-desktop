import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PanelWindow } from './features/profile/PanelWindow';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PanelWindow />
  </StrictMode>,
);

import { useRef, useState } from 'react';
import pandaImage from '../../assets/pandas/panda_huahua_mvp/idle.png';
import { desktop } from '../../services/tauri';
import { useSettings } from '../../store/settings';
import { playInteractionSound } from './sound';

interface Point {
  x: number;
  y: number;
}

export function PetWindow() {
  const [reacting, setReacting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pointerStart = useRef<Point | null>(null);
  const dragged = useRef(false);
  const clickTimer = useRef<number | null>(null);
  const { volume, muted, animationEnabled, setAnimationEnabled } = useSettings();

  const react = () => {
    playInteractionSound(volume, muted);
    setReacting(false);
    requestAnimationFrame(() => setReacting(true));
    window.setTimeout(() => setReacting(false), 700);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    pointerStart.current = { x: event.screenX, y: event.screenY };
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = async (event: React.PointerEvent) => {
    if (!pointerStart.current || dragged.current) return;
    const distance =
      Math.abs(event.screenX - pointerStart.current.x) +
      Math.abs(event.screenY - pointerStart.current.y);
    if (distance > 6) {
      dragged.current = true;
      await desktop.startDragging();
    }
  };

  const onPointerUp = () => {
    pointerStart.current = null;
  };

  const onClick = (event: React.MouseEvent) => {
    if (dragged.current || event.detail > 1) return;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(react, 220);
  };

  const onDoubleClick = async () => {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    await desktop.openPanel('profile');
  };

  return (
    <main className="pet-shell" onPointerDown={() => setMenuOpen(false)}>
      <button
        aria-label="桌面熊猫花花，单击互动，双击查看资料"
        className={`pet-hit-area ${reacting ? 'is-reacting' : ''} ${animationEnabled ? 'is-breathing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={(event) => void onPointerMove(event)}
        onPointerUp={onPointerUp}
        onClick={onClick}
        onDoubleClick={() => void onDoubleClick()}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenuOpen(true);
        }}
      >
        <img src={pandaImage} alt="" draggable={false} />
        <span className="pet-shadow" />
      </button>

      {reacting && (
        <div className="heart" aria-hidden="true">
          ♥
        </div>
      )}

      {menuOpen && (
        <nav
          className="pet-menu"
          aria-label="桌宠菜单"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button onClick={() => void desktop.openPanel('profile')}>查看资料</button>
          <button onClick={() => void desktop.openPanel('settings')}>设置</button>
          <button onClick={() => setAnimationEnabled(!animationEnabled)}>
            {animationEnabled ? '暂停动画' : '继续动画'}
          </button>
          <button onClick={() => void desktop.hidePet()}>隐藏桌宠</button>
          <button className="danger" onClick={() => void desktop.quit()}>
            退出 Panda Island
          </button>
        </nav>
      )}
    </main>
  );
}

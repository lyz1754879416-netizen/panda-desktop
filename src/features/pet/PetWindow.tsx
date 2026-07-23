import { useEffect, useRef, useState } from 'react';
import idleImage from '../../assets/pandas/panda_huahua_mvp/idle.webp';
import walkImage from '../../assets/pandas/panda_huahua_mvp/walk.webp';
import { desktop } from '../../services/tauri';
import { useSettings } from '../../store/settings';
import { playInteractionSound } from './sound';

interface Point {
  x: number;
  y: number;
}

type PandaAction = 'idle' | 'walk';
type Reaction = 'jump' | 'squash' | 'shake';

const reactions: Reaction[] = ['jump', 'squash', 'shake'];
const messages = [
  '今天也要开心呀！',
  '别戳啦，会痒～',
  '给我一根竹子嘛！',
  '摸摸头，烦恼走开～',
  '我刚才跳得高吗？',
  '花花正在努力可爱！',
];
const sizes = [
  { label: '小', value: 220 },
  { label: '中', value: 280 },
  { label: '大', value: 340 },
];

const clampSize = (value: number) => Math.max(200, Math.min(380, value));

export function PetWindow() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<PandaAction>('idle');
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [dialogue, setDialogue] = useState('');
  const [petSize, setPetSize] = useState(280);
  const pointerStart = useRef<Point | null>(null);
  const dragged = useRef(false);
  const reactionIndex = useRef(0);
  const reactionTimer = useRef<number | null>(null);
  const dialogueTimer = useRef<number | null>(null);
  const clickTimer = useRef<number | null>(null);
  const { volume, muted, alwaysOnTop, animationEnabled, setAlwaysOnTop } = useSettings();

  useEffect(
    () => () => {
      if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
      if (dialogueTimer.current) window.clearTimeout(dialogueTimer.current);
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
    },
    [],
  );

  const resizePet = (nextSize: number) => {
    const size = clampSize(nextSize);
    setPetSize(size);
    void desktop.setPetSize(size);
  };

  const interact = () => {
    playInteractionSound(volume, muted);
    const nextReaction = reactions[reactionIndex.current % reactions.length] ?? 'jump';
    reactionIndex.current += 1;
    setReaction(null);
    requestAnimationFrame(() => setReaction(nextReaction));

    const message = messages[Math.floor(Math.random() * messages.length)] ?? messages[0] ?? '';
    setDialogue(message);

    if (reactionTimer.current) window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setReaction(null), 720);
    if (dialogueTimer.current) window.clearTimeout(dialogueTimer.current);
    dialogueTimer.current = window.setTimeout(() => setDialogue(''), 2200);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button === 2) {
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(true);
      return;
    }
    if (event.button !== 0) return;
    setMenuOpen(false);
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
      setReaction(null);
      setDialogue('');
      setAction('walk');
      try {
        await desktop.startDragging();
      } finally {
        setAction('idle');
        pointerStart.current = null;
      }
    }
  };

  const onPointerUp = () => {
    pointerStart.current = null;
    setAction('idle');
  };

  const onClick = (event: React.MouseEvent) => {
    if (dragged.current || event.detail > 1) return;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(interact, 180);
  };

  const toggleAlwaysOnTop = async () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    await desktop.setAlwaysOnTop(next);
  };

  return (
    <main
      className={`pet-shell ${dialogue ? 'has-dialogue' : ''}`}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setMenuOpen(false);
      }}
      onWheel={(event) => {
        event.preventDefault();
        resizePet(petSize + (event.deltaY < 0 ? 20 : -20));
      }}
    >
      {dialogue && (
        <div className="speech-bubble" role="status">
          {dialogue}
        </div>
      )}

      <button
        aria-label={`桌面熊猫花花，当前动作：${action}`}
        className={`pet-hit-area action-${action} ${reaction ? `reaction-${reaction}` : ''} ${animationEnabled && action === 'idle' && !reaction ? 'is-breathing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={(event) => void onPointerMove(event)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenuOpen(true);
        }}
      >
        <img src={action === 'walk' ? walkImage : idleImage} alt="" draggable={false} />
        <span className="pet-shadow" />
      </button>

      {menuOpen && (
        <nav
          className="pet-menu"
          aria-label="桌宠菜单"
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="menu-title">调整大小</div>
          <div className="size-options">
            {sizes.map((size) => (
              <button
                className={Math.abs(petSize - size.value) < 30 ? 'active' : ''}
                key={size.value}
                onClick={() => resizePet(size.value)}
              >
                {size.label}
              </button>
            ))}
          </div>
          <button onClick={() => void toggleAlwaysOnTop()}>
            <span>{alwaysOnTop ? '✓' : ''}</span>
            始终置顶
          </button>
          <button className="danger" onClick={() => void desktop.quit()}>
            <span />
            退出程序
          </button>
        </nav>
      )}
    </main>
  );
}

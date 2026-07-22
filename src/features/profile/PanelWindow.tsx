import { useState } from 'react';
import pandaImage from '../../assets/pandas/panda_huahua_mvp/idle.png';
import pandaData from '../../data/pandas.json';
import { desktop } from '../../services/tauri';
import { useSettings } from '../../store/settings';
import type { PandaProfile } from '../../types/panda';

const panda = pandaData[0] as PandaProfile;

function initialTab(): 'profile' | 'settings' {
  return new URLSearchParams(window.location.search).get('tab') === 'settings'
    ? 'settings'
    : 'profile';
}

export function PanelWindow() {
  const [tab, setTab] = useState(initialTab);
  const settings = useSettings();

  const changeAlwaysOnTop = async (enabled: boolean) => {
    settings.setAlwaysOnTop(enabled);
    await desktop.setAlwaysOnTop(enabled);
  };

  return (
    <main className="panel-shell">
      <header className="panel-header">
        <div>
          <span className="eyebrow">PANDA ISLAND</span>
          <h1>花花的小岛</h1>
        </div>
        <div className="tabs" role="tablist">
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
            资料
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
            设置
          </button>
        </div>
      </header>

      {tab === 'profile' ? (
        <section className="profile-card">
          <div className="portrait">
            <img src={pandaImage} alt="花花原创卡通测试形象" />
          </div>
          <div className="profile-title">
            <div>
              <h2>{panda.name}</h2>
              <p>{panda.alias}</p>
            </div>
            <button aria-label="收藏花花">♡</button>
          </div>
          <div className="tags">
            {panda.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <dl>
            <div>
              <dt>生日</dt>
              <dd>{panda.birthday}</dd>
            </div>
            <div>
              <dt>性别</dt>
              <dd>{panda.gender}</dd>
            </div>
            <div>
              <dt>出生地</dt>
              <dd>{panda.birthplace}</dd>
            </div>
            <div>
              <dt>所在地</dt>
              <dd>{panda.currentLocation}</dd>
            </div>
            <div>
              <dt>爸爸</dt>
              <dd>{panda.father}</dd>
            </div>
            <div>
              <dt>妈妈</dt>
              <dd>{panda.mother}</dd>
            </div>
          </dl>
          <p className="biography">{panda.biography}</p>
          <button className="primary" disabled>
            观看公开直播（测试版暂未接入）
          </button>
          <p className="disclaimer">{panda.disclaimer}</p>
        </section>
      ) : (
        <section className="settings-card">
          <h2>桌宠设置</h2>
          <label className="setting-row">
            <span>
              音量 <b>{settings.volume}</b>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => settings.setVolume(Number(e.target.value))}
            />
          </label>
          <label className="switch-row">
            <span>
              <b>开启声音</b>
              <small>互动时播放轻柔提示音</small>
            </span>
            <input
              type="checkbox"
              checked={!settings.muted}
              onChange={(e) => settings.setMuted(!e.target.checked)}
            />
          </label>
          <label className="switch-row">
            <span>
              <b>始终置顶</b>
              <small>让花花陪在其他窗口上方</small>
            </span>
            <input
              type="checkbox"
              checked={settings.alwaysOnTop}
              onChange={(e) => void changeAlwaysOnTop(e.target.checked)}
            />
          </label>
          <label className="switch-row">
            <span>
              <b>自动动画</b>
              <small>允许花花自主待机和活动</small>
            </span>
            <input
              type="checkbox"
              checked={settings.animationEnabled}
              onChange={(e) => settings.setAnimationEnabled(e.target.checked)}
            />
          </label>
          <label className="switch-row disabled">
            <span>
              <b>开机自动启动</b>
              <small>将在系统集成模块启用</small>
            </span>
            <input type="checkbox" disabled />
          </label>
          <p className="version">Panda Island Windows 测试版 · v0.1.1</p>
        </section>
      )}
    </main>
  );
}

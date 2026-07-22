# Panda Island 数据结构与状态机设计

## 1. 设计原则

- 熊猫资料、来源、授权信息和直播入口不可混为一个自由文本对象。
- 所有本地 JSON 在进入 UI 前必须经过运行时 schema 校验。
- 状态机只处理行为，不直接加载动画文件或操作窗口。
- 设置具有版本号，可迁移、可恢复默认值。
- MVP 数据是模拟数据，不暗示真实熊猫状态或实时行为。

## 2. 熊猫资料模型

```ts
type ReviewStatus = 'draft' | 'reviewed' | 'rejected';
type Gender = 'female' | 'male' | 'unknown';

interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string; // YYYY-MM-DD
  reviewStatus: ReviewStatus;
  isPublic: boolean;
  commercialUse: 'allowed' | 'restricted' | 'unknown';
  notes?: string;
}

interface ParentRef {
  id: string | null;
  displayName: string | null;
}

interface LivestreamLink {
  provider: string;
  url: string;
  embedAllowed: false;
  sourceId: string;
  lastVerifiedAt: string;
  enabled: boolean;
}

interface PandaProfile {
  schemaVersion: 1;
  id: string;
  name: { zhCN: string; enUS?: string };
  aliases: { zhCN: string[]; enUS?: string[] };
  birthDate: string | null;
  gender: Gender;
  birthplace: { zhCN: string; enUS?: string };
  currentLocation: { zhCN: string; enUS?: string };
  parents: { father: ParentRef; mother: ParentRef };
  personalityTags: { zhCN: string[]; enUS?: string[] };
  biography: { zhCN: string; enUS?: string };
  media: {
    portrait: string;
    animationManifest: string;
    rightsSourceId: string;
  };
  sources: SourceRecord[];
  livestream: LivestreamLink | null;
  publish: {
    reviewStatus: ReviewStatus;
    reviewedAt: string | null;
    reviewedBy: string | null;
    isPublic: boolean;
  };
}
```

### 2.1 校验规则

- `id` 使用稳定小写标识，只允许 `[a-z0-9_-]`。
- 日期采用 ISO `YYYY-MM-DD`；未知日期使用 `null`，不得臆造。
- 正式展示的资料必须为 `publish.reviewStatus === 'reviewed'` 且 `isPublic === true`。
- 所有外链必须是 `https:`。
- 直播 `sourceId` 必须能匹配 `sources` 中已审核来源。
- `embedAllowed` 在 MVP 中必须为 `false`。
- 资源路径必须是应用内相对路径，不允许本地绝对路径和远程脚本。
- `commercialUse: unknown` 的图片不得进入公开商业版本。

### 2.2 MVP 模拟数据示例

```json
{
  "schemaVersion": 1,
  "id": "panda_huahua_mvp",
  "name": { "zhCN": "花花" },
  "aliases": { "zhCN": ["花花测试原型"] },
  "birthDate": "2020-01-01",
  "gender": "female",
  "birthplace": { "zhCN": "测试资料，不对应真实地点" },
  "currentLocation": { "zhCN": "Panda Island 测试岛" },
  "parents": {
    "father": { "id": null, "displayName": null },
    "mother": { "id": null, "displayName": null }
  },
  "personalityTags": { "zhCN": ["温和", "从容", "爱吃竹子"] },
  "biography": {
    "zhCN": "用于 Panda Island MVP 的原创卡通测试角色，参考真实大熊猫花花的公开体态特征进行再设计，并非官方数字形象。"
  },
  "media": {
    "portrait": "assets/photos/panda_huahua_mvp.webp",
    "animationManifest": "assets/pandas/panda_huahua_mvp/manifest.json",
    "rightsSourceId": "source_original_001"
  },
  "sources": [
    {
      "id": "source_original_001",
      "title": "Panda Island MVP 原创模拟资料",
      "publisher": "Panda Island",
      "url": "https://example.com/panda-island/mock",
      "accessedAt": "2026-07-22",
      "reviewStatus": "reviewed",
      "isPublic": false,
      "commercialUse": "allowed",
      "notes": "仅作为本地开发占位数据"
    }
  ],
  "livestream": null,
  "publish": {
    "reviewStatus": "reviewed",
    "reviewedAt": "2026-07-22",
    "reviewedBy": "product-owner",
    "isPublic": false
  }
}
```

## 3. 动画资源模型

```ts
type AnimationState = 'idle' | 'walk' | 'sleep' | 'eat' | 'react' | 'dragged';
type Direction = 'left' | 'right';

interface AnimationClip {
  atlas: string;
  frames: string[];
  fps: 24 | 30;
  loop: boolean;
  anchor: { x: number; y: number };
  durationMs?: number;
}

interface PandaAnimationManifest {
  schemaVersion: 1;
  pandaId: string;
  canvas: { width: number; height: number };
  defaultDirection: Direction;
  clips: Record<AnimationState, Partial<Record<Direction, AnimationClip>>>;
}
```

资源约束：

- 标准画布 1024 × 1024，美术导出后按设备缩放渲染；
- 脚底锚点固定，所有动作切换时角色不跳位；
- 循环动作首尾衔接；
- `walk` 至少提供左向，右向可在无文字/非对称配饰时镜像；
- `react` 和 `dragged` 不循环；
- 单只熊猫解码后纹理内存需设预算，首版建议不超过 64 MB。

## 4. 用户设置模型

```ts
interface WindowPlacement {
  monitorId: string | null;
  x: number;
  y: number;
  scaleFactor: number;
}

interface UserSettingsV1 {
  schemaVersion: 1;
  selectedPandaId: string;
  locale: 'zh-CN' | 'en-US';
  volume: number; // 0..100
  muted: boolean;
  alwaysOnTop: boolean;
  animationEnabled: boolean;
  launchAtStartup: boolean;
  petVisible: boolean;
  placement: WindowPlacement | null;
  favorites: string[];
  onboardingCompleted: boolean;
}
```

默认值：简体中文、音量 35、非静音、置顶开启、动画开启、开机启动关闭、桌宠可见；`selectedPandaId` 固定为 `panda_huahua_mvp`。

## 5. 行为状态机

### 5.1 状态

| 状态      | 进入方式                 | 离开方式                          |
| --------- | ------------------------ | --------------------------------- |
| `idle`    | 启动、动作完成、释放拖动 | 8–20 秒后随机，或用户点击/拖动    |
| `walk`    | `idle` 随机选择          | 动画/路径结束回到 `idle`          |
| `sleep`   | `idle` 随机选择          | 20–60 秒后回到 `idle`，或用户点击 |
| `eat`     | `idle` 随机选择          | 8–15 秒后回到 `idle`，或用户点击  |
| `react`   | 用户单击                 | 动画结束回到 `idle`               |
| `dragged` | 拖动阈值被超过           | 鼠标释放回到 `idle`               |

### 5.2 事件

```ts
type BehaviorEvent =
  | { type: 'TIMER_ELAPSED' }
  | { type: 'CLICKED' }
  | { type: 'DRAG_STARTED' }
  | { type: 'DRAG_ENDED' }
  | { type: 'ANIMATION_ENDED' }
  | { type: 'PAUSED' }
  | { type: 'RESUMED' }
  | { type: 'APP_HIDDEN' }
  | { type: 'APP_SHOWN' };
```

### 5.3 转移优先级

1. `DRAG_STARTED` 最高优先级，任何状态可进入 `dragged`。
2. `CLICKED` 可打断 `idle`、`walk`、`sleep`、`eat`，进入 `react`。
3. `PAUSED` 取消调度器；视觉回到 `idle`，但不改变持久化选择。
4. 自动 `TIMER_ELAPSED` 只在未暂停且当前状态允许时生效。
5. 过期定时器带有 generation token，状态变化后旧 token 事件被忽略。

### 5.4 可注入依赖

```ts
interface Clock {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

interface RandomSource {
  next(): number; // [0, 1)
}
```

生产环境使用系统时钟和安全无要求的伪随机数；测试使用 fake clock 和固定序列随机源。

### 5.5 随机策略

- `idle` 后候选权重初始设为：`walk 45%`、`sleep 25%`、`eat 30%`。
- 禁止连续三次进入同一自动状态；超过时重新选择或回到 `idle`。
- 时长通过 `min + floor(random × (max - min + 1))` 计算。
- 权重是配置，不硬编码在播放器中。

## 6. 应用生命周期模型

```ts
type AppLifecycle = 'starting' | 'ready' | 'hidden' | 'shutting-down' | 'failed';
```

- 关闭资料卡不改变应用生命周期。
- 隐藏桌宠后托盘仍存在，状态调度器暂停以降低资源占用。
- 只有托盘或右键菜单“退出”进入 `shutting-down`。
- 退出顺序：停止调度器 → 保存设置 → 销毁辅助窗口 → 销毁托盘 → 结束进程。

## 7. 错误模型

| 错误             | 用户表现                   | 恢复策略                   |
| ---------------- | -------------------------- | -------------------------- |
| 熊猫数据校验失败 | 显示安全占位熊猫和简短错误 | 记录本地诊断，跳过错误记录 |
| 动画资源缺失     | 使用静态占位图             | 不让应用崩溃               |
| 设置解析失败     | 恢复默认设置               | 备份损坏文件供诊断         |
| 窗口位置不可见   | 熊猫回到主屏幕右下         | 保存校正后位置             |
| 开机启动设置失败 | 设置项回滚并提示           | 保持实际系统状态为准       |
| 外链不在白名单   | 阻止打开                   | 提示链接不可用             |

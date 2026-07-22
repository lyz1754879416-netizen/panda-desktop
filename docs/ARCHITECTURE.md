# Panda Island 系统架构方案

## 1. 架构目标

本方案服务于 Windows 10/11 x64 MVP，优先保证透明桌宠窗口、动画稳定性、状态机可测试性和系统权限最小化。架构不为尚未进入范围的后端、AI、社交和多平台提前增加复杂度。

## 2. 技术决策

| 层级     | 选择                                                        | 决策理由                                                                       |
| -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 桌面容器 | Tauri 2                                                     | 支持透明/无边框窗口、Rust 系统能力、托盘和 Windows 打包，运行体积低于 Electron |
| 前端     | React + TypeScript + Vite                                   | 组件化资料卡和设置页，严格类型，构建成熟                                       |
| 动画渲染 | PixiJS                                                      | 更适合透明 2D 图集、锚点和帧控制；比直接依赖动画 WebP 更易测试和切换动作       |
| 前端状态 | Zustand + 纯 TypeScript 状态机                              | UI 状态简洁；行为状态机保持框架无关、可注入时间和随机源                        |
| 数据校验 | Zod                                                         | 在运行时校验本地 JSON，避免错误资料进入 UI                                     |
| 本地设置 | Tauri Store 插件                                            | 版本化键值持久化，避免前端直接获得广泛文件系统权限                             |
| 外链     | Tauri Opener 插件 + URL 白名单                              | 只开放经审核的 HTTPS 域名，不授予任意命令权限                                  |
| 开机启动 | Tauri Autostart 插件                                        | 使用官方插件封装 Windows 登录启动项                                            |
| 测试     | Vitest、React Testing Library、Rust tests、Windows 手工/E2E | 分离纯逻辑、UI 与原生窗口验证                                                  |
| 安装包   | NSIS x64                                                    | 首轮测试分发方便；MSI 和 Microsoft Store 延后                                  |

### 2.1 动画方案评估

| 方案                | 优点                             | 问题                                   | 结论               |
| ------------------- | -------------------------------- | -------------------------------------- | ------------------ |
| 动画 WebP 直接播放  | 接入最快、文件少                 | 精确帧控制、事件点、测试和动作切换较弱 | 仅可用于早期占位   |
| PNG/WebP 序列 + DOM | 实现简单                         | 多帧 DOM 更新开销较高                  | 不采用为正式播放器 |
| PixiJS 图集         | 帧控制、锚点、缓存和方向翻转成熟 | 增加渲染层依赖                         | **MVP 采用**       |
| Spine 2D            | 骨骼动画表现强、资源小           | 美术流程和运行时授权成本更高           | 后续评估           |

MVP 资源格式定为：每个动作一份图集描述文件和一张透明 PNG/WebP atlas。所有动作统一画布、脚底锚点和角色比例。播放器只负责把行为状态映射到资源，不参与状态决策。

## 3. 运行时架构

### 3.1 窗口

| 窗口标签 | 用途         | 尺寸           | 关键属性                                 |
| -------- | ------------ | -------------- | ---------------------------------------- |
| `pet`    | 桌面熊猫     | 360 × 360      | 透明、无边框、不可缩放、置顶、跳过任务栏 |
| `panel`  | 资料卡与设置 | 520 × 680 默认 | 普通有边框窗口、可关闭、单实例复用       |

`panel` 使用前端路由区分 `/profile/:pandaId` 和 `/settings`。重复点击资料或设置时只显示并聚焦现有窗口，不创建多个实例。

### 3.2 进程职责

**Rust/Tauri 层负责：**

- 创建与管理 `pet`、`panel` 窗口；
- 原生托盘和上下文菜单；
- 退出生命周期；
- 开机启动；
- 读取/写入受控设置；
- 安全打开白名单 URL；
- 获取显示器工作区和校正窗口位置；
- 暴露最小、强类型 command。

**React/TypeScript 层负责：**

- PixiJS 动画播放器；
- 行为状态机；
- 点击、双击、拖动的手势仲裁；
- 资料卡和设置界面；
- 本地熊猫数据解析、校验和展示；
- 简体中文文案；国际化结构延后但不写死在原生层；
- 前端状态与错误提示。

### 3.3 数据流

1. 启动时 Rust 创建托盘和 `pet` 窗口。
2. 前端加载 `pandas.json`，Zod 校验后选择默认熊猫。
3. Tauri Store 加载设置；无设置时使用默认值。
4. 设置被转换成只读运行配置并提供给动画和窗口适配层。
5. 行为状态机输出 `BehaviorState`。
6. 动画映射器根据熊猫 ID、状态和方向选择资源。
7. 位置/设置变化通过去抖写入 Store。
8. 外链点击先在前端展示来源，再由 Rust/插件执行白名单校验和打开。

## 4. 模块边界

```text
panda-desktop/
├─ docs/
├─ public/
├─ src/
│  ├─ app/                 # React 入口、路由、错误边界
│  ├─ components/          # 无业务通用组件
│  ├─ features/
│  │  ├─ pet/              # 桌宠舞台、手势、动画适配
│  │  ├─ behavior/         # 纯状态机、时钟、随机源
│  │  ├─ profile/          # 资料卡
│  │  ├─ settings/         # 设置界面
│  │  └─ tray/             # 前端事件桥接
│  ├─ data/                # pandas.json 和 schema 版本
│  ├─ i18n/                # zh-CN、en-US
│  ├─ services/            # Tauri API 适配器、存储、外链
│  ├─ store/               # Zustand UI/runtime stores
│  ├─ types/               # 共享 TS 类型
│  ├─ assets/
│  │  ├─ pandas/           # 动画图集
│  │  ├─ photos/
│  │  ├─ audio/
│  │  └─ icons/
│  └─ test/                # 测试工具、固定随机源、fixtures
├─ src-tauri/
│  ├─ capabilities/        # 按窗口拆分最小权限
│  ├─ icons/
│  ├─ src/
│  │  ├─ commands/         # 窗口、设置、外链命令
│  │  ├─ menu.rs
│  │  ├─ tray.rs
│  │  ├─ window.rs
│  │  ├─ lib.rs
│  │  └─ main.rs
│  ├─ Cargo.toml
│  └─ tauri.conf.json
├─ tests/
│  ├─ e2e/
│  └─ manual/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## 5. 状态与并发原则

- 行为状态机是单一动作真相源，播放器不能自行切换行为。
- `dragged` 和 `react` 是用户事件触发的高优先级状态。
- 任何定时器都必须可取消；组件卸载和应用暂停时清理。
- 只允许一个状态调度器实例，防止 React 重渲染创建重复计时器。
- 时间使用 `Clock` 接口，随机使用 `RandomSource` 接口，测试不依赖真实时间。
- 窗口位置保存采用 300–500 ms 去抖，拖动过程中不持续写磁盘。

## 6. Windows 窗口与交互策略

### 6.1 透明、无边框与置顶

Tauri 2 支持通过配置、JavaScript API 或 Rust 配置窗口；MVP 在 Rust/Tauri 配置中创建窗口，避免把高权限窗口控制完全暴露给前端。官方窗口 API提供 `setAlwaysOnTop`、`startDragging` 和 `setIgnoreCursorEvents` 等能力。

### 6.2 点击与拖动仲裁

- 单击：按下到释放位移小于阈值，并在双击等待窗口结束后触发 `react`。
- 双击：取消待处理单击并打开资料卡。
- 拖动：位移超过阈值后进入 `dragged`，调用 Tauri 窗口拖动；释放回到 `idle`。
- 右键：不触发单击或拖动，打开原生菜单。

### 6.3 点击穿透风险

Tauri 的 `setIgnoreCursorEvents(true)` 是窗口级能力，开启后熊猫本身也无法直接接收点击。Windows 对透明 WebView 的命中行为还会受 WebView2、窗口样式和显卡驱动影响。

MVP 按以下顺序验证：

1. 保持窗口可交互，缩小实际窗口边界和角色空白边距。
2. 使用透明 hit mask 判断角色内点击，但接受窗口矩形仍会拦截底层应用。
3. 仅在实机验证可靠时尝试原生区域命中或动态穿透。
4. 若动态穿透造成点击丢失、闪烁或拖动失败，回退到方案 1。

因此“透明区域按像素完全穿透”属于 P1 技术增强，不是 P0 发布条件。

### 6.4 多显示器与缩放

- 存储逻辑坐标，同时记录显示器标识和缩放信息。
- 启动时检查位置是否仍在任一显示器工作区内。
- 显示器断开、分辨率变化或 DPI 改变后，将窗口校正到可见区域。
- 验证 100%、125%、150%、175%、200% 缩放和横向/纵向副屏。

## 7. 安全设计

- 为 `pet` 与 `panel` 分别定义 Tauri capabilities。
- `pet` 只获得拖动、位置和必要事件权限。
- `panel` 获得受限 Store、Autostart 和 Opener 权限。
- Opener 只允许配置中的 HTTPS 域名，不允许 `file:`、`cmd:`、自定义 shell 或任意路径。
- 不启用通用 shell 插件，不允许前端执行命令。
- Content Security Policy 默认只允许本地资源；首版不加载远程图片或脚本。
- 熊猫 JSON 和资源随应用打包，只读加载并进行 schema 校验。
- 日志不包含用户路径、设备标识和隐私数据。

Tauri 2 默认阻止插件命令，必须在 capability 中显式授权；本项目按窗口和功能最小授权。外链使用官方 Opener，并通过 URL scope 进一步约束。

## 8. 本地持久化

- 使用 Tauri Store 保存 `settings.v1.json`。
- 写入结构包含 `schemaVersion`，升级时执行纯函数迁移。
- 位置、音量、当前熊猫、语言、置顶、动画暂停和开机启动均本地保存；MVP 当前熊猫固定为“花花”。
- 当前动作和计时器不持久化；每次启动从 `idle` 开始。
- 收藏可本地保存为熊猫 ID 集合，不需要账户。
- 写入采用临时文件/插件安全写入能力；解析失败时备份错误配置并恢复默认值。

## 9. Windows 构建与发布

### 9.1 开发环境

Windows 开发机需要：

- Microsoft C++ Build Tools，并安装“Desktop development with C++”；
- Microsoft Edge WebView2 Runtime；
- Rust stable MSVC toolchain；
- Node.js LTS；
- npm（首版不混用多个包管理器）。

### 9.2 产物

- 开发/内测：x64 NSIS 安装包。
- 可选：保留 MSI 构建配置，但不作为 MVP 必交付物。
- Microsoft Store 和自动更新在 MVP 后另设发布阶段。

### 9.3 签名

未签名下载包会触发 Windows SmartScreen 警告。内部测试可接受；公开发布必须采购或配置代码签名，并保护证书密钥。Microsoft Store 发布同样需要签名和满足离线安装要求。

## 10. 关键 Windows 风险

| 风险                   | 影响                 | 验证/缓解                                    |
| ---------------------- | -------------------- | -------------------------------------------- |
| 透明窗口空白区拦截鼠标 | 干扰底层应用         | Stage 1 建立点击穿透 Spike，提供稳定回退方案 |
| WebView2 版本差异      | 透明和渲染行为不同   | Windows 10/11 多版本实测，安装器检测运行时   |
| 高 DPI 与多屏          | 窗口偏移或移出屏幕   | 逻辑坐标、工作区校正、多 DPI 矩阵测试        |
| 置顶层级与全屏应用冲突 | 熊猫遮挡游戏/演示    | 设置中允许关闭置顶；检测/提供暂停隐藏        |
| GPU/远程桌面渲染差异   | 黑底、闪烁或掉帧     | 集显/独显/远程桌面测试，保留静态降级模式     |
| 开机启动权限/杀软      | 启动失败或误报       | 使用官方插件、无提权、签名、清晰开关         |
| 未签名安装包           | SmartScreen 警告     | 内测说明；公开版代码签名                     |
| 动画资源过大           | 启动慢、内存高       | 图集压缩、按熊猫懒加载、资源预算             |
| 窗口关闭语义混乱       | 用户以为退出但仍驻留 | 资料卡关闭只关卡片；托盘菜单明确“退出”       |

## 11. 架构决策记录

### ADR-001：Windows-only MVP

接受。先解决 Windows 透明窗口、交互和打包，macOS 不进入首版验收。

### ADR-002：PixiJS 而非 Spine

接受。MVP 动作少，优先降低授权和美术工具链成本。

### ADR-003：本地数据而非 Supabase

接受。首版无账号和云同步，后端只会扩大测试和运营面。

### ADR-004：外链而非直播嵌入

接受。降低版权、平台协议、安全和播放器兼容风险。

### ADR-005：点击穿透为 P1

接受。保证点击、拖动和稳定运行优先于透明空白区完美穿透。

### ADR-006：首版角色与声音

接受。首版只提供一只暂名“花花”的原创卡通数字分身，参考真实大熊猫花花的公开体态特征但不复制照片或官方形象；简体中文，声音默认开启且音量为 35。

### ADR-007：测试发行方式

接受。首轮只输出 Windows x64 NSIS 测试安装包，不进入 Microsoft Store；内测阶段允许未签名并明确提示 SmartScreen 风险。

## 12. 官方依据

- [Tauri 2 Windows 前置依赖](https://v2.tauri.app/start/prerequisites/)
- [Tauri 窗口定制](https://v2.tauri.app/learn/window-customization/)
- [Tauri Window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
- [Tauri Capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri System Tray](https://v2.tauri.app/learn/system-tray/)
- [Tauri Store 插件](https://v2.tauri.app/plugin/store/)
- [Tauri Autostart 插件](https://v2.tauri.app/plugin/autostart/)
- [Tauri Opener 插件](https://v2.tauri.app/plugin/opener/)
- [Tauri Windows 安装包](https://v2.tauri.app/distribute/windows-installer/)
- [Tauri Windows 代码签名](https://v2.tauri.app/distribute/sign/windows/)

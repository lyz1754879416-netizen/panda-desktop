# Panda Island

Panda Island 是一款面向 Windows 10/11 的轻量桌面熊猫应用。熊猫以透明、无边框、始终置顶的 2D 窗口生活在桌面上，用户可以拖动、点击互动、查看资料，并从经过审核的入口访问公开直播页面。

## 当前阶段

当前已进入 **Stage 1 工程骨架与 Windows 窗口验证阶段**，包含 React/Tauri 工程、原创“花花”静态角色、透明桌宠界面、资料卡、设置界面、交互声音和基础测试。正式行为状态机与序列帧动画尚未开发。

## 设计文档

- [产品需求文档](docs/PRD.md)
- [系统架构方案](docs/ARCHITECTURE.md)
- [数据结构与状态机](docs/DATA_MODEL.md)
- [MVP 开发路线图](docs/ROADMAP.md)
- [测试与验收计划](docs/TEST_PLAN.md)

## 已确认边界

- 第一版仅支持 Windows 10/11 x64。
- 首版只提供 1 只熊猫，暂名“花花”；角色参考真实大熊猫花花的公开体态特征，但采用原创卡通数字分身设计，不复制照片或官方形象。
- 技术栈：Tauri 2、React、TypeScript、Vite、Rust。
- 熊猫动画：PixiJS 播放透明 2D 序列帧图集。
- 熊猫资料全部使用本地模拟数据。
- 不抓取网站、不嵌入未经授权的视频、不接入 AI。
- 首版只提供简体中文，声音默认开启并可调节。
- 交付 Windows x64 NSIS 测试安装包。
- Windows ARM64、macOS、后端、登录和云同步不属于首版范围。

## Windows 开发环境

安装 Node.js LTS、Rust stable MSVC、Microsoft C++ Build Tools（Desktop development with C++）和 WebView2 Runtime，然后运行：

```powershell
npm install
npm run tauri:dev
```

检查与测试：

```powershell
npm run typecheck
npm run test:run
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

生成简体中文 NSIS 测试安装包：

```powershell
npm run tauri:build
```

安装包生成在 `src-tauri/target/release/bundle/nsis/`。

也可以在 Windows PowerShell 中执行完整质量检查与打包脚本：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\build-windows-installer.ps1
```

当前阶段的真实检查结果见 [Stage 1 验收报告](docs/STAGE1_REPORT.md)。

## GitHub Windows 自动构建

推送到 GitHub `main` 分支后，`.github/workflows/windows-build.yml` 会在 Windows runner 上执行全部检查、构建简体中文 NSIS 安装包，并上传 `Panda-Island-Windows-x64-NSIS` 构建产物。工作流也支持在 GitHub Actions 页面手动运行。

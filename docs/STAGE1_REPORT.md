# Stage 1 工程骨架验收报告

## 1. 版本

- 项目：Panda Island Windows
- 版本：0.1.0
- 阶段：Stage 1 工程骨架与窗口验证
- 日期：2026-07-22

## 2. 已完成

- Tauri 2 + React + TypeScript + Vite + Rust 目录骨架；
- 360 × 360 透明、无边框、不可缩放、置顶桌宠窗口配置；
- 独立资料/设置窗口；
- 原创“花花”静态角色资产及透明通道；
- 单击互动、双击资料、拖动阈值和右键菜单；
- 简体中文资料卡与设置页；
- 默认声音开启、音量 35 的 Web Audio 互动音；
- 托盘显示、资料、设置、隐藏和退出逻辑；
- 简体中文 NSIS x64 安装包配置；
- 最小 Tauri capabilities；
- Windows 一键构建脚本。

## 3. 实际自动检查结果

| 检查                        | 结果                                                    |
| --------------------------- | ------------------------------------------------------- |
| Prettier                    | 通过                                                    |
| TypeScript strict typecheck | 通过                                                    |
| Vitest                      | 2 个测试文件、3 项测试全部通过                          |
| Vite production build       | 通过                                                    |
| ESLint                      | 通过                                                    |
| Tauri 配置读取              | 通过，CLI 正确识别 React、Vite、CSP 和插件              |
| Rust 编译                   | 未执行：当前运行环境未安装 rustc/cargo                  |
| Windows NSIS 打包           | 未执行：当前运行环境为 Ubuntu，且无 Windows MSVC 工具链 |

## 4. 当前阻断项

Tauri 官方 Windows 桌面目标使用 MSVC 工具链。当前工作环境是 Ubuntu 且没有 Rust，因此不能在本机生成可信的 Windows NSIS 安装包。执行 `npm run tauri:build` 已实际验证，失败点为找不到 `cargo metadata`，不是前端构建失败。

## 5. Windows 构建方法

在安装好 Node.js LTS、Rust stable-msvc、Microsoft C++ Build Tools 和 WebView2 的 Windows 10/11 x64 机器中打开 PowerShell：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\build-windows-installer.ps1
```

脚本会先执行格式、Lint、类型、前端测试、Rust fmt/clippy/test，再生成 NSIS 安装包和 SHA-256。

项目同时包含 `.github/workflows/windows-build.yml`。推送到 GitHub `main` 分支后会在 `windows-latest` 上自动执行相同质量门禁，生成名为 `Panda-Island-Windows-x64-NSIS` 的 Actions Artifact；也可以从 Actions 页面手动触发。

## 6. 尚未完成

- Windows 实机透明、置顶、拖动、托盘和退出验证；
- 原生右键菜单（当前为窗口内自定义菜单）；
- Tauri Store 持久化和开机启动交互；
- 正式行为状态机；
- walk、sleep、eat、react、dragged 动画图集；
- 点击穿透技术 Spike；
- 代码签名。

这些内容应按路线图继续分模块完成，不应把当前骨架误标记为完整 MVP。

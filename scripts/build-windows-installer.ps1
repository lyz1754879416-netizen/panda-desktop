$ErrorActionPreference = "Stop"

Write-Host "Panda Island Windows installer build" -ForegroundColor Green

foreach ($command in @("node", "npm", "rustc", "cargo")) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $command. See README.md for Windows prerequisites."
  }
}

$rustHost = rustc -vV | Select-String "host:"
if ($rustHost -notmatch "windows-msvc") {
  throw "Rust must use the stable MSVC toolchain. Run: rustup default stable-msvc"
}

npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri:build

$bundleDirectory = Join-Path $PSScriptRoot "..\src-tauri\target\release\bundle\nsis"
$installer = Get-ChildItem $bundleDirectory -Filter "*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $installer) {
  throw "Build finished without an NSIS executable in $bundleDirectory"
}

$hash = Get-FileHash $installer.FullName -Algorithm SHA256
Write-Host "Installer: $($installer.FullName)" -ForegroundColor Green
Write-Host "SHA-256:  $($hash.Hash)" -ForegroundColor Green


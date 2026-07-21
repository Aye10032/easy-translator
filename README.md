# Easy Translator

基于 Tauri 2、React 和 TypeScript 的桌面翻译工具。

## 开发

```bash
pnpm install
pnpm tauri dev
```

## 构建 Windows 安装包

项目支持直接在 WSL 中交叉编译 Windows x64 的 NSIS 安装程序，不依赖
Windows 侧的 Node、Rust 或 Visual Studio。WSL 中需安装：

- Node.js、pnpm 与 Rust
- Windows MSVC Rust target
- `cargo-xwin`
- NSIS、LLVM/LLD 与 Clang

Ubuntu/WSL 首次配置：

```bash
sudo apt update
sudo apt install nsis llvm lld clang
rustup target add x86_64-pc-windows-msvc
cargo install --locked cargo-xwin
```

构建：

```bash
pnpm bundle:windows
```

构建产物位于 `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`。

WSL 交叉编译支持 NSIS `-setup.exe`，不支持 WiX `.msi`。安装包默认采用
`downloadBootstrapper` 模式，目标电脑缺少 WebView2 时会联网下载安装。

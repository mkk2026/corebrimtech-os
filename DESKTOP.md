# CoreBrimTech OS — Desktop (Tauri)

The same app, wrapped as a native Windows/macOS/Linux desktop application so your AI co-founder can
run in a tray and (later) reach you with native notifications even when the window is closed.

## How it works

The web build is unchanged. For desktop, Next.js produces a **static export** (`out/`) which Tauri
loads in a native webview. Because a static export has no API routes, the app uses a **native AI
bridge** instead of the `/api/ai` proxy (see `src/lib/ai-transport.ts`):

```
 npm run tauri:dev / tauri:build
        │
        ▼
 beforeBuildCommand → BUILD_TARGET=desktop next build  →  out/ (static export, no /api/*)
        │
        ▼
 Tauri (src-tauri/) loads out/ in a native window
        │
        ▼
 AI calls → window.__TAURI__ detected → native bridge (B2)  → provider API with YOUR stored key
            (web build keeps using /api/ai)
```

`next.config.ts` only sets `output: 'export'` when `BUILD_TARGET=desktop`, so the **web deployment
keeps its API routes**.

## Prerequisites (one-time, per machine)

1. **Rust** — https://rustup.rs (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
2. **OS webview/build deps:**
   - **Linux:** `libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev build-essential libssl-dev` (apt names)
   - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
   - **Windows:** WebView2 (preinstalled on Win 11) + MSVC Build Tools
3. **App icons** (once): `npm run tauri icon path/to/logo.png` — see `src-tauri/icons/README.md`.

## Run it

```bash
npm install
npm run tauri:dev      # launches the app in a native window with hot reload
npm run tauri:build    # produces installers in src-tauri/target/release/bundle/
```

## Status

- **B1 (this):** scaffold — native window loads the exported app.
- **B2 (next):** native AI bridge — real BYO-key provider calls, no proxy. This also fixes the
  current web quirk where the proxy uses a server env key instead of the founder's stored key.
- **B4 (done):** tray icon (Show / Quit), native notifications, global hotkey
  **`Cmd/Ctrl+Shift+K`** to summon the window, and **close-to-tray** (the window hides instead of
  quitting so the co-founder keeps running — quit from the tray menu).
- **B5:** background signal scan → native notifications (relies on close-to-tray keeping the
  webview alive).
- **B6:** cross-platform CI build + installers.

> Note: the desktop build is verified on your machine — this environment lacks the OS webview libs,
> so the scaffold's native compile has not been run here.

## Releasing (cross-platform installers)

CI (`.github/workflows/desktop-release.yml`) builds Windows/macOS/Linux installers and attaches
them to a **draft** GitHub Release.

```bash
# one-time: generate + commit app icons (tauri build requires them)
npm run tauri icon path/to/logo.png
git add src-tauri/icons && git commit -m "chore: app icons"

# cut a release
git tag v0.1.0 && git push origin v0.1.0   # → triggers the matrix build
```

You can also run it manually from the Actions tab (workflow_dispatch). Code-signing / notarization
(for trusted installs) is a follow-up — see TODOS.md.

## Troubleshooting

### `tauri dev` → `unrecognized subcommand '/usr/bin/nsolid'` + Segmentation fault

Your `node` is **N|Solid** (NodeSource), and the `@tauri-apps/cli` npm wrapper's native binary
mis-parses argv under N|Solid. Use the **Rust-native CLI** instead — it has no node dependency:

```bash
cargo install tauri-cli --version "^2.0" --locked   # one-time (~15 min compile)
cargo tauri dev       # instead of: npm run tauri:dev
cargo tauri build     # instead of: npm run tauri:build
cargo tauri icon ./public/your-logo.png
```

(Alternatively, switch to stock Node.js via `nvm install 22 && nvm use 22`, after which the
`npm run tauri:*` scripts work too.)

### Linux system dependencies (Debian / Kali / Ubuntu)

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libappindicator3-dev \
  librsvg2-dev patchelf build-essential libssl-dev
```

### `tauri icon` parse error

Pass a **real** path to a square PNG — not the literal placeholder. The `<...>` in docs means
"substitute your file", e.g. `cargo tauri icon ./public/logo.png`.

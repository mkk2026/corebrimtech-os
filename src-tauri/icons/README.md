# App icons

Tauri bundles these icons (referenced in `tauri.conf.json` → `bundle.icon`). They are **not**
committed because they're generated binaries. Generate them once from a single square source PNG
(≥ 1024×1024 recommended):

```bash
# from the repo root, after installing the Tauri CLI
npm run tauri icon path/to/logo.png
```

This produces `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns` (macOS), `icon.ico`
(Windows), and the Android/iOS sets, writing them here.

Until you run it, `npm run tauri:dev` works (it falls back to a default window icon), but
`npm run tauri:build` requires these files.

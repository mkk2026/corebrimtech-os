# App icons

These are the committed app icons (referenced in `tauri.conf.json` → `bundle.icon`, and required by
`generate_context!()` at build time). They were generated from `source-logo.png` (the amber "CBT"
mark) with:

```bash
cargo tauri icon src-tauri/icons/source-logo.png
```

To rebrand, replace `source-logo.png` with a ≥ 1024×1024 square PNG and re-run that command, then
commit the regenerated files.

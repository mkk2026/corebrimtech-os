// Static-export the app for the Tauri desktop bundle.
//
// The web /api/* route handlers declare `dynamic = "force-dynamic"`, which is incompatible with
// Next's `output: "export"`. The desktop build doesn't need them — the native bridge
// (src/lib/ai-transport.ts + src-tauri) replaces them. So we move the api directory aside for the
// export, then ALWAYS restore it (try/finally + signal handlers), so the web build is untouched.

import { execSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";

const API_DIR = "src/app/api";
// Must live OUTSIDE src/app/ — anything under src/app is scanned as a route, even dot-prefixed.
const API_BAK = ".api-disabled";

function stash() {
  if (existsSync(API_DIR)) renameSync(API_DIR, API_BAK);
}
function restore() {
  if (existsSync(API_BAK)) renameSync(API_BAK, API_DIR);
}

// Restore even if the build is interrupted, so api/ is never left moved.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    restore();
    process.exit(1);
  });
}

stash();
try {
  execSync("next build", {
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "desktop" },
  });
} finally {
  restore();
}

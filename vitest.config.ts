import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Coverage instrumentation slows interaction-heavy RTL flows; give them headroom.
    testTimeout: 15000,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scope coverage to the surfaces this bundle touches (see IMPLEMENTATION_PLAN.md).
      include: [
        "src/lib/auto-research.ts",
        "src/lib/feature-flags.ts",
        "src/lib/seed-scan-store.ts",
        "src/lib/ai-transport.ts",
        "src/lib/desktop-bridge.ts",
        "src/lib/checks.ts",
        "src/lib/desktop-notify.ts",
        "src/lib/desktop-signal-watch.ts",
        "src/lib/cofounder/**/*.ts",
        "src/components/cofounder/**/*.tsx",
        "src/components/onboarding/Onboarding.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});

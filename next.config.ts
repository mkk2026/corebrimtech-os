import type { NextConfig } from "next";

// Desktop (Tauri) builds with BUILD_TARGET=desktop to produce a static export (`out/`), which has
// no API routes — the app uses the native AI bridge instead (see src/lib/ai-transport.ts).
// The web build leaves `output` undefined so /api/* routes keep working in production.
const isDesktop = process.env.BUILD_TARGET === "desktop";

const nextConfig: NextConfig = {
  ...(isDesktop ? { output: "export" as const, images: { unoptimized: true } } : {}),
};

export default nextConfig;

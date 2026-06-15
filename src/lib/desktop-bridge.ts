/**
 * Desktop bridge bootstrap.
 *
 * On the desktop build (Tauri), registers a native AI bridge so AI calls go to the Rust
 * `ai_request` command (which calls the provider directly with the founder's BYO key) instead of
 * the `/api/ai` proxy that doesn't exist in a static export. No-op on web.
 */

import { isDesktop, registerNativeBridge, type AITransportResult } from "./ai-transport";
import { getActiveProvider } from "./llm";

export async function initDesktopBridge(): Promise<void> {
  if (!isDesktop()) return;

  const { invoke } = await import("@tauri-apps/api/core");

  registerNativeBridge(async (payload) => {
    const active = getActiveProvider();
    return invoke<AITransportResult>("ai_request", {
      request: {
        ...payload,
        // The native bridge owns provider/key selection from local storage (true BYO key).
        provider: active?.provider === "google" ? "google" : (payload.provider ?? "claude"),
        apiKey: active?.apiKey ?? "",
      },
    });
  });
}

/**
 * Environment + link checks that work on both web (Next API routes) and desktop (native).
 * On the static-export desktop build there are no API routes, so these route to native equivalents.
 */

import { isDesktop } from "./ai-transport";
import { getStoredAnthropicKey, getStoredGoogleKey, getStoredNvidiaKey } from "./llm";

export interface EnvStatus {
  anthropicConfigured: boolean;
  googleConfigured: boolean;
  nvidiaConfigured: boolean;
  proxySecretConfigured: boolean;
}

export async function checkEnv(): Promise<EnvStatus> {
  if (isDesktop()) {
    // Desktop has no server env — "configured" means the founder stored a BYO key locally.
    return {
      anthropicConfigured: !!getStoredAnthropicKey(),
      googleConfigured: !!getStoredGoogleKey(),
      nvidiaConfigured: !!getStoredNvidiaKey(),
      proxySecretConfigured: false,
    };
  }
  const res = await fetch("/api/check-env");
  return (await res.json()) as EnvStatus;
}

const LINK_CHECK_TIMEOUT_MS = 8_000;

export async function checkLinkReachable(url: string): Promise<boolean> {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return false;

  if (isDesktop()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<boolean>("check_link", { url });
    } catch {
      return false;
    }
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(`/api/check-link?url=${encodeURIComponent(url)}`, { signal: controller.signal });
    clearTimeout(id);
    const data = (await res.json()) as { active?: boolean };
    return data.active === true;
  } catch {
    clearTimeout(id);
    return false;
  }
}

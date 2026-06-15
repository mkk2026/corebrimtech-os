/**
 * AI transport seam.
 *
 * Decouples the AI layer from the Next `/api/ai` proxy so the desktop build (static export, no API
 * routes) can drop in a native bridge that calls the provider directly with the founder's own key.
 *
 *   web      → POST /api/ai  (unchanged behavior; keys live in server env)
 *   desktop  → registered native bridge (Tauri HTTP), keys are the founder's stored BYO key
 */

export interface AITransportResult {
  ok: boolean;
  status: number;
  data: unknown;
}

export type NativeBridge = (payload: Record<string, unknown>) => Promise<AITransportResult>;

let nativeBridge: NativeBridge | null = null;

/** Desktop (Tauri) registers a native AI bridge at startup; web leaves this unset. */
export function registerNativeBridge(bridge: NativeBridge | null): void {
  nativeBridge = bridge;
}

export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

export async function postToAI(
  payload: Record<string, unknown>,
  opts: { headers: Record<string, string>; signal?: AbortSignal },
): Promise<AITransportResult> {
  if (isDesktop() && nativeBridge) {
    return nativeBridge(payload);
  }

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: opts.headers,
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Shared Anthropic API helpers: timeout-wrapped fetch and error parsing.
 * Used by research-engine, hackathon-builder, competitor-intelligence, hackathon-scout.
 */

export const ANTHROPIC_REQUEST_TIMEOUT_MS = 120_000; // 2 min (web search can be slow)

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = ANTHROPIC_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Request timed out. Try again or use a simpler request.");
    }
    throw e;
  }
}

export function getAnthropicError(res: Response, data: unknown): string {
  const msg = (data as { error?: { message?: string } })?.error?.message;
  return msg ?? (res.statusText || `HTTP ${res.status}`);
}

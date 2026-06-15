/**
 * Unified LLM layer: Claude (Anthropic) or Google (Gemini).
 * Provider and keys from Settings (localStorage). Used by Skills and Cost Optimizer.
 */

import { proxyHeaders } from "@/lib/proxy";
import { postToAI } from "@/lib/ai-transport";

const ANTHROPIC_KEY_STORAGE = "cbt_os_anthropic_api_key";
const GOOGLE_KEY_STORAGE = "cbt_os_google_api_key";
const AI_PROVIDER_KEY = "cbt_os_ai_provider";

export type AIProvider = "claude" | "google";

export function getStoredAnthropicKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const k = localStorage.getItem(ANTHROPIC_KEY_STORAGE);
  return k && k.trim() && k !== "your_claude_api_key" ? k : undefined;
}

export function setStoredAnthropicKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(ANTHROPIC_KEY_STORAGE, trimmed);
  else localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
}

export function getStoredGoogleKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const k = localStorage.getItem(GOOGLE_KEY_STORAGE);
  return k && k.trim() ? k : undefined;
}

export function getPreferredProvider(): AIProvider {
  if (typeof window === "undefined") return "claude";
  const p = localStorage.getItem(AI_PROVIDER_KEY);
  return p === "google" ? "google" : "claude";
}

export function setPreferredProvider(provider: AIProvider): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AI_PROVIDER_KEY, provider);
}

/** Resolve which provider and key to use. Prefers preferred provider if key exists. */
export function getActiveProvider(): { provider: AIProvider; apiKey: string } | null {
  const preferred = getPreferredProvider();
  const anthropic = getStoredAnthropicKey();
  const google = getStoredGoogleKey();

  if (preferred === "google" && google) return { provider: "google", apiKey: google };
  if (preferred === "claude" && anthropic) return { provider: "claude", apiKey: anthropic };
  if (google) return { provider: "google", apiKey: google };
  if (anthropic) return { provider: "claude", apiKey: anthropic };
  return null;
}

export interface LLMCompleteOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  provider?: AIProvider;
}

const REQUEST_TIMEOUT_MS = 120_000;

async function completeWithClaude(_apiKey: string, opts: LLMCompleteOptions): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { ok, status, data } = await postToAI(
      {
        provider: "claude",
        prompt: opts.prompt,
        system: opts.systemPrompt,
        max_tokens: opts.maxTokens ?? 2000,
      },
      { headers: proxyHeaders(), signal: controller.signal },
    );
    clearTimeout(id);
    if (!ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${status}`;
      throw new Error(msg);
    }
    const text = (data as { content?: { type: string; text?: string }[] })?.content?.[0]?.text;
    if (!text) throw new Error("Invalid API response: no content");
    return text;
  } catch (e) {
    clearTimeout(id);
    if (e instanceof Error && e.name === "AbortError") throw new Error("Request timed out.");
    throw e;
  }
}

async function completeWithGoogle(_apiKey: string, opts: LLMCompleteOptions): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { ok, status, data } = await postToAI(
      {
        provider: "google",
        prompt: opts.systemPrompt ? `${opts.systemPrompt}\n\n${opts.prompt}` : opts.prompt,
        max_tokens: opts.maxTokens ?? 2000,
      },
      { headers: proxyHeaders(), signal: controller.signal },
    );
    clearTimeout(id);
    if (!ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${status}`;
      throw new Error(msg);
    }
    const text = (data as { content?: { type: string; text?: string }[] })?.content?.[0]?.text;
    if (text == null) throw new Error("Invalid API response: no content");
    return text;
  } catch (e) {
    clearTimeout(id);
    if (e instanceof Error && e.name === "AbortError") throw new Error("Request timed out.");
    throw e;
  }
}

/**
 * Single completion using preferred provider (Claude or Google).
 * Throws if no API key is configured for the chosen provider.
 */
export async function complete(opts: LLMCompleteOptions): Promise<string> {
  const active = getActiveProvider();
  if (!active) throw new Error("No AI API key set. Add a Claude or Google (Gemini) key in Settings.");

  if (active.provider === "google") return completeWithGoogle(active.apiKey, opts);
  return completeWithClaude(active.apiKey, opts);
}

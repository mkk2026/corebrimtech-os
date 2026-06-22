/**
 * Unified LLM layer: Claude (Anthropic), Google (Gemini), or NVIDIA NIM (free OpenAI-compatible).
 * Provider and keys from Settings (localStorage). Used by Skills and Cost Optimizer.
 */

import { proxyHeaders } from "@/lib/proxy";
import { postToAI } from "@/lib/ai-transport";

const ANTHROPIC_KEY_STORAGE = "cbt_os_anthropic_api_key";
const GOOGLE_KEY_STORAGE = "cbt_os_google_api_key";
const NVIDIA_KEY_STORAGE = "cbt_os_nvidia_api_key";
const AI_PROVIDER_KEY = "cbt_os_ai_provider";

export type AIProvider = "claude" | "google" | "nvidia";

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

export function setStoredGoogleKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(GOOGLE_KEY_STORAGE, trimmed);
  else localStorage.removeItem(GOOGLE_KEY_STORAGE);
}

export function getStoredNvidiaKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const k = localStorage.getItem(NVIDIA_KEY_STORAGE);
  return k && k.trim() ? k : undefined;
}

export function setStoredNvidiaKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(NVIDIA_KEY_STORAGE, trimmed);
  else localStorage.removeItem(NVIDIA_KEY_STORAGE);
}

export function getPreferredProvider(): AIProvider {
  if (typeof window === "undefined") return "claude";
  const p = localStorage.getItem(AI_PROVIDER_KEY);
  return p === "google" ? "google" : p === "nvidia" ? "nvidia" : "claude";
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
  const nvidia = getStoredNvidiaKey();

  // Honor the preferred provider if its key exists.
  if (preferred === "google" && google) return { provider: "google", apiKey: google };
  if (preferred === "nvidia" && nvidia) return { provider: "nvidia", apiKey: nvidia };
  if (preferred === "claude" && anthropic) return { provider: "claude", apiKey: anthropic };
  // Otherwise fall back to any configured key.
  if (anthropic) return { provider: "claude", apiKey: anthropic };
  if (google) return { provider: "google", apiKey: google };
  if (nvidia) return { provider: "nvidia", apiKey: nvidia };
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
    if (!text?.trim()) throw new Error("Invalid API response: no content");
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
    if (!text?.trim()) throw new Error("Invalid API response: no content");
    return text;
  } catch (e) {
    clearTimeout(id);
    if (e instanceof Error && e.name === "AbortError") throw new Error("Request timed out.");
    throw e;
  }
}

async function completeWithNvidia(_apiKey: string, opts: LLMCompleteOptions): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { ok, status, data } = await postToAI(
      {
        provider: "nvidia",
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
    // The proxy / native bridge normalizes NVIDIA's OpenAI shape to the Claude-like content array.
    const text = (data as { content?: { type: string; text?: string }[] })?.content?.[0]?.text;
    if (!text?.trim()) throw new Error("Invalid API response: no content");
    return text;
  } catch (e) {
    clearTimeout(id);
    if (e instanceof Error && e.name === "AbortError") throw new Error("Request timed out.");
    throw e;
  }
}

/**
 * Single completion using the preferred provider (Claude, Google, or NVIDIA).
 * Throws if no API key is configured for the chosen provider.
 */
export async function complete(opts: LLMCompleteOptions): Promise<string> {
  const active = getActiveProvider();
  if (!active) throw new Error("No AI API key set. Add a Claude, Google (Gemini), or NVIDIA key in Settings.");

  if (active.provider === "google") return completeWithGoogle(active.apiKey, opts);
  if (active.provider === "nvidia") return completeWithNvidia(active.apiKey, opts);
  return completeWithClaude(active.apiKey, opts);
}

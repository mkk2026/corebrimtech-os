import { describe, it, expect, beforeEach, vi } from "vitest";

// Regression coverage for the empty-string completion leak:
// route.ts normalizes blocked Google/NVIDIA output with `?? ""`, returning
// HTTP 200 + {content:[{text:""}]}. The Google/NVIDIA branches in llm.ts
// guarded with `text == null`, which let "" through as a valid completion.
// complete() must throw on empty/whitespace-only output for ALL providers.

const { postToAIMock } = vi.hoisted(() => ({ postToAIMock: vi.fn() }));
vi.mock("./ai-transport", () => ({ postToAI: postToAIMock, isDesktop: () => false }));
vi.mock("./proxy", () => ({ proxyHeaders: () => ({}) }));

import {
  complete,
  setStoredAnthropicKey,
  setStoredGoogleKey,
  setStoredNvidiaKey,
  setPreferredProvider,
  type AIProvider,
} from "./llm";

function aiResponse(text: string) {
  return { ok: true, status: 200, data: { content: [{ type: "text", text }] } };
}

function useProvider(p: AIProvider): void {
  if (p === "claude") setStoredAnthropicKey("sk-ant-test");
  if (p === "google") setStoredGoogleKey("g-test");
  if (p === "nvidia") setStoredNvidiaKey("nv-test");
  setPreferredProvider(p);
}

beforeEach(() => {
  localStorage.clear();
  postToAIMock.mockReset();
});

describe("complete() — non-empty completion contract", () => {
  const providers: AIProvider[] = ["claude", "google", "nvidia"];

  for (const p of providers) {
    it(`throws when ${p} returns 200 with empty text (e.g. safety block)`, async () => {
      useProvider(p);
      postToAIMock.mockResolvedValue(aiResponse(""));
      await expect(complete({ prompt: "hi" })).rejects.toThrow(/no content/);
    });

    it(`throws when ${p} returns 200 with whitespace-only text`, async () => {
      useProvider(p);
      postToAIMock.mockResolvedValue(aiResponse("   \n  "));
      await expect(complete({ prompt: "hi" })).rejects.toThrow(/no content/);
    });

    it(`returns the text when ${p} returns real content`, async () => {
      useProvider(p);
      postToAIMock.mockResolvedValue(aiResponse("real answer"));
      await expect(complete({ prompt: "hi" })).resolves.toBe("real answer");
    });
  }

  it("throws when no provider key is configured", async () => {
    await expect(complete({ prompt: "hi" })).rejects.toThrow(/No AI API key/);
  });

  it("surfaces a non-ok response as an error, not empty success", async () => {
    useProvider("google");
    postToAIMock.mockResolvedValue({ ok: false, status: 429, data: { error: { message: "rate limited" } } });
    await expect(complete({ prompt: "hi" })).rejects.toThrow(/rate limited/);
  });
});

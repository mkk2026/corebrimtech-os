import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/llm", () => ({ complete: vi.fn(), getActiveProvider: vi.fn() }));

import { complete, getActiveProvider } from "@/lib/llm";
import { askCoFounderLive } from "./engine";
import { getMessages, getThinking, clearConversation } from "./cofounder-store";

beforeEach(() => {
  clearConversation();
  vi.mocked(complete).mockReset();
  vi.mocked(getActiveProvider).mockReset();
});

describe("askCoFounderLive", () => {
  it("appends the user message and a grounded answer, clearing the thinking flag", async () => {
    vi.mocked(getActiveProvider).mockReturnValue({ provider: "claude", apiKey: "k" });
    vi.mocked(complete).mockResolvedValue("Close your top deal this week.");

    await askCoFounderLive("what should I focus on?");

    const msgs = getMessages();
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toMatchObject({ role: "user", text: "what should I focus on?" });
    expect(msgs[1]).toMatchObject({ role: "cofounder", text: "Close your top deal this week." });
    expect(getThinking()).toBe(false);
  });

  it("appends an error message when no key is set", async () => {
    vi.mocked(getActiveProvider).mockReturnValue(null);
    await askCoFounderLive("hi");
    const msgs = getMessages();
    expect(msgs[1]).toMatchObject({ role: "cofounder", error: true });
    expect(complete).not.toHaveBeenCalled();
  });

  it("ignores an empty question", async () => {
    await askCoFounderLive("   ");
    expect(getMessages()).toHaveLength(0);
  });
});

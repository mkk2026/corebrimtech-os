import { describe, it, expect, vi } from "vitest";
import { askCoFounder, type AskDeps } from "./engine";

function makeDeps(overrides: Partial<AskDeps> = {}): AskDeps {
  return {
    hasKey: () => true,
    buildContext: () => ({ company: null, burn: null, deals: null, goals: null, energy: null, decisions: null, weekly: null, market: null }),
    renderContext: () => "Company: Acme (stage: mvp).",
    complete: vi.fn(async () => "Focus on closing your top deal this week."),
    ...overrides,
  };
}

describe("askCoFounder", () => {
  it("rejects an empty question without calling the model", async () => {
    const complete = vi.fn();
    const res = await askCoFounder("   ", makeDeps({ complete }));
    expect(res.ok).toBe(false);
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns needsKey when no API key is configured", async () => {
    const complete = vi.fn();
    const res = await askCoFounder("what now?", makeDeps({ hasKey: () => false, complete }));
    expect(res).toMatchObject({ ok: false, needsKey: true });
    expect(complete).not.toHaveBeenCalled();
  });

  it("grounds the system prompt in the rendered founder context", async () => {
    const complete = vi.fn<AskDeps["complete"]>(async () => "answer");
    await askCoFounder("how's my runway?", makeDeps({ complete }));
    const call = complete.mock.calls[0]?.[0];
    expect(call?.systemPrompt).toContain("Company: Acme");
    expect(call?.prompt).toBe("how's my runway?");
  });

  it("returns the model answer on success", async () => {
    const res = await askCoFounder("advice?", makeDeps());
    expect(res).toEqual({ ok: true, answer: "Focus on closing your top deal this week." });
  });

  it("fails when the model returns an empty answer", async () => {
    const res = await askCoFounder("advice?", makeDeps({ complete: vi.fn(async () => "   ") }));
    expect(res.ok).toBe(false);
  });

  it("maps a thrown error to a failure reason", async () => {
    const res = await askCoFounder("advice?", makeDeps({ complete: vi.fn(async () => { throw new Error("rate limited"); }) }));
    expect(res).toMatchObject({ ok: false, reason: "rate limited" });
  });

  it("maps a non-Error throw to a generic reason", async () => {
    const res = await askCoFounder("advice?", makeDeps({ complete: vi.fn(async () => { throw "boom"; }) }));
    expect(res).toMatchObject({ ok: false });
    if (!res.ok) expect(res.reason.length).toBeGreaterThan(0);
  });
});

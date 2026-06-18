import { describe, it, expect } from "vitest";
import { runResearch } from "./research-engine";

// Guards the no-mock-data rule: Deep Research must require a real key, never fabricate demo data.
describe("runResearch require-key guard", () => {
  it("yields an error and stops when no API key is provided", async () => {
    const gen = runResearch("AI developer tools");
    const first = await gen.next();
    expect(first.value).toMatchObject({ type: "error" });
    expect(String((first.value as { error?: string }).error)).toMatch(/key/i);
    const second = await gen.next();
    expect(second.done).toBe(true);
  });

  it("treats the literal 'mock' key as no key (no fabricated data)", async () => {
    const gen = runResearch("AI developer tools", "mock");
    const first = await gen.next();
    expect(first.value).toMatchObject({ type: "error" });
  });
});

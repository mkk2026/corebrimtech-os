import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./signals", async (orig) => {
  const actual = await orig<typeof import("./signals")>();
  return { ...actual, detectSignalsLive: vi.fn() };
});

import { snoozeNudge, isSnoozed, getActiveNudges } from "./nudge-snooze";
import { detectSignalsLive, type Nudge } from "./signals";

const NUDGE: Nudge = { id: "runway", severity: "high", message: "m", actionLabel: "a", targetModule: "burnrate" };
const NUDGE2: Nudge = { id: "low-energy", severity: "medium", message: "m", actionLabel: "a", targetModule: "energy" };

beforeEach(() => {
  localStorage.clear();
  vi.mocked(detectSignalsLive).mockReset();
});

describe("nudge-snooze", () => {
  it("a freshly snoozed nudge reports snoozed", () => {
    expect(isSnoozed("runway")).toBe(false);
    snoozeNudge("runway");
    expect(isSnoozed("runway")).toBe(true);
  });

  it("a snooze in the past is no longer active", () => {
    localStorage.setItem("cbt_os_nudge_snooze", JSON.stringify({ runway: Date.now() - 1000 }));
    expect(isSnoozed("runway")).toBe(false);
  });

  it("getActiveNudges filters out snoozed ones", () => {
    vi.mocked(detectSignalsLive).mockReturnValue([NUDGE, NUDGE2]);
    snoozeNudge("runway");
    const active = getActiveNudges();
    expect(active.map((n) => n.id)).toEqual(["low-energy"]);
  });

  it("getActiveNudges returns all when nothing is snoozed", () => {
    vi.mocked(detectSignalsLive).mockReturnValue([NUDGE, NUDGE2]);
    expect(getActiveNudges()).toHaveLength(2);
  });

  it("tolerates corrupt storage", () => {
    localStorage.setItem("cbt_os_nudge_snooze", "not json");
    expect(isSnoozed("runway")).toBe(false);
  });
});

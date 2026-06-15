import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shouldNotify, runSignalTick, startSignalWatch } from "./desktop-signal-watch";
import type { Nudge } from "./cofounder/signals";

declare global {
  interface Window { __TAURI__?: unknown }
}

const high: Nudge = { id: "runway", severity: "high", message: "Runway is 3 months.", actionLabel: "x", targetModule: "burnrate" };
const low: Nudge = { id: "market-gaps", severity: "low", message: "gaps", actionLabel: "x", targetModule: "marketgaps" };

afterEach(() => { delete (window as Window).__TAURI__; vi.useRealTimers(); });

describe("shouldNotify", () => {
  it("notifies for a new high-severity nudge", () => {
    expect(shouldNotify(high, new Set())).toBe(true);
  });
  it("ignores non-high severity", () => {
    expect(shouldNotify(low, new Set())).toBe(false);
  });
  it("does not re-notify an already-notified nudge", () => {
    expect(shouldNotify(high, new Set(["runway"]))).toBe(false);
  });
});

describe("runSignalTick", () => {
  let send: ReturnType<typeof vi.fn<(title: string, body: string) => Promise<void>>>;
  beforeEach(() => { send = vi.fn<(title: string, body: string) => Promise<void>>(async () => {}); });

  it("sends one notification for a new high nudge and dedups on the next tick", async () => {
    const seen = new Set<string>();
    const getNudges = vi.fn(() => [high, low]);

    await runSignalTick({ getNudges, send, seen });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("Your co-founder", "Runway is 3 months.");

    await runSignalTick({ getNudges, send, seen }); // same nudge still active
    expect(send).toHaveBeenCalledTimes(1); // not sent again
  });

  it("sends nothing when there are no high-severity nudges", async () => {
    await runSignalTick({ getNudges: () => [low], send, seen: new Set() });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("startSignalWatch", () => {
  it("is a no-op on web (returns a noop stop fn, no timer)", () => {
    vi.useFakeTimers();
    const setInterval = vi.spyOn(globalThis, "setInterval");
    const stop = startSignalWatch(1000);
    expect(setInterval).not.toHaveBeenCalled();
    stop();
  });

  it("schedules ticks on desktop and stops cleanly", () => {
    (window as Window).__TAURI__ = {};
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const stop = startSignalWatch(1000);
    stop();
    expect(clearSpy).toHaveBeenCalled();
  });
});

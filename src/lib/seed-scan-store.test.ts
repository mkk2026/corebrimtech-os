import { describe, it, expect, vi } from "vitest";
import { getSeedStatus, setSeedStatus, subscribeSeedStatus } from "./seed-scan-store";

describe("seed-scan-store", () => {
  it("notifies subscribers of status changes", () => {
    const listener = vi.fn();
    const unsub = subscribeSeedStatus(listener);
    setSeedStatus({ phase: "researching", message: "go" });
    expect(listener).toHaveBeenCalledWith({ phase: "researching", message: "go" });
    expect(getSeedStatus()).toEqual({ phase: "researching", message: "go" });
    unsub();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsub = subscribeSeedStatus(listener);
    unsub();
    setSeedStatus({ phase: "found", competitors: 1, gaps: 1 });
    expect(listener).not.toHaveBeenCalled();
  });
});

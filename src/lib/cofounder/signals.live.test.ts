import { describe, it, expect, vi } from "vitest";

vi.mock("./context", () => ({ buildFounderContext: vi.fn() }));

import { detectSignalsLive } from "./signals";
import { buildFounderContext } from "./context";

describe("detectSignalsLive", () => {
  it("detects signals from the live founder context", () => {
    vi.mocked(buildFounderContext).mockReturnValue({
      company: null,
      burn: { runwayMonths: 2, monthlyBurn: 5000, monthlyRevenue: 0, isProfitable: false },
      deals: null, goals: null, energy: null, decisions: null, weekly: null, market: null,
    });
    const nudges = detectSignalsLive();
    expect(nudges.find((n) => n.id === "runway")).toBeDefined();
  });
});

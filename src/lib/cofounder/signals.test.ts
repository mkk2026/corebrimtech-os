import { describe, it, expect } from "vitest";
import { detectSignals } from "./signals";
import type { FounderContext } from "./context";

const EMPTY: FounderContext = { company: null, burn: null, deals: null, goals: null };

function ctx(overrides: Partial<FounderContext>): FounderContext {
  return { ...EMPTY, ...overrides };
}

describe("detectSignals", () => {
  it("returns no nudges when there is no data", () => {
    expect(detectSignals(EMPTY)).toEqual([]);
  });

  it("fires a high-severity runway nudge when runway is short and unprofitable", () => {
    const nudges = detectSignals(ctx({ burn: { runwayMonths: 3, monthlyBurn: 5000, monthlyRevenue: 0, isProfitable: false } }));
    const runway = nudges.find((n) => n.id === "runway");
    expect(runway).toMatchObject({ severity: "high", targetModule: "burnrate" });
  });

  it("does NOT fire the runway nudge when profitable", () => {
    const nudges = detectSignals(ctx({ burn: { runwayMonths: 2, monthlyBurn: 100, monthlyRevenue: 9000, isProfitable: true } }));
    expect(nudges.find((n) => n.id === "runway")).toBeUndefined();
  });

  it("does NOT fire the runway nudge when runway is comfortable", () => {
    const nudges = detectSignals(ctx({ burn: { runwayMonths: 12, monthlyBurn: 5000, monthlyRevenue: 0, isProfitable: false } }));
    expect(nudges.find((n) => n.id === "runway")).toBeUndefined();
  });

  it("fires when goals are at risk", () => {
    const nudges = detectSignals(ctx({ goals: { active: 3, avgProgress: 20, atRisk: 2 } }));
    expect(nudges.find((n) => n.id === "goals-at-risk")?.targetModule).toBe("goals");
  });

  it("flags an empty pipeline while burning cash", () => {
    const nudges = detectSignals(ctx({ burn: { runwayMonths: 8, monthlyBurn: 4000, monthlyRevenue: 0, isProfitable: false }, deals: null }));
    expect(nudges.find((n) => n.id === "empty-pipeline")?.targetModule).toBe("pipeline");
  });

  it("does NOT flag empty pipeline when deals exist", () => {
    const nudges = detectSignals(ctx({ burn: { runwayMonths: 8, monthlyBurn: 4000, monthlyRevenue: 0, isProfitable: false }, deals: { pipelineValue: 50000, weightedValue: 20000 } }));
    expect(nudges.find((n) => n.id === "empty-pipeline")).toBeUndefined();
  });

  it("sorts high severity before medium", () => {
    const nudges = detectSignals(ctx({
      burn: { runwayMonths: 2, monthlyBurn: 5000, monthlyRevenue: 0, isProfitable: false }, // high (runway) + empty-pipeline (medium)
      goals: { active: 2, avgProgress: 10, atRisk: 1 }, // medium
    }));
    const severities = nudges.map((n) => n.severity);
    const rank = { high: 0, medium: 1, low: 2 } as const;
    const sorted = [...severities].sort((a, b) => rank[a] - rank[b]);
    expect(severities).toEqual(sorted);
    expect(nudges[0].severity).toBe("high");
  });
});

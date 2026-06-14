import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/founder-brain", () => ({ getBrain: vi.fn() }));
vi.mock("@/lib/burn-rate", () => ({ getBurnStats: vi.fn() }));
vi.mock("@/lib/deal-pipeline", () => ({ getPipelineStats: vi.fn() }));
vi.mock("@/lib/goals", () => ({ getGoalStats: vi.fn() }));
vi.mock("@/lib/energy-tracker", () => ({ getEnergyStats: vi.fn() }));
vi.mock("@/lib/decision-journal", () => ({ getDecisionStats: vi.fn() }));
vi.mock("@/lib/weekly-review", () => ({ getWeeklyReviewStats: vi.fn(), getReviewStreak: vi.fn() }));
vi.mock("@/lib/market-gap-scanner", () => ({ getMarketGaps: vi.fn() }));
vi.mock("@/lib/competitor-intelligence", () => ({ getCompetitorReports: vi.fn() }));

import { buildFounderContext, renderContextPrompt } from "./context";
import { getBrain } from "@/lib/founder-brain";
import { getBurnStats } from "@/lib/burn-rate";
import { getPipelineStats } from "@/lib/deal-pipeline";
import { getGoalStats } from "@/lib/goals";
import { getEnergyStats } from "@/lib/energy-tracker";
import { getDecisionStats } from "@/lib/decision-journal";
import { getWeeklyReviewStats, getReviewStreak } from "@/lib/weekly-review";
import { getMarketGaps } from "@/lib/market-gap-scanner";
import { getCompetitorReports } from "@/lib/competitor-intelligence";

function emptyAll() {
  vi.mocked(getBrain).mockReturnValue(null);
  vi.mocked(getBurnStats).mockReturnValue({ totalExpenses: 0, totalRevenueStreams: 0, monthlyBurn: 0, monthlyRevenue: 0, netBurn: 0, runwayMonths: 0, isProfitable: false, essentialExpenses: 0, cuttableExpenses: 0, targetRunway: 0, emergencyFund: 0 });
  vi.mocked(getPipelineStats).mockReturnValue({ totalValue: 0, weightedValue: 0 } as never);
  vi.mocked(getGoalStats).mockReturnValue({ total: 0, active: 0, completed: 0, avgProgress: 0, onTrack: 0, atRisk: 0 });
  vi.mocked(getEnergyStats).mockReturnValue({ totalEntries: 0, avgEnergy: 0, bestTimeOfDay: "Unknown", worstTimeOfDay: "Unknown", mostProductiveActivity: null, energyDrains: [], energyBoosts: [], streak: 0 } as never);
  vi.mocked(getDecisionStats).mockReturnValue({ total: 0 } as never);
  vi.mocked(getWeeklyReviewStats).mockReturnValue({ total: 0, completed: 0, completionRate: 0, avgEnergy: 0, avgFocus: 0, totalWins: 0 });
  vi.mocked(getReviewStreak).mockReturnValue(0);
  vi.mocked(getMarketGaps).mockReturnValue([]);
  vi.mocked(getCompetitorReports).mockReturnValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  emptyAll();
});

describe("buildFounderContext", () => {
  it("returns all-null sections when no data exists", () => {
    const ctx = buildFounderContext();
    expect(ctx.company).toBeNull();
    expect(ctx.burn).toBeNull();
    expect(ctx.deals).toBeNull();
    expect(ctx.market).toBeNull();
  });

  it("captures company context from the brain", () => {
    vi.mocked(getBrain).mockReturnValue({ companyName: "Core Brim Tech", companyTagline: "OS for founders", companyMission: "m", stage: "mvp", founders: [{ name: "Momodu" }] } as never);
    const ctx = buildFounderContext();
    expect(ctx.company).toMatchObject({ name: "Core Brim Tech", stage: "mvp", founderName: "Momodu" });
  });

  it("captures burn only when there is real financial data", () => {
    vi.mocked(getBurnStats).mockReturnValue({ totalExpenses: 3, totalRevenueStreams: 1, monthlyBurn: 5000, monthlyRevenue: 1000, netBurn: 4000, runwayMonths: 6, isProfitable: false, essentialExpenses: 0, cuttableExpenses: 0, targetRunway: 12, emergencyFund: 3 });
    const ctx = buildFounderContext();
    expect(ctx.burn).toMatchObject({ runwayMonths: 6, isProfitable: false });
  });

  it("captures market signal from gaps + competitor reports", () => {
    vi.mocked(getMarketGaps).mockReturnValue([{ title: "Unserved SMBs" }] as never);
    vi.mocked(getCompetitorReports).mockReturnValue([{ competitorName: "Acme" }] as never);
    const ctx = buildFounderContext();
    expect(ctx.market).toMatchObject({ gaps: 1, competitors: 1 });
  });

  it("treats a throwing source defensively as null", () => {
    vi.mocked(getBurnStats).mockImplementation(() => { throw new Error("storage broke"); });
    const ctx = buildFounderContext();
    expect(ctx.burn).toBeNull();
  });
});

describe("renderContextPrompt", () => {
  it("produces a non-empty baseline when there is no data", () => {
    const prompt = renderContextPrompt(buildFounderContext());
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toMatch(/hasn.t entered|no data|not set/i);
  });

  it("renders every section when all data is present", () => {
    vi.mocked(getBrain).mockReturnValue({ companyName: "Acme", companyTagline: "t", companyMission: "Solve X", stage: "growth", founders: [{ name: "Mo" }] } as never);
    vi.mocked(getBurnStats).mockReturnValue({ totalExpenses: 2, totalRevenueStreams: 0, monthlyBurn: 8000, monthlyRevenue: 0, netBurn: 8000, runwayMonths: 4, isProfitable: false, essentialExpenses: 0, cuttableExpenses: 0, targetRunway: 12, emergencyFund: 3 });
    vi.mocked(getPipelineStats).mockReturnValue({ totalValue: 50000, weightedValue: 21000.6 } as never);
    vi.mocked(getGoalStats).mockReturnValue({ total: 3, active: 2, completed: 1, avgProgress: 40, onTrack: 1, atRisk: 1 });
    vi.mocked(getEnergyStats).mockReturnValue({ totalEntries: 10, avgEnergy: 3.83, bestTimeOfDay: "am", worstTimeOfDay: "pm", mostProductiveActivity: null, energyDrains: [], energyBoosts: [], streak: 4 } as never);
    vi.mocked(getDecisionStats).mockReturnValue({ total: 7 } as never);
    vi.mocked(getWeeklyReviewStats).mockReturnValue({ total: 3, completed: 2, completionRate: 66, avgEnergy: 4, avgFocus: 4, totalWins: 5 });
    vi.mocked(getReviewStreak).mockReturnValue(2);
    vi.mocked(getMarketGaps).mockReturnValue([{ title: "SMBs underserved" }] as never);
    vi.mocked(getCompetitorReports).mockReturnValue([{ competitorName: "Rival" }] as never);

    const prompt = renderContextPrompt(buildFounderContext());
    expect(prompt).toMatch(/Acme.*growth/);
    expect(prompt).toMatch(/Mo/);
    expect(prompt).toMatch(/Solve X/);
    expect(prompt).toMatch(/4 months runway/);
    expect(prompt).toMatch(/Pipeline: \$50000.*21001/);
    expect(prompt).toMatch(/2 active at 40%/);
    expect(prompt).toMatch(/3.8\/5.*4-day streak/);
    expect(prompt).toMatch(/Decisions logged: 7/);
    expect(prompt).toMatch(/2 completed.*2-week streak/);
    expect(prompt).toMatch(/1 competitors.*1 gaps.*SMBs underserved/);
  });

  it("renders a profitable finance line and no optional company fields", () => {
    vi.mocked(getBrain).mockReturnValue({ companyName: "Lean", companyTagline: "", companyMission: "", stage: "scale", founders: [] } as never);
    vi.mocked(getBurnStats).mockReturnValue({ totalExpenses: 1, totalRevenueStreams: 2, monthlyBurn: 1000, monthlyRevenue: 5000, netBurn: -4000, runwayMonths: 99, isProfitable: true, essentialExpenses: 0, cuttableExpenses: 0, targetRunway: 12, emergencyFund: 3 });
    const prompt = renderContextPrompt(buildFounderContext());
    expect(prompt).toContain("Lean");
    expect(prompt).not.toContain("—"); // no tagline dash
    expect(prompt).toMatch(/profitable/);
  });

  it("includes present sections and stays within the token cap", () => {
    vi.mocked(getBrain).mockReturnValue({ companyName: "Acme", companyTagline: "t", companyMission: "", stage: "growth", founders: [] } as never);
    vi.mocked(getGoalStats).mockReturnValue({ total: 2, active: 2, completed: 0, avgProgress: 55, onTrack: 1, atRisk: 1 });
    const prompt = renderContextPrompt(buildFounderContext());
    expect(prompt).toContain("Acme");
    expect(prompt).toMatch(/growth/);
    expect(prompt.length).toBeLessThan(4000);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./llm", () => ({
  complete: vi.fn(),
  getActiveProvider: vi.fn(),
}));

import { complete, getActiveProvider } from "./llm";
import { seedAutoResearchLive } from "./auto-research";
import { saveBrain, getDefaultBrain, getBrain } from "./founder-brain";
import { getSeedStatus, setSeedStatus } from "./seed-scan-store";
import { getCompetitorReports } from "./competitor-intelligence";
import { getMarketGaps } from "./market-gap-scanner";

const VALID = JSON.stringify({
  competitors: [
    { name: "Acme Rival", description: "d", threatAssessment: "high", strengths: ["s"], weaknesses: ["w"] },
  ],
  gaps: [{ title: "Unserved SMBs", description: "d", evidence: ["e"], keywords: ["smb"] }],
});

beforeEach(() => {
  localStorage.clear();
  setSeedStatus({ phase: "idle" });
  vi.mocked(getActiveProvider).mockReset();
  vi.mocked(complete).mockReset();
  saveBrain({ ...getDefaultBrain(), companyName: "Acme", companyTagline: "OS for SMBs", setupComplete: true });
});

describe("seedAutoResearchLive", () => {
  it("emits needs-key when no provider key is configured", async () => {
    vi.mocked(getActiveProvider).mockReturnValue(null);
    await seedAutoResearchLive();
    expect(getSeedStatus().phase).toBe("needs-key");
  });

  it("runs a real scan, writes reports + gaps, and marks the brain seeded", async () => {
    vi.mocked(getActiveProvider).mockReturnValue({ provider: "claude", apiKey: "k" });
    vi.mocked(complete).mockResolvedValue(VALID);

    await seedAutoResearchLive();

    expect(getSeedStatus()).toEqual({ phase: "found", competitors: 1, gaps: 1 });
    expect(getCompetitorReports()).toHaveLength(1);
    expect(getMarketGaps()).toHaveLength(1);
    expect(getBrain()?.seededAt).toBeTruthy();
  });

  it("parses JSON wrapped in markdown fences", async () => {
    vi.mocked(getActiveProvider).mockReturnValue({ provider: "claude", apiKey: "k" });
    vi.mocked(complete).mockResolvedValue("Here you go:\n```json\n" + VALID + "\n```");

    await seedAutoResearchLive();
    expect(getSeedStatus().phase).toBe("found");
  });

  it("fails gracefully on malformed LLM output", async () => {
    vi.mocked(getActiveProvider).mockReturnValue({ provider: "claude", apiKey: "k" });
    vi.mocked(complete).mockResolvedValue("not json at all");

    await seedAutoResearchLive();
    const status = getSeedStatus();
    expect(status.phase).toBe("failed");
    expect(getBrain()?.seededAt).toBeFalsy(); // not marked → Retry can re-run
  });

  it("is a no-op once the brain is already seeded (dedup)", async () => {
    saveBrain({ ...getBrain()!, seededAt: new Date().toISOString() });
    vi.mocked(getActiveProvider).mockReturnValue({ provider: "claude", apiKey: "k" });
    vi.mocked(complete).mockResolvedValue(VALID);

    await seedAutoResearchLive();
    expect(complete).not.toHaveBeenCalled();
  });
});

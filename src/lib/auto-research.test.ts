import { describe, it, expect, vi } from "vitest";
import { seedAutoResearch, type SeedAutoResearchDeps } from "./auto-research";

function makeDeps(overrides: Partial<SeedAutoResearchDeps> = {}): {
  deps: SeedAutoResearchDeps;
  emit: ReturnType<typeof vi.fn>;
  markSeeded: ReturnType<typeof vi.fn>;
} {
  const emit = vi.fn();
  const markSeeded = vi.fn();
  const deps: SeedAutoResearchDeps = {
    isEnabled: () => true,
    alreadySeeded: () => false,
    hasKey: () => true,
    getCompany: () => ({ name: "Acme Inc", tagline: "OS for founders" }),
    markSeeded,
    emit,
    runScan: vi.fn(async () => ({ competitors: 3, gaps: 2 })),
    ...overrides,
  };
  return { deps, emit, markSeeded };
}

describe("seedAutoResearch", () => {
  it("does nothing when the feature flag is off", async () => {
    const { deps, emit } = makeDeps({ isEnabled: () => false });
    await seedAutoResearch(deps);
    expect(emit).not.toHaveBeenCalled();
  });

  it("is a no-op when already seeded (dedup guard)", async () => {
    const runScan = vi.fn();
    const { deps, emit } = makeDeps({ alreadySeeded: () => true, runScan });
    await seedAutoResearch(deps);
    expect(runScan).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it("does nothing when there is no company name", async () => {
    const { deps, emit } = makeDeps({ getCompany: () => ({ name: "  ", tagline: "" }) });
    await seedAutoResearch(deps);
    expect(emit).not.toHaveBeenCalled();
  });

  it("emits needs-key and does not scan when no API key is set", async () => {
    const runScan = vi.fn();
    const { deps, emit } = makeDeps({ hasKey: () => false, runScan });
    await seedAutoResearch(deps);
    expect(runScan).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith({ phase: "needs-key" });
  });

  it("emits researching then found and marks seeded on success", async () => {
    const { deps, emit, markSeeded } = makeDeps();
    await seedAutoResearch(deps);
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ phase: "researching" }));
    expect(emit).toHaveBeenLastCalledWith({ phase: "found", competitors: 3, gaps: 2 });
    expect(markSeeded).toHaveBeenCalledOnce();
  });

  it("streams progress messages from the scan (streaming reveal)", async () => {
    const runScan: SeedAutoResearchDeps["runScan"] = async (_c, onProgress) => {
      onProgress("Found Competitor X");
      return { competitors: 1, gaps: 0 };
    };
    const { deps, emit } = makeDeps({ runScan });
    await seedAutoResearch(deps);
    expect(emit).toHaveBeenCalledWith({ phase: "researching", message: "Found Competitor X" });
  });

  it("emits failed and does NOT mark seeded when the scan throws (so Retry can re-run)", async () => {
    const runScan = vi.fn(async () => {
      throw new Error("API timeout");
    });
    const { deps, emit, markSeeded } = makeDeps({ runScan });
    await seedAutoResearch(deps);
    expect(emit).toHaveBeenLastCalledWith({ phase: "failed", reason: "API timeout" });
    expect(markSeeded).not.toHaveBeenCalled();
  });

  it("maps non-Error throws to a generic failure reason", async () => {
    const runScan = vi.fn(async () => {
      throw "boom";
    });
    const { deps, emit } = makeDeps({ runScan });
    await seedAutoResearch(deps);
    expect(emit).toHaveBeenLastCalledWith({ phase: "failed", reason: "Research failed. Try again." });
  });
});

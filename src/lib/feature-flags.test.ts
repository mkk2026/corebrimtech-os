import { describe, it, expect, afterEach, vi } from "vitest";
import { isFeatureEnabled, setFeatureEnabled } from "./feature-flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("feature-flags", () => {
  it("defaults autoResearch to on", () => {
    expect(isFeatureEnabled("autoResearch")).toBe(true);
  });

  it("env kill switch disables autoResearch regardless of storage", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTO_RESEARCH", "off");
    setFeatureEnabled("autoResearch", true);
    expect(isFeatureEnabled("autoResearch")).toBe(false);
  });

  it("localStorage override can disable the flag", () => {
    setFeatureEnabled("autoResearch", false);
    expect(isFeatureEnabled("autoResearch")).toBe(false);
  });

  it("localStorage override can re-enable the flag", () => {
    setFeatureEnabled("autoResearch", false);
    setFeatureEnabled("autoResearch", true);
    expect(isFeatureEnabled("autoResearch")).toBe(true);
  });
});

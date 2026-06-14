import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import SeedScanBanner from "./SeedScanBanner";
import { setSeedStatus } from "@/lib/seed-scan-store";

vi.mock("@/lib/auto-research", () => ({ seedAutoResearchLive: vi.fn() }));

describe("SeedScanBanner", () => {
  beforeEach(() => {
    act(() => setSeedStatus({ phase: "idle" }));
  });

  it("renders nothing when idle", () => {
    const { container } = render(<SeedScanBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the streaming research message", () => {
    render(<SeedScanBanner />);
    act(() => setSeedStatus({ phase: "researching", message: "Found competitor: Acme" }));
    expect(screen.getByText("Found competitor: Acme")).toBeInTheDocument();
  });

  it("shows the live found count", () => {
    render(<SeedScanBanner />);
    act(() => setSeedStatus({ phase: "found", competitors: 3, gaps: 2 }));
    expect(screen.getByText(/3 competitors/i)).toBeInTheDocument();
    expect(screen.getByText(/2 market gaps/i)).toBeInTheDocument();
  });

  it("shows a needs-key prompt", () => {
    render(<SeedScanBanner />);
    act(() => setSeedStatus({ phase: "needs-key" }));
    expect(screen.getByText(/add your ai key/i)).toBeInTheDocument();
  });

  it("shows the failure reason with a Retry button", () => {
    render(<SeedScanBanner />);
    act(() => setSeedStatus({ phase: "failed", reason: "API timeout" }));
    expect(screen.getByText(/API timeout/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});

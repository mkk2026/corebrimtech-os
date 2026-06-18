import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomeCommand from "./HomeCommand";

vi.mock("@/lib/founder-brain", () => ({ getBrain: vi.fn() }));
vi.mock("@/lib/burn-rate", () => ({ getBurnStats: vi.fn() }));
vi.mock("@/lib/deal-pipeline", () => ({ getPipelineStats: vi.fn() }));
vi.mock("@/lib/goals", () => ({ getGoalStats: vi.fn() }));
vi.mock("@/lib/research-storage", () => ({ getLibrary: vi.fn() }));

import { getBrain } from "@/lib/founder-brain";
import { getBurnStats } from "@/lib/burn-rate";
import { getPipelineStats } from "@/lib/deal-pipeline";
import { getGoalStats } from "@/lib/goals";
import { getLibrary } from "@/lib/research-storage";

beforeEach(() => {
  vi.mocked(getBrain).mockReturnValue(null);
  vi.mocked(getBurnStats).mockReturnValue({ runwayMonths: 0, monthlyBurn: 0, isProfitable: false, totalValue: 0 } as never);
  vi.mocked(getPipelineStats).mockReturnValue({ totalValue: 0, totalDeals: 0 } as never);
  vi.mocked(getGoalStats).mockReturnValue({ active: 0, avgProgress: 0, atRisk: 0 } as never);
  vi.mocked(getLibrary).mockReturnValue([]);
});

describe("HomeCommand", () => {
  it("shows empty-state prompts when no data exists", () => {
    render(<HomeCommand />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/set up burn rate/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first deal/i)).toBeInTheDocument();
  });

  it("renders real stats when data is present", () => {
    vi.mocked(getBrain).mockReturnValue({ companyName: "Acme", founders: [{ name: "Sam Lee" }] } as never);
    vi.mocked(getBurnStats).mockReturnValue({ runwayMonths: 3, monthlyBurn: 5000, isProfitable: false } as never);
    vi.mocked(getPipelineStats).mockReturnValue({ totalValue: 50000, totalDeals: 4 } as never);
    vi.mocked(getGoalStats).mockReturnValue({ active: 2, avgProgress: 40, atRisk: 1 } as never);
    vi.mocked(getLibrary).mockReturnValue([{ id: "r1" }] as never);

    render(<HomeCommand />);
    expect(screen.getByText(/welcome back, Sam/i)).toBeInTheDocument();
    expect(screen.getByText("3 mo")).toBeInTheDocument();        // runway
    expect(screen.getByText("$50.0K")).toBeInTheDocument();      // pipeline
    expect(screen.getByText("40%")).toBeInTheDocument();         // goals
    expect(screen.getByText(/1 at risk/i)).toBeInTheDocument();
  });

  it("navigates when a stat card is clicked", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<HomeCommand onNavigate={onNavigate} />);
    await user.click(screen.getByText("Runway").closest("button")!);
    expect(onNavigate).toHaveBeenCalledWith("burnrate");
  });

  it("navigates from a quick link", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<HomeCommand onNavigate={onNavigate} />);
    await user.click(screen.getByText("Founder Brain").closest("button")!);
    expect(onNavigate).toHaveBeenCalledWith("brain");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Onboarding from "./Onboarding";
import { getBrain } from "@/lib/founder-brain";
import { getStoredAnthropicKey } from "@/lib/llm";
import { seedAutoResearchLive } from "@/lib/auto-research";
import { setSeedStatus } from "@/lib/seed-scan-store";

vi.mock("@/lib/auto-research", () => ({ seedAutoResearchLive: vi.fn() }));

describe("Onboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(seedAutoResearchLive).mockReset();
    act(() => setSeedStatus({ phase: "idle" }));
  });

  it("'Skip for now' completes setup without firing the seed scan", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<Onboarding onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /skip for now/i }));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(getBrain()?.setupComplete).toBe(true);
    expect(seedAutoResearchLive).not.toHaveBeenCalled();
  });

  it("walks the full flow, stores the key, fires the seed, and launches", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<Onboarding onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /let.s go/i }));
    await user.click(screen.getByRole("button", { name: /next/i })); // founder → company
    await user.type(screen.getByLabelText(/company name/i), "Core Brim Tech");
    await user.click(screen.getByRole("button", { name: /next/i })); // company → stage
    await user.click(screen.getByRole("button", { name: /next/i })); // stage → connect
    await user.type(screen.getByLabelText(/anthropic api key/i), "sk-ant-test");
    await user.click(screen.getByRole("button", { name: /next/i })); // connect → ready

    expect(getStoredAnthropicKey()).toBe("sk-ant-test");
    expect(seedAutoResearchLive).toHaveBeenCalledOnce();
    expect(getBrain()?.companyName).toBe("Core Brim Tech");

    await user.click(screen.getByRole("button", { name: /launch my os/i }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(getBrain()?.setupComplete).toBe(true);
  });

  it("shows the live 'found' count on the ready screen", async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /let.s go/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(screen.getByLabelText(/company name/i), "Acme");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /i.ll add it later/i }));

    act(() => setSeedStatus({ phase: "found", competitors: 3, gaps: 2 }));
    expect(screen.getByText(/3 competitors and 2 market gaps/i)).toBeInTheDocument();
  });

  async function gotoReady(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /let.s go/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.type(screen.getByLabelText(/company name/i), "Acme");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /i.ll add it later/i }));
  }

  it("renders each seed-status message variant on the ready screen", async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={vi.fn()} />);
    await gotoReady(user);

    act(() => setSeedStatus({ phase: "researching", message: "Analyzing your market…" }));
    expect(screen.getByText("Analyzing your market…")).toBeInTheDocument();

    act(() => setSeedStatus({ phase: "needs-key" }));
    expect(screen.getByText(/add an ai key anytime/i)).toBeInTheDocument();

    act(() => setSeedStatus({ phase: "failed", reason: "x" }));
    expect(screen.getByText(/retry from the dashboard/i)).toBeInTheDocument();

    act(() => setSeedStatus({ phase: "found", competitors: 1, gaps: 0 }));
    expect(screen.getByText(/1 competitor\b/i)).toBeInTheDocument();
  });

  it("does not double-fire onComplete on a double-click of Launch", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<Onboarding onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /let.s go/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /i.ll add it later/i }));

    const launch = screen.getByRole("button", { name: /launch my os/i });
    await user.click(launch);
    await user.click(launch);
    expect(onComplete).toHaveBeenCalledOnce();
  });
});

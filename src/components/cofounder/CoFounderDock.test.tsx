import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoFounderDock from "./CoFounderDock";
import { addMessage, setThinking, clearConversation } from "@/lib/cofounder/cofounder-store";
import { askCoFounderLive } from "@/lib/cofounder/engine";

vi.mock("@/lib/cofounder/engine", () => ({ askCoFounderLive: vi.fn() }));
vi.mock("@/lib/cofounder/nudge-snooze", () => ({ getActiveNudges: vi.fn(() => []), snoozeNudge: vi.fn() }));

import { getActiveNudges, snoozeNudge } from "@/lib/cofounder/nudge-snooze";
import type { Nudge } from "@/lib/cofounder/signals";

const RUNWAY_NUDGE: Nudge = { id: "runway", severity: "high", message: "Runway is 3 months.", actionLabel: "Review burn rate", targetModule: "burnrate" };

describe("CoFounderDock", () => {
  beforeEach(() => {
    clearConversation();
    vi.mocked(askCoFounderLive).mockReset();
    vi.mocked(getActiveNudges).mockReset().mockReturnValue([]);
    vi.mocked(snoozeNudge).mockReset();
  });

  it("starts collapsed (no chat panel) and opens on click", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    expect(screen.queryByPlaceholderText(/ask your co-founder/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /co-founder/i }));
    expect(screen.getByPlaceholderText(/ask your co-founder/i)).toBeInTheDocument();
  });

  it("sends a question through askCoFounderLive", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));

    await user.type(screen.getByPlaceholderText(/ask your co-founder/i), "what now?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(askCoFounderLive).toHaveBeenCalledWith("what now?");
  });

  it("renders conversation messages from the store", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));

    act(() => {
      addMessage({ role: "user", text: "hello" });
      addMessage({ role: "cofounder", text: "hey founder" });
    });

    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("hey founder")).toBeInTheDocument();
  });

  it("shows a thinking indicator", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));

    act(() => setThinking(true));
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it("does not send an empty question", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));

    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(askCoFounderLive).not.toHaveBeenCalled();
  });

  it("sends on Enter key", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));

    const input = screen.getByPlaceholderText(/ask your co-founder/i);
    await user.type(input, "runway?{Enter}");
    expect(askCoFounderLive).toHaveBeenCalledWith("runway?");
  });

  it("renders an error message distinctly", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));

    act(() => addMessage({ role: "cofounder", text: "Add your AI key in Settings.", error: true }));
    expect(screen.getByText("Add your AI key in Settings.")).toBeInTheDocument();
  });

  it("shows a nudge count badge on the collapsed launcher", () => {
    vi.mocked(getActiveNudges).mockReturnValue([RUNWAY_NUDGE]);
    render(<CoFounderDock />);
    expect(screen.getByRole("button", { name: /1 nudges/i })).toBeInTheDocument();
  });

  it("renders nudges and navigates on the action click", async () => {
    vi.mocked(getActiveNudges).mockReturnValue([RUNWAY_NUDGE]);
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<CoFounderDock onNavigate={onNavigate} />);
    await user.click(screen.getByRole("button", { name: /open co-founder/i }));

    expect(screen.getByText("Runway is 3 months.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /review burn rate/i }));
    expect(onNavigate).toHaveBeenCalledWith("burnrate");
  });

  it("snoozes a nudge", async () => {
    vi.mocked(getActiveNudges).mockReturnValueOnce([RUNWAY_NUDGE]).mockReturnValue([]);
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /open co-founder/i }));
    await user.click(screen.getByRole("button", { name: /snooze/i }));
    expect(snoozeNudge).toHaveBeenCalledWith("runway");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));
    expect(screen.getByPlaceholderText(/ask your co-founder/i)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText(/ask your co-founder/i)).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoFounderDock from "./CoFounderDock";
import { addMessage, setThinking, clearConversation } from "@/lib/cofounder/cofounder-store";
import { askCoFounderLive } from "@/lib/cofounder/engine";

vi.mock("@/lib/cofounder/engine", () => ({ askCoFounderLive: vi.fn() }));

describe("CoFounderDock", () => {
  beforeEach(() => {
    clearConversation();
    vi.mocked(askCoFounderLive).mockReset();
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

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<CoFounderDock />);
    await user.click(screen.getByRole("button", { name: /co-founder/i }));
    expect(screen.getByPlaceholderText(/ask your co-founder/i)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText(/ask your co-founder/i)).not.toBeInTheDocument();
  });
});

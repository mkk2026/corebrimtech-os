import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMessages, getThinking, addMessage, setThinking, clearConversation, subscribeCoFounder } from "./cofounder-store";

beforeEach(() => clearConversation());

describe("cofounder-store", () => {
  it("appends messages immutably and notifies subscribers", () => {
    const listener = vi.fn();
    const unsub = subscribeCoFounder(listener);
    const before = getMessages();
    addMessage({ role: "user", text: "hi" });
    expect(getMessages()).not.toBe(before); // new array
    expect(getMessages()).toHaveLength(1);
    expect(getMessages()[0]).toMatchObject({ role: "user", text: "hi" });
    expect(listener).toHaveBeenCalled();
    unsub();
  });

  it("tracks the thinking flag", () => {
    const listener = vi.fn();
    subscribeCoFounder(listener);
    setThinking(true);
    expect(getThinking()).toBe(true);
    setThinking(false);
    expect(getThinking()).toBe(false);
  });

  it("clears the conversation", () => {
    addMessage({ role: "user", text: "a" });
    addMessage({ role: "cofounder", text: "b" });
    clearConversation();
    expect(getMessages()).toHaveLength(0);
    expect(getThinking()).toBe(false);
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsub = subscribeCoFounder(listener);
    unsub();
    addMessage({ role: "user", text: "x" });
    expect(listener).not.toHaveBeenCalled();
  });
});

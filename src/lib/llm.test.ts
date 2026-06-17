import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoredNvidiaKey, setStoredNvidiaKey,
  getPreferredProvider, setPreferredProvider,
  getActiveProvider,
} from "./llm";

beforeEach(() => localStorage.clear());

describe("NVIDIA provider support", () => {
  it("stores and reads the NVIDIA key", () => {
    expect(getStoredNvidiaKey()).toBeUndefined();
    setStoredNvidiaKey("nvapi-xxx");
    expect(getStoredNvidiaKey()).toBe("nvapi-xxx");
    setStoredNvidiaKey("");
    expect(getStoredNvidiaKey()).toBeUndefined();
  });

  it("persists nvidia as the preferred provider", () => {
    setPreferredProvider("nvidia");
    expect(getPreferredProvider()).toBe("nvidia");
  });

  it("selects nvidia when it's preferred and a key exists", () => {
    setStoredNvidiaKey("nvapi-1");
    setPreferredProvider("nvidia");
    expect(getActiveProvider()).toEqual({ provider: "nvidia", apiKey: "nvapi-1" });
  });

  it("falls back to nvidia when it's the only key, even if claude is preferred", () => {
    setStoredNvidiaKey("nvapi-2");
    setPreferredProvider("claude");
    expect(getActiveProvider()).toEqual({ provider: "nvidia", apiKey: "nvapi-2" });
  });

  it("honors claude over nvidia when claude is preferred and both keys exist", () => {
    localStorage.setItem("cbt_os_anthropic_api_key", "sk-ant-x");
    setStoredNvidiaKey("nvapi-3");
    setPreferredProvider("claude");
    expect(getActiveProvider()).toEqual({ provider: "claude", apiKey: "sk-ant-x" });
  });

  it("returns null when no key is configured", () => {
    expect(getActiveProvider()).toBeNull();
  });
});

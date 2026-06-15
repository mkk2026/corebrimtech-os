import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("./llm", () => ({ getActiveProvider: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { getActiveProvider } from "./llm";
import { initDesktopBridge } from "./desktop-bridge";
import { registerNativeBridge, postToAI } from "./ai-transport";

declare global {
  interface Window { __TAURI__?: unknown }
}

beforeEach(() => {
  vi.mocked(invoke).mockReset();
  vi.mocked(getActiveProvider).mockReset();
  registerNativeBridge(null);
});

afterEach(() => {
  delete (window as Window).__TAURI__;
  registerNativeBridge(null);
});

describe("initDesktopBridge", () => {
  it("does nothing when not running in Tauri", async () => {
    await initDesktopBridge();
    // No bridge registered → postToAI would hit fetch; assert by checking invoke is never used.
    expect(invoke).not.toHaveBeenCalled();
  });

  it("registers a bridge that invokes ai_request with the founder's stored key injected", async () => {
    (window as Window).__TAURI__ = {};
    vi.mocked(getActiveProvider).mockReturnValue({ provider: "claude", apiKey: "sk-ant-xyz" });
    vi.mocked(invoke).mockResolvedValue({ ok: true, status: 200, data: { content: [{ type: "text", text: "ok" }] } });

    await initDesktopBridge();
    const result = await postToAI({ provider: "claude", prompt: "hi" }, { headers: {} });

    expect(invoke).toHaveBeenCalledWith("ai_request", {
      request: expect.objectContaining({ provider: "claude", apiKey: "sk-ant-xyz", prompt: "hi" }),
    });
    expect(result).toMatchObject({ ok: true, status: 200 });
  });

  it("passes an empty key when no provider is configured (Rust returns a typed 401)", async () => {
    (window as Window).__TAURI__ = {};
    vi.mocked(getActiveProvider).mockReturnValue(null);
    vi.mocked(invoke).mockResolvedValue({ ok: false, status: 401, data: {} });

    await initDesktopBridge();
    await postToAI({ provider: "claude", prompt: "hi" }, { headers: {} });

    expect(invoke).toHaveBeenCalledWith("ai_request", {
      request: expect.objectContaining({ apiKey: "" }),
    });
  });
});

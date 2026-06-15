import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isDesktop, registerNativeBridge, postToAI } from "./ai-transport";

declare global {
  interface Window { __TAURI__?: unknown }
}

afterEach(() => {
  registerNativeBridge(null);
  delete (window as Window).__TAURI__;
  vi.restoreAllMocks();
});

describe("isDesktop", () => {
  it("is false in a plain browser", () => {
    expect(isDesktop()).toBe(false);
  });
  it("is true when the Tauri global is present", () => {
    (window as Window).__TAURI__ = {};
    expect(isDesktop()).toBe(true);
  });
});

describe("postToAI", () => {
  beforeEach(() => registerNativeBridge(null));

  it("posts to the /api/ai proxy on web", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text: "hi" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await postToAI({ provider: "claude", prompt: "q" }, { headers: { "Content-Type": "application/json" } });

    expect(fetchMock).toHaveBeenCalledWith("/api/ai", expect.objectContaining({ method: "POST" }));
    expect(result).toMatchObject({ ok: true, status: 200 });
  });

  it("routes to the native bridge on desktop, never touching fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    (window as Window).__TAURI__ = {};
    const bridge = vi.fn(async () => ({ ok: true, status: 200, data: { content: [{ type: "text", text: "native" }] } }));
    registerNativeBridge(bridge);

    const result = await postToAI({ provider: "claude", prompt: "q" }, { headers: {} });

    expect(bridge).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.data).toMatchObject({ content: [{ type: "text", text: "native" }] });
  });

  it("falls back to the proxy on desktop if no bridge is registered", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    (window as Window).__TAURI__ = {};

    await postToAI({ provider: "claude" }, { headers: {} });
    expect(fetchMock).toHaveBeenCalled();
  });

  it("tolerates a non-JSON proxy response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json", { status: 502 })));
    const result = await postToAI({ provider: "claude" }, { headers: {} });
    expect(result).toMatchObject({ ok: false, status: 502, data: {} });
  });
});

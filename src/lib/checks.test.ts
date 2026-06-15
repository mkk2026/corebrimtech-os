import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
import { invoke } from "@tauri-apps/api/core";
import { checkEnv, checkLinkReachable } from "./checks";

declare global {
  interface Window { __TAURI__?: unknown }
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(invoke).mockReset();
});
afterEach(() => {
  delete (window as Window).__TAURI__;
  vi.restoreAllMocks();
});

describe("checkEnv", () => {
  it("reads the /api/check-env proxy on web", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ anthropicConfigured: true, googleConfigured: false, proxySecretConfigured: true }), { status: 200 })));
    const env = await checkEnv();
    expect(env.anthropicConfigured).toBe(true);
    expect(env.googleConfigured).toBe(false);
  });

  it("derives config from the founder's stored keys on desktop", async () => {
    (window as Window).__TAURI__ = {};
    localStorage.setItem("cbt_os_anthropic_api_key", "sk-ant-real-key-here");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const env = await checkEnv();
    expect(env.anthropicConfigured).toBe(true);
    expect(env.googleConfigured).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("checkLinkReachable", () => {
  it("rejects non-http(s) urls without any call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await checkLinkReachable("javascript:alert(1)")).toBe(false);
    expect(await checkLinkReachable("")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the proxy on web", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ active: true }), { status: 200 })));
    expect(await checkLinkReachable("https://example.com")).toBe(true);
  });

  it("returns false when the web proxy errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await checkLinkReachable("https://example.com")).toBe(false);
  });

  it("invokes the native check_link command on desktop", async () => {
    (window as Window).__TAURI__ = {};
    vi.mocked(invoke).mockResolvedValue(true);
    expect(await checkLinkReachable("https://example.com")).toBe(true);
    expect(invoke).toHaveBeenCalledWith("check_link", { url: "https://example.com" });
  });
});

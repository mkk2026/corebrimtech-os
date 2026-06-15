import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendNotification = vi.fn();
const isPermissionGranted = vi.fn();
const requestPermission = vi.fn();

vi.mock("@tauri-apps/plugin-notification", () => ({ sendNotification, isPermissionGranted, requestPermission }));

import { notify } from "./desktop-notify";

declare global {
  interface Window { __TAURI__?: unknown }
}

beforeEach(() => {
  sendNotification.mockReset();
  isPermissionGranted.mockReset();
  requestPermission.mockReset();
});
afterEach(() => { delete (window as Window).__TAURI__; });

describe("notify", () => {
  it("is a no-op on web", async () => {
    await notify("t", "b");
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sends when permission is already granted", async () => {
    (window as Window).__TAURI__ = {};
    isPermissionGranted.mockResolvedValue(true);
    await notify("Runway alert", "3 months left");
    expect(sendNotification).toHaveBeenCalledWith({ title: "Runway alert", body: "3 months left" });
  });

  it("requests permission first when not yet granted", async () => {
    (window as Window).__TAURI__ = {};
    isPermissionGranted.mockResolvedValue(false);
    requestPermission.mockResolvedValue("granted");
    await notify("t", "b");
    expect(requestPermission).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalled();
  });

  it("does not send when permission is denied", async () => {
    (window as Window).__TAURI__ = {};
    isPermissionGranted.mockResolvedValue(false);
    requestPermission.mockResolvedValue("denied");
    await notify("t", "b");
    expect(sendNotification).not.toHaveBeenCalled();
  });
});

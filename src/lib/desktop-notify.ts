/**
 * Native OS notifications (desktop only). No-op on web.
 * Used by B5 to let the co-founder reach the founder when the window is in the tray.
 */

import { isDesktop } from "./ai-transport";

export async function notify(title: string, body: string): Promise<void> {
  if (!isDesktop()) return;

  const { isPermissionGranted, requestPermission, sendNotification } = await import("@tauri-apps/plugin-notification");

  let granted = await isPermissionGranted();
  if (!granted) {
    granted = (await requestPermission()) === "granted";
  }
  if (granted) {
    sendNotification({ title, body });
  }
}

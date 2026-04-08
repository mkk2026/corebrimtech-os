// Global toast for errors and success messages. Any component can call showToast().
// Page subscribes and renders the toast.

export type ToastPayload = { message: string; error?: boolean };

const EVENT_NAME = "cbt-toast";

export function showToast(message: string, error = false): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT_NAME, { detail: { message, error } }));
}

export function subscribeToToast(callback: (payload: ToastPayload) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<ToastPayload>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

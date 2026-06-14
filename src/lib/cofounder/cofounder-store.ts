/**
 * Co-founder conversation store — pub/sub the dock UI subscribes to.
 * Mirrors the toast / seed-scan store pattern. Messages are held in memory for the session.
 */

export interface CoFounderMessage {
  id: string;
  role: "user" | "cofounder";
  text: string;
  at: string;
  error?: boolean;
}

type Listener = () => void;

let messages: CoFounderMessage[] = [];
let thinking = false;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

export function getMessages(): readonly CoFounderMessage[] {
  return messages;
}

export function getThinking(): boolean {
  return thinking;
}

export function addMessage(msg: Pick<CoFounderMessage, "role" | "text"> & { error?: boolean }): CoFounderMessage {
  const full: CoFounderMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    at: new Date().toISOString(),
    ...msg,
  };
  messages = [...messages, full]; // immutable append
  notify();
  return full;
}

export function setThinking(value: boolean): void {
  thinking = value;
  notify();
}

export function clearConversation(): void {
  messages = [];
  thinking = false;
  notify();
}

export function subscribeCoFounder(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

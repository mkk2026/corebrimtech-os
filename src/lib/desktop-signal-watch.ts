/**
 * Background signal watcher (desktop only).
 *
 * Periodically runs the proactive signal engine (A4) and fires a native notification for each NEW
 * high-severity nudge — so the co-founder can reach the founder even when the window is in the tray.
 * Relies on B4's close-to-tray keeping the webview (and this interval) alive.
 *
 * Dedup: each nudge id is notified at most once per session; snoozed nudges are already excluded by
 * getActiveNudges().
 */

import { isDesktop } from "./ai-transport";
import { getActiveNudges } from "./cofounder/nudge-snooze";
import { notify } from "./desktop-notify";
import type { Nudge } from "./cofounder/signals";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const sessionNotified = new Set<string>();
let timer: ReturnType<typeof setInterval> | null = null;

export function shouldNotify(nudge: Nudge, alreadyNotified: Set<string>): boolean {
  return nudge.severity === "high" && !alreadyNotified.has(nudge.id);
}

interface TickDeps {
  getNudges?: () => Nudge[];
  send?: (title: string, body: string) => Promise<void>;
  seen?: Set<string>;
}

export async function runSignalTick(deps: TickDeps = {}): Promise<void> {
  const getNudges = deps.getNudges ?? getActiveNudges;
  const send = deps.send ?? notify;
  const seen = deps.seen ?? sessionNotified;

  for (const nudge of getNudges()) {
    if (shouldNotify(nudge, seen)) {
      seen.add(nudge.id);
      await send("Your co-founder", nudge.message);
    }
  }
}

/** Start the periodic watch (desktop only). Returns a stop function. */
export function startSignalWatch(intervalMs = DEFAULT_INTERVAL_MS): () => void {
  if (!isDesktop()) return () => {};

  void runSignalTick(); // check once on startup
  timer = setInterval(() => void runSignalTick(), intervalMs);

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

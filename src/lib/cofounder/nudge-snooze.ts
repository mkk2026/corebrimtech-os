/**
 * Nudge snooze state — so the co-founder doesn't nag. A snoozed nudge id is hidden until its
 * expiry (24h). Backed by localStorage; tolerant of corrupt data.
 */

import { detectSignalsLive, type Nudge } from "./signals";

const KEY = "cbt_os_nudge_snooze";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

type SnoozeMap = Record<string, number>; // nudge id → snoozed-until epoch ms

function load(): SnoozeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SnoozeMap) : {};
  } catch {
    return {};
  }
}

function save(map: SnoozeMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function snoozeNudge(id: string): void {
  save({ ...load(), [id]: Date.now() + SNOOZE_MS });
}

export function isSnoozed(id: string): boolean {
  const until = load()[id];
  return typeof until === "number" && Date.now() < until;
}

/** Live nudges with snoozed ones filtered out. */
export function getActiveNudges(): Nudge[] {
  return detectSignalsLive().filter((n) => !isSnoozed(n.id));
}

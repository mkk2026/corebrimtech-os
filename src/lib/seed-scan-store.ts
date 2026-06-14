/**
 * Seed-scan status store — the single source of truth the Command Center banner
 * subscribes to. Tiny pub/sub, mirroring the toast store pattern.
 *
 *   idle ──(key & company)──▶ researching ──found──▶ found(n) ──dismiss──▶ idle
 *    │                            │
 *    └──(no key)──▶ needs-key     └──error──▶ failed ──Retry──▶ researching
 */

export type SeedStatus =
  | { phase: "idle" }
  | { phase: "needs-key" }
  | { phase: "researching"; message: string }
  | { phase: "found"; competitors: number; gaps: number }
  | { phase: "failed"; reason: string };

type Listener = (status: SeedStatus) => void;

let current: SeedStatus = { phase: "idle" };
const listeners = new Set<Listener>();

export function getSeedStatus(): SeedStatus {
  return current;
}

export function setSeedStatus(status: SeedStatus): void {
  current = status;
  listeners.forEach((l) => l(status));
}

export function subscribeSeedStatus(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Minimal feature flags. Resolution order (first match wins):
 *   1. Build-time env kill switch (NEXT_PUBLIC_AUTO_RESEARCH=off) — no redeploy needed to flip,
 *      just change the env var and the next deploy/runtime read disables it.
 *   2. Per-browser localStorage override (for canary / self-serve opt-out).
 *   3. Default.
 *
 * Lets the money-spending auto-research scan be killed instantly if it misbehaves.
 */

export type FeatureFlag = "autoResearch";

const DEFAULTS: Record<FeatureFlag, boolean> = {
  autoResearch: true,
};

const STORAGE_PREFIX = "cbt_os_flag_";

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  if (flag === "autoResearch" && process.env.NEXT_PUBLIC_AUTO_RESEARCH === "off") {
    return false;
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_PREFIX + flag);
    if (stored === "true") return true;
    if (stored === "false") return false;
  }
  return DEFAULTS[flag];
}

export function setFeatureEnabled(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + flag, String(enabled));
}

"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, AlertTriangle, KeyRound, X } from "lucide-react";
import { getSeedStatus, setSeedStatus, subscribeSeedStatus, type SeedStatus } from "@/lib/seed-scan-store";
import { seedAutoResearchLive } from "@/lib/auto-research";

/**
 * App-wide status surface for the onboarding auto-research seed scan.
 * Subscribes to the seed-scan store and renders nothing when idle.
 */
export default function SeedScanBanner() {
  const [status, setStatus] = useState<SeedStatus>(() => getSeedStatus());

  useEffect(() => subscribeSeedStatus(setStatus), []);

  if (status.phase === "idle") return null;

  const base =
    "flex items-center gap-2 px-4 py-2 text-sm border-b flex-shrink-0";

  if (status.phase === "researching") {
    return (
      <div className={`${base} bg-blue-950/40 border-blue-500/20 text-blue-200`} role="status" aria-live="polite">
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        <span className="truncate">{status.message}</span>
      </div>
    );
  }

  if (status.phase === "found") {
    const parts = [
      status.competitors > 0 && `${status.competitors} competitor${status.competitors === 1 ? "" : "s"}`,
      status.gaps > 0 && `${status.gaps} market gap${status.gaps === 1 ? "" : "s"}`,
    ].filter(Boolean);
    return (
      <div className={`${base} bg-emerald-950/40 border-emerald-500/20 text-emerald-200`} role="status" aria-live="polite">
        <Sparkles className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">
          {parts.length ? `While you set up, I found ${parts.join(" and ")} in your space.` : "Research complete — no new signal yet."}
        </span>
        <button
          type="button"
          onClick={() => setSeedStatus({ phase: "idle" })}
          aria-label="Dismiss"
          className="ml-auto text-emerald-300/70 hover:text-emerald-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status.phase === "needs-key") {
    return (
      <div className={`${base} bg-amber-950/40 border-amber-500/20 text-amber-200`} role="status">
        <KeyRound className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">Add your AI key in Settings to unlock auto-research.</span>
        <button
          type="button"
          onClick={() => setSeedStatus({ phase: "idle" })}
          aria-label="Dismiss"
          className="ml-auto text-amber-300/70 hover:text-amber-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // failed
  return (
    <div className={`${base} bg-red-950/40 border-red-500/20 text-red-200`} role="alert">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">Research failed: {status.reason}</span>
      <button
        type="button"
        onClick={() => void seedAutoResearchLive()}
        className="ml-auto text-red-100 font-medium hover:underline flex-shrink-0"
      >
        Retry
      </button>
    </div>
  );
}

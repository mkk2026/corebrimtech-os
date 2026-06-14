"use client";

import { Cpu } from "lucide-react";
import { getBrain } from "@/lib/founder-brain";

interface FounderBrainNudgeProps {
  onNavigate?: (module: string) => void;
  className?: string;
}

export default function FounderBrainNudge({ onNavigate, className = "" }: FounderBrainNudgeProps) {
  const brain = getBrain();
  if (!brain) return null;
  // Show while setup is incomplete, OR after a "Skip for now" — setupComplete but the
  // profile is still essentially empty (no founders, no tagline/mission).
  const isSparse =
    brain.founders.length === 0 && !brain.companyTagline?.trim() && !brain.companyMission?.trim();
  if (brain.setupComplete && !isSparse) return null;

  return (
    <div
      className={`rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 flex items-start gap-3 ${className}`}
      role="alert"
    >
      <Cpu className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-200">Complete Founder Brain first</p>
        <p className="text-xs text-amber-200/80 mt-1">
          Proposals, grants, and outreach are personalized using your company and founder details. Set them up once to get better results everywhere.
        </p>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("brain")}
            className="mt-3 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            Go to Founder Brain
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { syncFromSupabase, getSyncStatus, isSupabaseConfigured } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import HomeCommand from "@/components/home/HomeCommand";
import FounderBrainModule from "@/components/brain/FounderBrain";
import ResearchEngine from "@/components/research/ResearchEngine";
import GoalsOKRs from "@/components/goals/GoalsOKRs";
import BurnRateTracker from "@/components/money/BurnRateTracker";
import DealPipeline from "@/components/money/DealPipeline";
import SettingsPanel from "@/components/settings/SettingsPanel";
import Onboarding from "@/components/onboarding/Onboarding";
import SeedScanBanner from "@/components/home/SeedScanBanner";
import CoFounderDock from "@/components/cofounder/CoFounderDock";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { initDesktopBridge } from "@/lib/desktop-bridge";
import { startSignalWatch } from "@/lib/desktop-signal-watch";
import { showToast, subscribeToToast } from "@/lib/toast";
import type { SyncStatus } from "@/lib/supabase";
import { getBrain } from "@/lib/founder-brain";

function formatSyncTime(iso: string | null): string {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function SyncStatusBar({ status, onRetry, isConfigured }: { status: SyncStatus; onRetry: () => Promise<unknown>; isConfigured: boolean }) {
  if (!isConfigured) {
    return <span className="text-xs text-neutral-600 font-mono" title="Supabase not configured">Offline</span>;
  }
  if (status.syncing) {
    return <span className="text-xs text-amber-400/80 font-mono">Syncing...</span>;
  }
  if (status.error) {
    return (
      <button
        type="button"
        onClick={() => void onRetry()}
        className="text-xs text-red-400/90 font-mono hover:text-red-300 transition-colors"
        title={status.error}
      >
        Sync failed · Retry
      </button>
    );
  }
  const label = status.lastSync ? `Synced ${formatSyncTime(status.lastSync)}` : "Synced";
  return <span className="text-xs text-neutral-600 font-mono" title={status.lastSync || undefined}>{label}</span>;
}

const LABELS: Record<string, string> = {
  home:     "Command Center",
  brain:    "Founder Brain",
  goals:    "Goals & OKRs",
  burnrate: "Burn Rate & Runway",
  pipeline: "Deal Pipeline",
  research: "Research",
  settings: "Settings",
};

const BADGES: Record<string, { label: string; color: string }> = {
  home:     { label: "Live",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  brain:    { label: "Foundation",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  goals:    { label: "OKR System",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  burnrate: { label: "Runway",      color: "text-red-400 bg-red-400/10 border-red-400/20" },
  pipeline: { label: "Sales CRM",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  research: { label: "Market Intel", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  settings: { label: "Config",      color: "text-neutral-400 bg-neutral-800 border-neutral-700" },
};

const VALID_MODULES = new Set(Object.keys(LABELS));

function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleFromUrl = searchParams.get("module");
  const initialModule = moduleFromUrl && VALID_MODULES.has(moduleFromUrl) ? moduleFromUrl : "home";
  const [active, setActive] = useState(initialModule);

  useEffect(() => {
    const m = searchParams.get("module");
    if (m && VALID_MODULES.has(m)) {
      setActive(prev => prev !== m ? m : prev);
    }
  }, [searchParams]);

  const handleModuleChange = useCallback((id: string) => {
    setActive(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("module", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    const brain = getBrain();
    return !brain || !brain.setupComplete;
  });
  // Hydration gate: avoid an onboarding/app flash before client state is known.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // On the desktop build, route AI calls through the native bridge instead of /api/ai.
  useEffect(() => { void initDesktopBridge(); }, []);

  // On desktop, watch for high-severity signals and fire native notifications (no-op on web).
  useEffect(() => startSignalWatch(), []);
  const [syncStatus, setSyncStatusState] = useState(() => getSyncStatus());
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);

  const runSync = useCallback(async (options?: { skipToast?: boolean }) => {
    setSyncStatusState(getSyncStatus());
    const result = await syncFromSupabase();
    setSyncStatusState(getSyncStatus());
    if (!options?.skipToast) {
      if (result.success) showToast("Synced from cloud", false);
      else if (isSupabaseConfigured()) showToast("Sync failed. Check connection or retry.", true);
    }
    return result;
  }, []);

  useEffect(() => {
    // Initial sync on mount - runs once
    runSync({ skipToast: true }).catch(() => {
      // Sync failure is handled by the sync function itself
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const unsub = subscribeToToast(({ message, error }) => {
      setToast({ message, error: error ?? false });
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setToast(null), 4000);
    });
    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, []);

  function render() {
    switch (active) {
      case "home":          return <HomeCommand onNavigate={handleModuleChange} />;
      case "brain":         return <FounderBrainModule />;
      case "goals":         return <GoalsOKRs />;
      case "burnrate":      return <BurnRateTracker />;
      case "pipeline":      return <DealPipeline />;
      case "research":      return <ResearchEngine />;
      case "settings":      return <SettingsPanel />;
      default:              return <HomeCommand onNavigate={handleModuleChange} />;
    }
  }

  const badge = BADGES[active];

  if (!mounted) {
    return <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-500 text-sm">Loading...</div>;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="flex h-screen bg-neutral-950 overflow-hidden">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg border text-sm font-medium shadow-lg ${
            toast.error ? "bg-red-950/90 border-red-500/30 text-red-200" : "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
          }`}
        >
          {toast.message}
        </div>
      )}
      <Sidebar activeModule={active} onModuleChange={handleModuleChange} />
      <div className="flex-1 flex flex-col overflow-hidden pt-[52px] lg:pt-0">
        <div className="border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0 bg-neutral-950">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-bold text-neutral-200 truncate">{LABELS[active] || active}</h1>
            {badge && (
              <span className={`text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0 hidden sm:inline-block ${badge.color}`}>{badge.label}</span>
            )}
          </div>
          <SyncStatusBar status={syncStatus} onRetry={runSync} isConfigured={isSupabaseConfigured()} />
        </div>
        <SeedScanBanner />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">{render()}</div>
        </div>
      </div>
      {isFeatureEnabled("coFounder") && <CoFounderDock onNavigate={handleModuleChange} />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-500 text-sm">Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}

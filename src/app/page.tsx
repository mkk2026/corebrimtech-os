"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { syncFromSupabase, getSyncStatus, isSupabaseConfigured } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import HomeCommand from "@/components/home/HomeCommand";
import TodayView from "@/components/today/TodayView";
import FounderBrainModule from "@/components/brain/FounderBrain";
import CompetitorIntelligence from "@/components/intelligence/CompetitorIntelligence";
import MarketGapScanner from "@/components/intelligence/MarketGapScanner";
import ResearchEngine from "@/components/research/ResearchEngine";
import HackathonBuilder from "@/components/hackathon/HackathonBuilder";
import HackathonScout from "@/components/hackathon/HackathonScout";
import GoalsOKRs from "@/components/goals/GoalsOKRs";
import SessionBrain from "@/components/session/SessionBrain";
import MeetingPrep from "@/components/session/MeetingPrep";
import EnergyTracker from "@/components/session/EnergyTracker";
import IdeaIntelligence from "@/components/ideas/IdeaIntelligence";
import DecisionJournal from "@/components/brain/DecisionJournal";
import BurnRateTracker from "@/components/money/BurnRateTracker";
import DealPipeline from "@/components/money/DealPipeline";
import FocusMode from "@/components/focus/FocusMode";
import MoneyDashboard from "@/components/money/MoneyDashboard";
import GrantTracker from "@/components/money/GrantTracker";
import InvoiceGenerator from "@/components/money/InvoiceGenerator";
import SkillEngineUI from "@/components/skills/SkillEngineUI";
import AwayMode from "@/components/skills/AwayMode";
import WeeklyReport from "@/components/reports/WeeklyReport";
import WeeklyReview from "@/components/reports/WeeklyReview";
import InvestorView from "@/components/reports/InvestorView";
import ProposalGenerator from "@/components/money/ProposalGenerator";
import RevenueAgent from "@/components/intelligence/RevenueAgent";
import APICostOptimizer from "@/components/optimizer/APICostOptimizer";
import SettingsPanel from "@/components/settings/SettingsPanel";
import { PortfolioWins, KnowledgeBase, SOPsPlaybooks, NotificationCenter, SchedulerPanel, EmailTemplates, DataExport } from "@/components/extras/AllExtras";
import AutonomousOutreach from "@/components/intelligence/AutonomousOutreach";
import Onboarding from "@/components/onboarding/Onboarding";
import { generateSystemNotifications, getUnreadCount } from "@/lib/support";
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
  today:         "Today",
  home:          "Command Center",
  brain:         "Founder Brain",
  competitor:    "Competitor Intel Engine",
  marketgaps:    "Market Gap Scanner",
  research:      "Deep Research Engine",
  hackathon:     "Hackathon Builder Agent",
  scout:         "Hackathon Auto-Scout",
  goals:         "Goals & OKRs",
  session:       "Session Brain",
  meetings:      "Meeting Prep",
  decisions:     "Decision Journal",
  burnrate:      "Burn Rate Tracker",
  pipeline:      "Deal Pipeline",
  proposals:     "Proposal Generator",
  energy:        "Energy Tracker",
  weeklyreview:  "Weekly Review",
  revenueagent:  "Revenue Agent",
  ideas:         "Idea Intelligence",
  focus:         "Focus Mode",
  revenue:       "Revenue & Client Pipeline",
  grants:        "Grant Tracker",
  invoices:      "Invoice Generator",
  skills:        "Skill Engine",
  outreach:      "Auto-Outreach",
  away:          "Away Mode",
  portfolio:     "Portfolio & Wins",
  knowledge:     "Knowledge Base",
  sops:          "SOPs & Playbooks",
  notifications: "Notification Center",
  scheduler:     "Scheduler",
  templates:     "Email Templates",
  export:        "Data Export",
  reports:       "Weekly Founder Report",
  investor:      "Investor View",
  optimizer:     "API Cost Optimizer",
  settings:      "Settings",
};

const BADGES: Record<string, { label: string; color: string }> = {
  today:         { label: "Focus",          color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  home:          { label: "Live",           color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  brain:         { label: "Foundation",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  competitor:    { label: "Intelligence",   color: "text-red-400 bg-red-400/10 border-red-400/20" },
  marketgaps:    { label: "Opportunities",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  research:      { label: "500+ Sources",   color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  hackathon:     { label: "Agent",          color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  scout:         { label: "Auto-Scan",      color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  goals:         { label: "OKR System",     color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  session:       { label: "Context Engine", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  meetings:      { label: "Auto-Research",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  decisions:     { label: "Learn Patterns", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  burnrate:      { label: "Runway Calc",    color: "text-red-400 bg-red-400/10 border-red-400/20" },
  pipeline:      { label: "Sales CRM",      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  proposals:     { label: "AI Generator",   color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
  energy:        { label: "Productivity",   color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  weeklyreview:  { label: "Reflection",     color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  revenueagent:  { label: "24/7 AI",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  ideas:         { label: "AI Scored",      color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  focus:         { label: "Deep Work",      color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  revenue:       { label: "Money Layer",    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  grants:        { label: "10 Curated",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  invoices:      { label: "Get Paid",       color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  skills:        { label: "Autonomous",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  outreach:      { label: "AI Outreach",    color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  away:          { label: "Away Mode",      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  portfolio:     { label: "Track Record",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  knowledge:     { label: "Institutional",  color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  sops:          { label: "3 Playbooks",    color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  notifications: { label: "Smart Alerts",   color: "text-red-400 bg-red-400/10 border-red-400/20" },
  scheduler:     { label: "Cron Jobs",      color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  templates:     { label: "6 Built-in",     color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
  export:        { label: "Your Data",      color: "text-neutral-400 bg-neutral-800 border-neutral-700" },
  reports:       { label: "Auto-Generated", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  investor:      { label: "Shareable",      color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  optimizer:     { label: "Cost Control",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  settings:      { label: "Config",         color: "text-neutral-400 bg-neutral-800 border-neutral-700" },
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
    generateSystemNotifications();
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
      case "today":         return <TodayView onNavigate={handleModuleChange} />;
      case "home":          return <HomeCommand onNavigate={handleModuleChange} />;
      case "brain":         return <FounderBrainModule />;
      case "competitor":    return <CompetitorIntelligence />;
      case "marketgaps":    return <MarketGapScanner />;
      case "research":      return <ResearchEngine />;
      case "hackathon":     return <HackathonBuilder />;
      case "scout":         return <HackathonScout />;
      case "goals":         return <GoalsOKRs />;
      case "session":       return <SessionBrain />;
      case "meetings":      return <MeetingPrep />;
      case "decisions":     return <DecisionJournal />;
      case "burnrate":      return <BurnRateTracker />;
      case "pipeline":      return <DealPipeline />;
      case "proposals":     return <ProposalGenerator />;
      case "energy":        return <EnergyTracker />;
      case "weeklyreview":  return <WeeklyReview />;
      case "revenueagent":  return <RevenueAgent />;
      case "ideas":         return <IdeaIntelligence />;
      case "focus":         return <FocusMode />;
      case "revenue":       return <MoneyDashboard onNavigate={handleModuleChange} />;
      case "grants":        return <GrantTracker onNavigate={handleModuleChange} />;
      case "invoices":      return <InvoiceGenerator />;
      case "skills":        return <SkillEngineUI onNavigate={handleModuleChange} />;
      case "outreach":      return <AutonomousOutreach />;
      case "away":          return <AwayMode />;
      case "portfolio":     return <PortfolioWins />;
      case "knowledge":     return <KnowledgeBase />;
      case "sops":          return <SOPsPlaybooks />;
      case "notifications": return <NotificationCenter />;
      case "scheduler":     return <SchedulerPanel />;
      case "templates":     return <EmailTemplates />;
      case "export":        return <DataExport />;
      case "reports":       return <WeeklyReport />;
      case "investor":      return <InvestorView />;
      case "optimizer":     return <APICostOptimizer />;
      case "settings":      return <SettingsPanel />;
      default:              return <HomeCommand onNavigate={handleModuleChange} />;
    }
  }

  const badge = BADGES[active];

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
      <Sidebar activeModule={active} onModuleChange={handleModuleChange} unreadNotifications={getUnreadCount()} />
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">{render()}</div>
        </div>
      </div>
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

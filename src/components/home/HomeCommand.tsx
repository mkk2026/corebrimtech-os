"use client";

import { useEffect, useState } from "react";
import { Cpu, Target, Flame, TrendingUp, Search, ArrowRight, Bot } from "lucide-react";
import { getBrain } from "@/lib/founder-brain";
import { getBurnStats } from "@/lib/burn-rate";
import { getPipelineStats } from "@/lib/deal-pipeline";
import { getGoalStats } from "@/lib/goals";
import { getLibrary } from "@/lib/research-storage";

interface HomeCommandProps {
  onNavigate?: (module: string) => void;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function HomeCommand({ onNavigate }: HomeCommandProps) {
  const [brain, setBrain] = useState(() => getBrain());
  const [burn, setBurn] = useState(() => getBurnStats());
  const [pipeline, setPipeline] = useState(() => getPipelineStats());
  const [goals, setGoals] = useState(() => getGoalStats());
  const [researchCount, setResearchCount] = useState(0);

  useEffect(() => {
    setBrain(getBrain());
    setBurn(getBurnStats());
    setPipeline(getPipelineStats());
    setGoals(getGoalStats());
    setResearchCount(getLibrary().length);
  }, []);

  const founderName = brain?.founders?.[0]?.name?.split(" ")[0] ?? "";
  const companyName = brain?.companyName ?? "";

  const stats = [
    {
      label: "Runway",
      value: burn.isProfitable ? "Profitable" : burn.runwayMonths > 0 ? `${burn.runwayMonths} mo` : "—",
      sub: burn.monthlyBurn > 0 ? `${formatMoney(burn.monthlyBurn)}/mo burn` : "Set up burn rate",
      color: burn.isProfitable ? "text-emerald-400" : burn.runwayMonths > 0 && burn.runwayMonths <= 4 ? "text-red-400" : "text-neutral-300",
      icon: Flame,
      module: "burnrate",
    },
    {
      label: "Pipeline",
      value: pipeline.totalValue > 0 ? formatMoney(pipeline.totalValue) : "—",
      sub: pipeline.totalDeals > 0 ? `${pipeline.totalDeals} active deals` : "Add your first deal",
      color: "text-emerald-400",
      icon: TrendingUp,
      module: "pipeline",
    },
    {
      label: "Goals",
      value: goals.active > 0 ? `${goals.avgProgress}%` : "—",
      sub: goals.active > 0 ? `${goals.active} active · ${goals.atRisk} at risk` : "Set your goals",
      color: goals.atRisk > 0 ? "text-amber-400" : "text-blue-400",
      icon: Target,
      module: "goals",
    },
    {
      label: "Research",
      value: researchCount > 0 ? String(researchCount) : "—",
      sub: researchCount > 0 ? "reports in library" : "Research your market",
      color: "text-blue-400",
      icon: Search,
      module: "research",
    },
  ];

  const quickLinks = [
    { module: "brain", label: "Founder Brain", desc: "Your company context", icon: Cpu },
    { module: "burnrate", label: "Burn Rate", desc: "Track your runway", icon: Flame },
    { module: "pipeline", label: "Deal Pipeline", desc: "Manage deals", icon: TrendingUp },
    { module: "research", label: "Research", desc: "Understand your market", icon: Search },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black text-neutral-100">
            {founderName ? `Welcome back, ${founderName}.` : "Welcome back."}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {companyName ? companyName : "Set up your Founder Brain to personalize your OS."}
            {" · "}Your AI co-founder is one click away (bottom-right).
          </p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onNavigate?.(s.module)}
              className="text-left bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">{s.label}</span>
              </div>
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-neutral-600 mt-1">{s.sub}</div>
            </button>
          ))}
        </div>

        {/* Co-founder prompt */}
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-200">Ask your co-founder</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              &ldquo;What should I focus on this week?&rdquo; — grounded in your real runway, deals, and goals.
              Open it from the amber button, bottom-right.
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Jump to</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((q) => (
              <button
                key={q.module}
                type="button"
                onClick={() => onNavigate?.(q.module)}
                className="group flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors text-left"
              >
                <q.icon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-neutral-200">{q.label}</div>
                  <div className="text-xs text-neutral-600">{q.desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

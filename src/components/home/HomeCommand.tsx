"use client";

import { useEffect, useState } from "react";
import {
  Zap, Brain, Target, DollarSign, Shield, Code2, TrendingUp,
  Clock, Lightbulb, CheckCircle, AlertCircle, ArrowRight,
  Trophy, BookOpen, Star
} from "lucide-react";
import { getBrain, getTotalMetrics } from "@/lib/founder-brain";
import { getActiveSession, getPendingTasks, getSessionStats } from "@/lib/session-brain";
import { getTopIdeas } from "@/lib/idea-intelligence";
import { getGrantStats } from "@/lib/grant-tracker";
import { getRevenueStats, getPipelineStats } from "@/lib/money";
import { getLibrary } from "@/lib/research-storage";
import { getGoalStats } from "@/lib/goals";

function formatMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function timeOfDay(): { greeting: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { greeting: "Good morning", emoji: "🌅" };
  if (h < 17) return { greeting: "Good afternoon", emoji: "☀️" };
  return { greeting: "Good evening", emoji: "🌙" };
}

interface Alert {
  id: string;
  type: "action" | "info" | "win";
  message: string;
  module: string;
  urgent: boolean;
}

export default function HomeCommand({ onNavigate }: { onNavigate: (module: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [brain, setBrain] = useState<ReturnType<typeof getBrain>>(null);
  const [sessionStats, setSessionStats] = useState(getSessionStats());
  const [activeSession, setActiveSession] = useState(getActiveSession());
  const [topIdeas, setTopIdeas] = useState(getTopIdeas(3));
  const [grantStats, setGrantStats] = useState(getGrantStats());
  const [revenueStats, setRevenueStats] = useState(getRevenueStats());
  const [pipelineStats, setPipelineStats] = useState(getPipelineStats());
  const [pendingTasks, setPendingTasks] = useState(getPendingTasks());
  const [researchCount, setResearchCount] = useState(0);
  const [goalStats, setGoalStats] = useState(getGoalStats());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { greeting, emoji } = timeOfDay();

  useEffect(() => {
    setGoalStats(getGoalStats());
    const b = getBrain();
    setBrain(b);
    setResearchCount(getLibrary().length);

    // Generate smart alerts
    const newAlerts: Alert[] = [];
    const tasks = getPendingTasks();
    const gs = getGrantStats();
    const rs = getRevenueStats();
    const ps = getPipelineStats();

    if (!b || !b.setupComplete) {
      newAlerts.push({ id: "brain_setup", type: "action", message: "Complete Founder Brain setup — the OS needs to know who you are", module: "brain", urgent: true });
    }
    if (tasks.length > 5) {
      newAlerts.push({ id: "tasks", type: "action", message: `${tasks.length} pending tasks — pick one and focus on it now`, module: "session", urgent: false });
    }
    if (gs.applying === 0 && gs.total > 0) {
      newAlerts.push({ id: "grants", type: "action", message: `${gs.watching} grants waiting — start applying for free money`, module: "grants", urgent: false });
    }
    if (ps.activeDeals > 0) {
      newAlerts.push({ id: "pipeline", type: "info", message: `${ps.activeDeals} active deals worth ${formatMoney(ps.pipelineValue)} in pipeline — follow up`, module: "clients", urgent: false });
    }
    if (rs.thisMonth > 0) {
      newAlerts.push({ id: "revenue_win", type: "win", message: `${formatMoney(rs.thisMonth)} earned this month. Keep pushing.`, module: "revenue", urgent: false });
    }
    if (getLibrary().length === 0) {
      newAlerts.push({ id: "research", type: "action", message: "Run your first deep research report — know your market", module: "research", urgent: false });
    }

    setAlerts(newAlerts);
    setLoaded(true);
  }, []);

  const metrics = getTotalMetrics();
  const founderName = brain?.founders?.[0]?.name?.split(" ")?.[0] || "Founder";

  const QUICK_MODULES = [
    { id: "session", label: "Start Session", icon: Brain, color: "text-amber-400 bg-amber-400/10 border-amber-400/20", desc: "Begin focused work" },
    { id: "hackathon", label: "Build Hackathon", icon: Code2, color: "text-blue-400 bg-blue-400/10 border-blue-400/20", desc: "Win prize money" },
    { id: "grants", label: "Check Grants", icon: Trophy, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", desc: "Free funding" },
    { id: "research", label: "Deep Research", icon: BookOpen, color: "text-purple-400 bg-purple-400/10 border-purple-400/20", desc: "Know everything" },
    { id: "competitor", label: "Run Intel", icon: Shield, color: "text-red-400 bg-red-400/10 border-red-400/20", desc: "Watch competitors" },
    { id: "ideas", label: "Capture Idea", icon: Lightbulb, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", desc: "Never lose an idea" },
    { id: "goals", label: "View Goals", icon: Target, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", desc: "Track OKRs" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-black text-neutral-100">
              {emoji} {greeting}, {founderName}.
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {activeSession && (
                <span className="ml-3 text-emerald-400 font-mono">
                  · Session active: {activeSession.title}
                </span>
              )}
            </p>
          </div>
          {brain && (
            <div className="text-right">
              <div className="text-xs font-mono text-neutral-600">{brain.companyName}</div>
              <div className="text-xs font-mono text-amber-400">{brain.stage.replace("-", " ").toUpperCase()}</div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map(alert => (
              <button
                key={alert.id}
                onClick={() => onNavigate(alert.module)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all hover:opacity-90 ${
                  alert.type === "win"
                    ? "bg-emerald-400/5 border-emerald-400/20"
                    : alert.urgent
                    ? "bg-red-400/5 border-red-400/20"
                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {alert.type === "win"
                  ? <Trophy className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : alert.urgent
                  ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  : <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                }
                <span className={`text-sm flex-1 ${alert.type === "win" ? "text-emerald-300" : alert.urgent ? "text-red-300" : "text-neutral-300"}`}>
                  {alert.message}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Money snapshot */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "This Month", value: formatMoney(revenueStats.thisMonth), sub: revenueStats.growth !== 0 ? `${revenueStats.growth > 0 ? "+" : ""}${revenueStats.growth}% vs last month` : "First month", color: "text-emerald-400", icon: DollarSign },
            { label: "All Time Revenue", value: formatMoney(revenueStats.allTime), sub: `${revenueStats.entryCount} entries`, color: "text-amber-400", icon: TrendingUp },
            { label: "Grant Potential", value: formatMoney(grantStats.potential), sub: `${grantStats.applying} applications active`, color: "text-blue-400", icon: Trophy },
            { label: "Pipeline Value", value: formatMoney(pipelineStats.pipelineValue), sub: `${pipelineStats.activeDeals} active deals`, color: "text-purple-400", icon: Target },
          ].map(({ label, value, sub, color, icon: Icon }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <Icon className="w-4 h-4 text-neutral-700 mb-2" />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-0.5">{label}</div>
              <div className="text-xs text-neutral-700 mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Quick launch */}
        <div>
          <div className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-3">Quick Launch</div>
          <div className="grid grid-cols-6 gap-2">
            {QUICK_MODULES.map(({ id, label, icon: Icon, color, desc }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="flex flex-col items-center gap-2 p-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-xl transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-neutral-300 text-center">{label}</span>
                <span className="text-xs text-neutral-700 text-center">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Three column: Tasks, Ideas, Sessions */}
        <div className="grid grid-cols-3 gap-4">

          {/* Pending tasks */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Next Tasks</span>
              <button onClick={() => onNavigate("session")} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">View all →</button>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-neutral-700">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      task.priority === "high" ? "bg-red-400" :
                      task.priority === "medium" ? "bg-amber-400" : "bg-neutral-600"
                    }`} />
                    <span className="text-xs text-neutral-400 truncate">{task.text}</span>
                  </div>
                ))}
                {pendingTasks.length > 5 && (
                  <p className="text-xs text-neutral-700">+{pendingTasks.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Top ideas */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Top Ideas</span>
              <button onClick={() => onNavigate("ideas")} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">View all →</button>
            </div>
            {topIdeas.length === 0 ? (
              <p className="text-xs text-neutral-700">No ideas captured yet</p>
            ) : (
              <div className="space-y-2">
                {topIdeas.map((idea, i) => (
                  <div key={idea.id} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-700 w-4">{i + 1}.</span>
                    <span className="text-xs text-neutral-400 flex-1 truncate">{idea.title}</span>
                    <span className="text-xs font-mono text-amber-400">{idea.totalScore}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OS Stats */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">OS Stats</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Sessions this week", value: sessionStats.sessionsThisWeek },
                { label: "Total sessions", value: sessionStats.totalSessions },
                { label: "Decisions made", value: sessionStats.totalDecisions },
                { label: "Research reports", value: researchCount },
                { label: "Products tracked", value: metrics.totalProducts },
                { label: "Grants tracking", value: grantStats.total },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-600">{label}</span>
                  <span className="text-xs font-mono font-bold text-neutral-400">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-neutral-800 font-mono">
            CORE BRIM TECH OS · {brain?.companyName || "Core Brim Tech"} · Freetown, Sierra Leone 🇸🇱
          </p>
        </div>

      </div>
    </div>
  );
}

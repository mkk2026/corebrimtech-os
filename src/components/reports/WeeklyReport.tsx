"use client";

import { useState, useEffect } from "react";
import { BarChart2, Download, RefreshCw, TrendingUp, Brain, Target, Lightbulb, BookOpen, Clock } from "lucide-react";
import { getAllSessions, getPendingTasks, getDecisions } from "@/lib/session-brain";
import { getIdeas } from "@/lib/idea-intelligence";
import { getLibrary } from "@/lib/research-storage";

interface WeeklyReport {
  weekOf: string;
  generatedAt: string;
  totalSessions: number;
  totalFocusTime: string;
  tasksCompleted: number;
  tasksPending: number;
  decisionsCount: number;
  ideasCaptured: number;
  researchDone: number;
  sessionHighlights: string[];
  topDecisions: string[];
  topIdeas: string[];
  topResearch: string[];
  momentumScore: number;
  weekSummary: string;
}

function getDuration(start: string, end?: string): number {
  const diff = new Date(end || new Date()).getTime() - new Date(start).getTime();
  return Math.floor(diff / 60000);
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getWeekStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function generateReport(): WeeklyReport {
  const weekStart = getWeekStart();
  const sessions = getAllSessions().filter(s => new Date(s.startedAt) >= weekStart);
  const allSessions = getAllSessions();
  const ideas = getIdeas().filter(i => new Date(i.createdAt) >= weekStart);
  const decisions = getDecisions().filter(d => new Date(d.createdAt) >= weekStart);
  const research = getLibrary().filter(r => new Date(r.createdAt) >= weekStart);
  const pending = getPendingTasks();

  const totalMins = sessions.reduce((acc, s) => acc + getDuration(s.startedAt, s.endedAt), 0);
  const tasksCompleted = sessions.reduce((acc, s) => acc + s.tasksCompleted, 0);

  // Momentum score (0-100)
  const momentum = Math.min(100, Math.round(
    (sessions.length * 15) +
    (tasksCompleted * 8) +
    (decisions.length * 10) +
    (ideas.length * 7) +
    (research.length * 12)
  ));

  // Highlights from session summaries
  const highlights = sessions
    .filter(s => s.summary)
    .map(s => s.summary!)
    .slice(0, 4);

  // Week summary
  let summary = `This week you ran ${sessions.length} work session${sessions.length !== 1 ? "s" : ""} totaling ${formatMins(totalMins)} of focused build time.`;
  if (tasksCompleted > 0) summary += ` You completed ${tasksCompleted} task${tasksCompleted !== 1 ? "s" : ""}.`;
  if (decisions.length > 0) summary += ` Made ${decisions.length} key decision${decisions.length !== 1 ? "s" : ""}.`;
  if (ideas.length > 0) summary += ` Captured ${ideas.length} new idea${ideas.length !== 1 ? "s" : ""}.`;
  if (research.length > 0) summary += ` Completed ${research.length} research report${research.length !== 1 ? "s" : ""}.`;
  if (sessions.length === 0) summary = "No sessions logged this week yet. Start a session to begin tracking your progress.";

  return {
    weekOf: weekStart.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }),
    generatedAt: new Date().toISOString(),
    totalSessions: sessions.length,
    totalFocusTime: formatMins(totalMins),
    tasksCompleted,
    tasksPending: pending.length,
    decisionsCount: decisions.length,
    ideasCaptured: ideas.length,
    researchDone: research.length,
    sessionHighlights: highlights.length > 0 ? highlights : ["No sessions this week yet — start building!"],
    topDecisions: decisions.slice(0, 3).map(d => d.decision),
    topIdeas: ideas.slice(0, 3).map(i => i.title),
    topResearch: research.slice(0, 3).map(r => r.topic),
    momentumScore: momentum,
    weekSummary: summary,
  };
}

function MomentumBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-red-400";
  const label = score >= 70 ? "On Fire 🔥" : score >= 40 ? "Building Momentum" : "Get Moving";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-neutral-200">Weekly Momentum</span>
        <span className="text-sm font-bold text-amber-400">{score}/100 · {label}</span>
      </div>
      <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function WeeklyReport() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { setReport(generateReport()); }, []);

  async function handleRegenerate() {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    setReport(generateReport());
    setGenerating(false);
  }

  if (!report) return null;

  const statCards = [
    { icon: Clock, label: "Focus Time", value: report.totalFocusTime, color: "text-amber-400" },
    { icon: Brain, label: "Sessions", value: report.totalSessions, color: "text-blue-400" },
    { icon: Target, label: "Completed", value: report.tasksCompleted, color: "text-emerald-400" },
    { icon: Target, label: "Pending", value: report.tasksPending, color: "text-red-400" },
    { icon: Brain, label: "Decisions", value: report.decisionsCount, color: "text-purple-400" },
    { icon: Lightbulb, label: "Ideas", value: report.ideasCaptured, color: "text-amber-400" },
    { icon: BookOpen, label: "Research", value: report.researchDone, color: "text-cyan-400" },
    { icon: TrendingUp, label: "Momentum", value: `${report.momentumScore}%`, color: "text-emerald-400" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Weekly Report</div>
            <h2 className="text-xl font-bold text-neutral-100">Week of {report.weekOf}</h2>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 text-sm px-4 py-2 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Momentum */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <MomentumBar score={report.momentumScore} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <Icon className="w-4 h-4 text-neutral-700 mb-2" />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Week summary */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-3">Week Summary</div>
          <p className="text-sm text-neutral-300 leading-relaxed">{report.weekSummary}</p>
        </div>

        {/* Session highlights */}
        {report.sessionHighlights.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-3">Session Highlights</div>
            <div className="space-y-3">
              {report.sessionHighlights.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs font-mono text-neutral-700 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm text-neutral-400 leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decisions, Ideas, Research in 3 cols */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: "Decisions Made", items: report.topDecisions, color: "text-purple-400", empty: "No decisions this week" },
            { title: "Ideas Captured", items: report.topIdeas, color: "text-amber-400", empty: "No ideas this week" },
            { title: "Research Done", items: report.topResearch, color: "text-cyan-400", empty: "No research this week" },
          ].map(({ title, items, color, empty }) => (
            <div key={title} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className={`text-xs font-mono ${color} tracking-widest uppercase mb-3`}>{title}</div>
              {items.length === 0 ? (
                <p className="text-xs text-neutral-700">{empty}</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-xs font-mono text-neutral-700 mt-0.5">{i + 1}.</span>
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-xs text-neutral-700 font-mono">
            Reports are generated from your sessions, tasks, decisions, ideas, and research.<br />
            Email delivery via Resend — coming in Phase 4.
          </p>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Zap, Play, Pause, Settings2, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, Loader2, AlertCircle,
  DollarSign, BarChart2, RefreshCw, Shield, Search,
  FileText, Mail, Radar, Target, Bot, Star
} from "lucide-react";
import {
  getSkills, getSkillStats, getSkillRuns, toggleSkill,
  executeSkill, getPendingActions, approveAction, updateSkill,
  type Skill, type SkillRun, type SkillAction
} from "@/lib/skill-engine";
import FounderBrainNudge from "@/components/FounderBrainNudge";

// ── CONFIG ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  revenue:    { label: "Revenue",     color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: DollarSign },
  research:   { label: "Research",    color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20",       icon: Search },
  outreach:   { label: "Outreach",    color: "text-purple-400",  bg: "bg-purple-400/10 border-purple-400/20",   icon: Mail },
  monitoring: { label: "Monitoring",  color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20",     icon: Radar },
  reporting:  { label: "Reporting",   color: "text-cyan-400",    bg: "bg-cyan-400/10 border-cyan-400/20",       icon: BarChart2 },
  automation: { label: "Automation",  color: "text-red-400",     bg: "bg-red-400/10 border-red-400/20",         icon: Bot },
};

const STATUS_CONFIG = {
  active:  { label: "Active",  color: "text-emerald-400", dot: "bg-emerald-400" },
  paused:  { label: "Paused",  color: "text-neutral-500", dot: "bg-neutral-600" },
  error:   { label: "Error",   color: "text-red-400",     dot: "bg-red-400" },
  running: { label: "Running", color: "text-amber-400",   dot: "bg-amber-400 animate-pulse" },
};

const SCHEDULE_LABELS: Record<string, string> = {
  daily_6am:      "Daily at 6am",
  daily_7am:      "Daily at 7am",
  weekly_monday:  "Every Monday",
  weekly_sunday:  "Every Sunday",
  hourly:         "Every hour",
  manual:         "Manual only",
};

// ── ACTION CARD ───────────────────────────────────────────────────────────────

function ActionCard({
  action,
  runId,
  skillName,
  onApprove,
}: {
  action: SkillAction & { runId: string; skillName: string };
  runId: string;
  skillName: string;
  onApprove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const iconMap = { draft: FileText, alert: AlertCircle, research: Search, submit: Zap, email: Mail, telegram: Bot };
  const Icon = iconMap[action.type] || Zap;

  return (
    <div className={`border rounded-xl overflow-hidden ${
      action.approved ? "border-emerald-400/20 bg-emerald-400/5" : "border-amber-400/20 bg-amber-400/5"
    }`}>
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-neutral-200 truncate">{action.title}</p>
          <p className="text-xs text-neutral-500">{action.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!action.approved && (
            <button
              onClick={() => { approveAction(runId, action.title); onApprove(); }}
              className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <CheckCircle className="w-3 h-3" />
              Approve
            </button>
          )}
          {action.approved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
              <CheckCircle className="w-3 h-3" /> Approved
            </span>
          )}
          {action.data && (
            <button onClick={() => setExpanded(!expanded)} className="text-neutral-600 hover:text-neutral-300 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && action.data && (
        <div className="border-t border-neutral-800 p-4">
          {(action.data as { proposal?: string; draft?: string; message?: string }).proposal ||
           (action.data as { proposal?: string; draft?: string; message?: string }).draft ||
           (action.data as { proposal?: string; draft?: string; message?: string }).message ? (
            <div className="bg-neutral-950 rounded-lg p-4 max-h-64 overflow-auto">
              <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                {(action.data as { proposal?: string; draft?: string; message?: string }).proposal ||
                 (action.data as { proposal?: string; draft?: string; message?: string }).draft ||
                 (action.data as { proposal?: string; draft?: string; message?: string }).message}
              </pre>
            </div>
          ) : (
            <pre className="text-xs text-neutral-500 font-mono whitespace-pre-wrap">
              {JSON.stringify(action.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── SKILL CARD ────────────────────────────────────────────────────────────────

function SkillCard({ skill, onUpdate }: { skill: Skill; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<SkillRun | null>(null);
  const [configEditing, setConfigEditing] = useState(false);

  const cat = CATEGORY_CONFIG[skill.category];
  const status = STATUS_CONFIG[running ? "running" : skill.status];
  const CatIcon = cat.icon;
  const runs = getSkillRuns(skill.id);
  const successRate = skill.totalRuns > 0
    ? Math.round((skill.successRuns / skill.totalRuns) * 100) : 0;

  async function handleRun() {
    if (running) return;
    setRunning(true);
    try {
      const result = await executeSkill(skill.id);
      setLastResult(result);
      onUpdate();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={`bg-neutral-900 border rounded-xl overflow-hidden transition-all ${
      skill.status === "active" ? "border-neutral-700" :
      skill.status === "error" ? "border-red-400/30" : "border-neutral-800"
    }`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
            <CatIcon className={`w-5 h-5 ${cat.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-bold text-neutral-200">{skill.name}</h3>
              {skill.isBuiltIn && (
                <span className="text-xs font-mono text-neutral-600 border border-neutral-800 px-1.5 py-0.5 rounded">built-in</span>
              )}
              <span className={`flex items-center gap-1 text-xs font-mono ${status.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{skill.description}</p>

            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-neutral-600">
              <span className={cat.color}>{cat.label}</span>
              {skill.schedule && <span>{SCHEDULE_LABELS[skill.schedule] || skill.schedule}</span>}
              {skill.totalRuns > 0 && (
                <span>{skill.totalRuns} runs · {successRate}% success</span>
              )}
              {skill.lastRun && (
                <span>Last: {new Date(skill.lastRun).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { toggleSkill(skill.id); onUpdate(); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                skill.status === "active"
                  ? "border-neutral-700 text-neutral-500 hover:text-neutral-300"
                  : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
              }`}
            >
              {skill.status === "active" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/30 text-black disabled:text-amber-400/50 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {running
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Play className="w-3 h-3" />
              }
              {running ? "Running..." : "Run"}
            </button>

            <button onClick={() => setExpanded(!expanded)} className="text-neutral-600 hover:text-neutral-300 p-1 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Last run result */}
      {lastResult && (
        <div className={`mx-5 mb-4 p-3 rounded-lg border text-xs ${
          lastResult.status === "success"
            ? "bg-emerald-400/5 border-emerald-400/20 text-emerald-300"
            : "bg-red-400/5 border-red-400/20 text-red-300"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {lastResult.status === "success"
              ? <CheckCircle className="w-3.5 h-3.5" />
              : <XCircle className="w-3.5 h-3.5" />
            }
            <span className="font-mono font-bold">{lastResult.status.toUpperCase()}</span>
            <span className="text-neutral-600 ml-auto">{new Date(lastResult.startedAt).toLocaleTimeString()}</span>
          </div>
          <p>{lastResult.output || lastResult.error}</p>
          {lastResult.actions && lastResult.actions.length > 0 && (
            <p className="mt-1 text-neutral-500">{lastResult.actions.length} action(s) created — check Action Queue below</p>
          )}
        </div>
      )}

      {/* Expanded: config + run history */}
      {expanded && (
        <div className="border-t border-neutral-800 p-5 space-y-4">

          {/* Config */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Configuration</span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
              {Object.entries(skill.config).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-600">{key}</span>
                  <span className="text-xs font-mono text-neutral-300">
                    {typeof value === "boolean" ? (value ? "✓ enabled" : "✗ disabled") : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Run history */}
          {runs.length > 0 && (
            <div>
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-2">Recent Runs</span>
              <div className="space-y-1.5">
                {runs.slice(0, 5).map(run => (
                  <div key={run.id} className="flex items-center gap-3 text-xs">
                    {run.status === "success"
                      ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      : run.status === "running"
                      ? <Loader2 className="w-3 h-3 text-amber-400 animate-spin flex-shrink-0" />
                      : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    }
                    <span className="text-neutral-500 font-mono">{new Date(run.startedAt).toLocaleString()}</span>
                    <span className="text-neutral-600 truncate flex-1">{run.output || run.error || "—"}</span>
                    {run.actions && run.actions.length > 0 && (
                      <span className="text-amber-400 font-mono flex-shrink-0">{run.actions.length} actions</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function SkillEngineUI({ onNavigate }: { onNavigate?: (module: string) => void } = {}) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState(getSkillStats());
  const [pendingActions, setPendingActions] = useState(getPendingActions());
  const [filter, setFilter] = useState<"all" | "active" | "revenue" | "monitoring" | "automation">("all");
  const [showActions, setShowActions] = useState(true);

  useEffect(() => { refresh(); }, []);

  function refresh() {
    setSkills(getSkills());
    setStats(getSkillStats());
    setPendingActions(getPendingActions());
  }

  const filtered = skills.filter(s => {
    if (filter === "all") return true;
    if (filter === "active") return s.status === "active";
    return s.category === filter;
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <FounderBrainNudge onNavigate={onNavigate} />

        {/* Header */}
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Skill Engine</div>
          <h2 className="text-xl font-bold text-neutral-100">Autonomous Capabilities</h2>
          <p className="text-sm text-neutral-500 mt-1">Injectable skills that run automatically. Each one works while you sleep.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total Skills",    value: stats.total,          color: "text-neutral-300" },
            { label: "Active",          value: stats.active,         color: "text-emerald-400" },
            { label: "Total Runs",      value: stats.totalRuns,      color: "text-blue-400" },
            { label: "Pending Actions", value: stats.pendingActions, color: "text-amber-400" },
            { label: "Revenue Gen.",    value: `$${stats.totalRevenue}`, color: "text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Pending Actions */}
        {pendingActions.length > 0 && showActions && (
          <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">
                  {pendingActions.length} Action{pendingActions.length > 1 ? "s" : ""} Awaiting Approval
                </span>
              </div>
              <button onClick={() => setShowActions(false)} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                Hide
              </button>
            </div>
            <div className="space-y-3">
              {pendingActions.map((action, i) => (
                <ActionCard
                  key={i}
                  action={action}
                  runId={action.runId}
                  skillName={action.skillName}
                  onApprove={refresh}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "all",        label: "All Skills" },
            { id: "active",     label: "Active" },
            { id: "revenue",    label: "💰 Revenue" },
            { id: "monitoring", label: "👁 Monitoring" },
            { id: "automation", label: "🤖 Automation" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setFilter(id as typeof filter)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                filter === id
                  ? "border-amber-400/40 text-amber-400 bg-amber-400/10"
                  : "border-neutral-800 text-neutral-600 hover:text-neutral-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Skills */}
        <div className="space-y-4">
          {filtered.map(skill => (
            <SkillCard key={skill.id} skill={skill} onUpdate={refresh} />
          ))}
        </div>

      </div>
    </div>
  );
}

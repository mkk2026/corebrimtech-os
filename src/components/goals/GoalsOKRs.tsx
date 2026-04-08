"use client";

import { useState, useEffect } from "react";
import {
  Target, Plus, ChevronDown, ChevronUp, Check, Trash2,
  Edit3, Save, X, TrendingUp, Calendar, Zap, AlertCircle
} from "lucide-react";
import {
  getGoals, addGoal, updateGoal, deleteGoal, updateKeyResult,
  addMilestone, updateMilestone, getGoalStats,
  calcGoalProgress, type Goal, type GoalCategory, type GoalTimeframe,
  type GoalStatus, type KeyResult, type Milestone
} from "@/lib/goals";

// ── CONFIG ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; color: string; emoji: string }> = {
  revenue:      { label: "Revenue",      color: "text-emerald-400", emoji: "💰" },
  product:      { label: "Product",      color: "text-blue-400",    emoji: "📦" },
  growth:       { label: "Growth",       color: "text-purple-400",  emoji: "📈" },
  team:         { label: "Team",         color: "text-amber-400",   emoji: "👥" },
  personal:     { label: "Personal",     color: "text-cyan-400",    emoji: "🧠" },
  research:     { label: "Research",     color: "text-indigo-400",  emoji: "🔍" },
  partnerships: { label: "Partnerships", color: "text-pink-400",    emoji: "🤝" },
};

const TIMEFRAME_LABELS: Record<GoalTimeframe, string> = {
  weekly:   "This Week",
  monthly:  "This Month",
  quarterly:"This Quarter",
  yearly:   "This Year",
  longterm: "Long Term",
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  active:    { label: "Active",    color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  completed: { label: "Done ✓",   color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  paused:    { label: "Paused",   color: "text-neutral-500 border-neutral-700 bg-neutral-800" },
  dropped:   { label: "Dropped",  color: "text-red-400/50 border-red-400/20 bg-red-400/5" },
};

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  const color = progress >= 70 ? "#34d399" : progress >= 40 ? "#fbbf24" : "#ef4444";
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262626" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {progress}%
      </text>
    </svg>
  );
}

function KRRow({ goalId, kr, onUpdate }: { goalId: string; kr: KeyResult; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(kr.current));
  const pct = kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
  const color = pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-red-400";

  function save() {
    updateKeyResult(goalId, kr.id, Number(value) || 0);
    onUpdate();
    setEditing(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400 flex-1">{kr.description}</span>
        <div className="flex items-center gap-2 ml-3">
          {editing ? (
            <>
              <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
                className="w-16 bg-neutral-800 border border-amber-400/40 rounded px-2 py-0.5 text-xs text-neutral-200 focus:outline-none text-right" />
              <span className="text-xs text-neutral-600">/ {kr.target} {kr.unit}</span>
              <button onClick={save} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Check className="w-3 h-3" /></button>
              <button onClick={() => setEditing(false)} className="text-neutral-600 hover:text-neutral-400 transition-colors"><X className="w-3 h-3" /></button>
            </>
          ) : (
            <>
              <span className="text-xs font-mono font-bold text-neutral-300">{kr.current} / {kr.target} {kr.unit}</span>
              <button onClick={() => setEditing(true)} className="text-neutral-700 hover:text-neutral-400 transition-colors"><Edit3 className="w-3 h-3" /></button>
            </>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MilestoneRow({ goalId, ms, onUpdate }: { goalId: string; ms: Milestone; onUpdate: () => void }) {
  function toggle() {
    updateMilestone(goalId, ms.id, {
      status: ms.status === "done" ? "pending" : "done",
    });
    onUpdate();
  }
  const isDone = ms.status === "done";
  const isPast = !isDone && new Date(ms.dueDate) < new Date();
  return (
    <div className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0">
      <button onClick={toggle}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
          isDone ? "bg-emerald-400 border-emerald-400" : "border-neutral-600 hover:border-amber-400"
        }`}>
        {isDone && <Check className="w-2.5 h-2.5 text-black" />}
      </button>
      <span className={`text-xs flex-1 ${isDone ? "line-through text-neutral-600" : isPast ? "text-red-400" : "text-neutral-300"}`}>
        {ms.title}
      </span>
      <span className={`text-xs font-mono flex-shrink-0 ${isPast && !isDone ? "text-red-400" : "text-neutral-600"}`}>
        {ms.dueDate}
      </span>
      {isPast && !isDone && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
    </div>
  );
}

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [addingKR, setAddingKR] = useState(false);
  const [addingMS, setAddingMS] = useState(false);
  const [newKR, setNewKR] = useState({ description: "", target: "", unit: "items" });
  const [newMS, setNewMS] = useState({ title: "", dueDate: "" });
  const cat = CATEGORY_CONFIG[goal.category];
  const statusCfg = STATUS_CONFIG[goal.status];
  const daysLeft = goal.endDate
    ? Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / 86400000) : null;

  function handleAddKR() {
    if (!newKR.description.trim() || !newKR.target) return;
    const krs = [...goal.keyResults, {
      id: `kr_${Date.now()}`, description: newKR.description,
      target: Number(newKR.target), current: 0, unit: newKR.unit,
    }];
    updateGoal(goal.id, { keyResults: krs });
    setNewKR({ description: "", target: "", unit: "items" });
    setAddingKR(false);
    onUpdate();
  }

  function handleAddMS() {
    if (!newMS.title.trim() || !newMS.dueDate) return;
    addMilestone(goal.id, { title: newMS.title, dueDate: newMS.dueDate, status: "pending", tasks: [] });
    setNewMS({ title: "", dueDate: "" });
    setAddingMS(false);
    onUpdate();
  }

  return (
    <div className={`bg-neutral-900 border rounded-xl overflow-hidden transition-all ${
      goal.status === "completed" ? "border-emerald-400/20" :
      goal.progress < 30 && goal.status === "active" ? "border-red-400/20" :
      "border-neutral-800"
    }`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <ProgressRing progress={goal.progress} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-base">{cat.emoji}</span>
              <h3 className="text-sm font-bold text-neutral-200">{goal.title}</h3>
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-2 line-clamp-1">{goal.description}</p>
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-600">
              <span className={cat.color}>{TIMEFRAME_LABELS[goal.timeframe]}</span>
              {daysLeft !== null && (
                <span className={daysLeft < 7 ? "text-red-400" : daysLeft < 14 ? "text-amber-400" : ""}>
                  {daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}
                </span>
              )}
              <span>{goal.keyResults.length} KRs · {goal.milestones.length} milestones</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Status quick-change */}
            {goal.status === "active" && (
              <button onClick={() => { updateGoal(goal.id, { status: "completed" }); onUpdate(); }}
                className="text-xs text-neutral-600 hover:text-emerald-400 bg-neutral-800 border border-neutral-700 px-2.5 py-1.5 rounded-lg transition-colors">
                Mark Done
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-neutral-600 hover:text-neutral-300 p-1 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={() => { deleteGoal(goal.id); onUpdate(); }} className="text-neutral-700 hover:text-red-400 p-1 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800 p-5 space-y-5">
          {/* Why */}
          {goal.why && (
            <div className="bg-amber-400/5 border border-amber-400/15 rounded-lg p-3">
              <p className="text-xs text-neutral-600 mb-0.5">Why this matters</p>
              <p className="text-sm text-neutral-300 italic">"{goal.why}"</p>
            </div>
          )}

          {/* Key Results */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Key Results</span>
              <button onClick={() => setAddingKR(!addingKR)} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> Add KR
              </button>
            </div>
            {goal.keyResults.length === 0 && !addingKR && (
              <p className="text-xs text-neutral-700">No key results yet — add measurable targets</p>
            )}
            <div className="space-y-3">
              {goal.keyResults.map(kr => (
                <KRRow key={kr.id} goalId={goal.id} kr={kr} onUpdate={onUpdate} />
              ))}
            </div>
            {addingKR && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <input value={newKR.description} onChange={e => setNewKR(n => ({ ...n, description: e.target.value }))} placeholder="Result description" className="flex-1 min-w-32 bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400" />
                <input value={newKR.target} onChange={e => setNewKR(n => ({ ...n, target: e.target.value }))} placeholder="Target" type="number" className="w-20 bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400" />
                <input value={newKR.unit} onChange={e => setNewKR(n => ({ ...n, unit: e.target.value }))} placeholder="unit" className="w-20 bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400" />
                <button onClick={handleAddKR} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-3 py-2 rounded transition-colors">Add</button>
                <button onClick={() => setAddingKR(false)} className="text-neutral-600 text-xs px-2 py-2 transition-colors">Cancel</button>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Milestones</span>
              <button onClick={() => setAddingMS(!addingMS)} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {goal.milestones.length === 0 && !addingMS && (
              <p className="text-xs text-neutral-700">No milestones yet</p>
            )}
            {goal.milestones.map(ms => (
              <MilestoneRow key={ms.id} goalId={goal.id} ms={ms} onUpdate={onUpdate} />
            ))}
            {addingMS && (
              <div className="mt-2 flex gap-2">
                <input value={newMS.title} onChange={e => setNewMS(n => ({ ...n, title: e.target.value }))} placeholder="Milestone title" className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400" />
                <input value={newMS.dueDate} onChange={e => setNewMS(n => ({ ...n, dueDate: e.target.value }))} type="date" className="bg-neutral-950 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400" />
                <button onClick={handleAddMS} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-3 py-2 rounded transition-colors">Add</button>
                <button onClick={() => setAddingMS(false)} className="text-neutral-600 text-xs px-2 py-2">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddGoalForm({ onAdd }: { onAdd: () => void }) {
  const [form, setForm] = useState({
    title: "", description: "", why: "", category: "revenue" as GoalCategory,
    timeframe: "monthly" as GoalTimeframe, startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  function handleAdd() {
    if (!form.title.trim()) return;
    addGoal({
      title: form.title, description: form.description, why: form.why,
      category: form.category, timeframe: form.timeframe, status: "active",
      keyResults: [], milestones: [], startDate: form.startDate, endDate: form.endDate,
    });
    onAdd();
  }

  return (
    <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-5 space-y-4">
      <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">New Goal</div>
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Goal title *" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What specifically will you achieve?" rows={2} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
      <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} placeholder="Why does this goal matter? (keeps you motivated)" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-600 block mb-1.5">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(CATEGORY_CONFIG) as [GoalCategory, { label: string; color: string; emoji: string }][]).map(([cat, cfg]) => (
              <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${form.category === cat ? `${cfg.color} border-current bg-current/10` : "border-neutral-800 text-neutral-600 hover:text-neutral-400"}`}>
                {cfg.emoji} {cfg.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-neutral-600 block mb-1.5">Timeframe</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(TIMEFRAME_LABELS) as [GoalTimeframe, string][]).map(([tf, label]) => (
              <button key={tf} onClick={() => setForm(f => ({ ...f, timeframe: tf }))}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${form.timeframe === tf ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-400"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-600 block mb-1.5">Start Date</label>
          <input value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} type="date" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-neutral-600 block mb-1.5">End Date</label>
          <input value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} type="date" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
      </div>
      <button onClick={handleAdd} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
        Create Goal
      </button>
    </div>
  );
}

export default function GoalsOKRs() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState(getGoalStats());
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<GoalStatus | "all">("active");

  function refresh() {
    setGoals(getGoals());
    setStats(getGoalStats());
  }

  useEffect(() => {
    // Goals are now user-created only, no auto-initialization
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = goals.filter(g => filter === "all" || g.status === filter);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Goals & OKRs</div>
          <h2 className="text-xl font-bold text-neutral-100">What You're Building Toward</h2>
          <p className="text-sm text-neutral-500 mt-1">Goal → Key Results → Milestones. Every task connects upward.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Active Goals", value: stats.active, color: "text-amber-400" },
            { label: "Completed", value: stats.completed, color: "text-emerald-400" },
            { label: "Avg Progress", value: `${stats.avgProgress}%`, color: "text-blue-400" },
            { label: "At Risk", value: stats.atRisk, color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Add */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(["active", "all", "completed", "paused"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${filter === f ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>

        {showAdd && <AddGoalForm onAdd={() => { refresh(); setShowAdd(false); }} />}

        {/* Goal cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Target className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
              <p className="text-sm text-neutral-600">No goals yet. 3 starter goals were added — check "active" filter.</p>
            </div>
          ) : (
            filtered.map(goal => (
              <GoalCard key={goal.id} goal={goal} onUpdate={refresh} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play, Square, Plus, Check, Trash2, Brain, Clock,
  Lightbulb, Bug, FileText, Code, ChevronDown, ChevronUp,
  Zap, Target, BookOpen, TrendingUp
} from "lucide-react";
import {
  startSession, getActiveSession, endSession, addEntryToSession,
  getAllSessions, getPendingTasks, addTask, toggleTask, deleteTask,
  getDecisions, addDecision, getSessionStats, updateActiveSession,
  type Session, type SessionEntry, type Task, type Decision
} from "@/lib/session-brain";

const PROJECTS = ["Core Brim Tech OS", "NextHire AI", "Research", "Personal", "Other"];

const ENTRY_ICONS: Record<string, React.ElementType> = {
  task_done: Check,
  task_added: Plus,
  decision: Brain,
  idea: Lightbulb,
  bug: Bug,
  note: FileText,
  code_context: Code,
};

const ENTRY_COLORS: Record<string, string> = {
  task_done: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  task_added: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  decision: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  idea: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  bug: "text-red-400 bg-red-400/10 border-red-400/20",
  note: "text-neutral-400 bg-neutral-400/10 border-neutral-400/20",
  code_context: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

const ENTRY_LABELS: Record<string, string> = {
  task_done: "Completed",
  task_added: "Task Added",
  decision: "Decision",
  idea: "Idea",
  bug: "Bug",
  note: "Note",
  code_context: "Code Context",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function getDuration(start: string, end?: string) {
  const diff = new Date(end || new Date()).getTime() - new Date(start).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

// ── START SESSION SCREEN ──────────────────────────────────────────────────────

function StartSessionScreen({ onStart }: { onStart: (session: Session) => void }) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("Core Brim Tech OS");
  const [energy, setEnergy] = useState<Session["energyLevel"]>("high");
  const lastSession = getAllSessions()[0];
  const pendingTasks = getPendingTasks();
  const stats = getSessionStats();

  function handleStart() {
    if (!title.trim()) return;
    const session = startSession(title.trim(), project, energy);
    onStart(session);
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Sessions", value: stats.totalSessions, icon: Brain },
            { label: "This Week", value: stats.sessionsThisWeek, icon: TrendingUp },
            { label: "Pending Tasks", value: stats.pendingTasks, icon: Target },
            { label: "Decisions Made", value: stats.totalDecisions, icon: BookOpen },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <Icon className="w-4 h-4 text-neutral-600 mb-2" />
              <div className="text-2xl font-bold text-amber-400">{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Last session briefing */}
        {lastSession && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-3">
              Last Session — {formatDate(lastSession.startedAt)} · {getDuration(lastSession.startedAt, lastSession.endedAt)}
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed mb-3">
              {lastSession.summary || `Worked on "${lastSession.title}"`}
            </p>
            {lastSession.entries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {lastSession.tasksCompleted > 0 && (
                  <span className="text-xs bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-2 py-1 rounded">
                    ✓ {lastSession.tasksCompleted} completed
                  </span>
                )}
                {lastSession.decisionsCount > 0 && (
                  <span className="text-xs bg-purple-400/10 border border-purple-400/20 text-purple-400 px-2 py-1 rounded">
                    ⊕ {lastSession.decisionsCount} decisions
                  </span>
                )}
                {lastSession.ideasCaptured > 0 && (
                  <span className="text-xs bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-1 rounded">
                    💡 {lastSession.ideasCaptured} ideas
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pending tasks */}
        {pendingTasks.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="text-xs font-mono text-neutral-500 tracking-widest uppercase mb-3">
              Pending Tasks ({pendingTasks.length})
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === "high" ? "bg-red-400" :
                    task.priority === "medium" ? "bg-amber-400" : "bg-neutral-600"
                  }`} />
                  <span className="text-sm text-neutral-300 flex-1">{task.text}</span>
                  {task.project && (
                    <span className="text-xs font-mono text-neutral-600">{task.project}</span>
                  )}
                </div>
              ))}
              {pendingTasks.length > 5 && (
                <p className="text-xs text-neutral-600 font-mono pt-1">
                  +{pendingTasks.length - 5} more tasks
                </p>
              )}
            </div>
          </div>
        )}

        {/* Start form */}
        <div className="bg-neutral-900 border border-amber-400/20 rounded-lg p-5 space-y-4">
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase">
            Start New Session
          </div>

          <div>
            <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-2">
              What are you working on?
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleStart()}
              placeholder="e.g. Build Session Brain UI component"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-2">Project</label>
              <select
                value={project}
                onChange={e => setProject(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors"
              >
                {PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-2">Energy Level</label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                      energy === level
                        ? level === "high" ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-400"
                        : level === "medium" ? "bg-amber-400/15 border-amber-400/40 text-amber-400"
                        : "bg-red-400/15 border-red-400/40 text-red-400"
                        : "bg-neutral-950 border-neutral-700 text-neutral-600"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!title.trim()}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ACTIVE SESSION SCREEN ─────────────────────────────────────────────────────

function ActiveSessionScreen({ session, onEnd, onUpdate }: {
  session: Session;
  onEnd: () => void;
  onUpdate: (s: Session) => void;
}) {
  const [quickInput, setQuickInput] = useState("");
  const [quickType, setQuickType] = useState<SessionEntry["type"]>("note");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>(getPendingTasks);
  const [activeTab, setActiveTab] = useState<"log" | "tasks" | "decisions">("log");
  const [decisions, setDecisions] = useState<Decision[]>(getDecisions);
  const [decisionText, setDecisionText] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [elapsed, setElapsed] = useState("0m");
  const inputRef = useRef<HTMLInputElement>(null);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(getDuration(session.startedAt));
    }, 10000);
    setElapsed(getDuration(session.startedAt));
    return () => clearInterval(timer);
  }, [session.startedAt]);

  // Reload session entries from storage
  const [liveSession, setLiveSession] = useState(session);
  useEffect(() => {
    const refreshed = getActiveSession();
    if (refreshed) setLiveSession(refreshed);
  }, []);

  function handleAddEntry() {
    if (!quickInput.trim()) return;
    addEntryToSession({ type: quickType, content: quickInput.trim(), tags: [liveSession.project || "general"] });
    const updated = getActiveSession();
    if (updated) { setLiveSession(updated); onUpdate(updated); }
    setQuickInput("");
  }

  function handleAddTask() {
    if (!newTask.trim()) return;
    addTask(newTask.trim(), liveSession.project, "medium");
    setTasks(getPendingTasks());
    addEntryToSession({ type: "task_added", content: newTask.trim() });
    const updated = getActiveSession();
    if (updated) { setLiveSession(updated); onUpdate(updated); }
    setNewTask("");
  }

  function handleToggleTask(id: string) {
    toggleTask(id);
    setTasks(getPendingTasks());
    const updated = getActiveSession();
    if (updated) { setLiveSession(updated); onUpdate(updated); }
  }

  function handleAddDecision() {
    if (!decisionText.trim() || !decisionReason.trim()) return;
    addDecision(decisionText.trim(), decisionReason.trim(), undefined, liveSession.project);
    setDecisions(getDecisions());
    const updated = getActiveSession();
    if (updated) { setLiveSession(updated); onUpdate(updated); }
    setDecisionText("");
    setDecisionReason("");
    setShowDecisionForm(false);
  }

  function handleEnd() {
    endSession();
    onEnd();
  }

  const QUICK_TYPES: { type: SessionEntry["type"]; label: string; icon: React.ElementType }[] = [
    { type: "note", label: "Note", icon: FileText },
    { type: "idea", label: "Idea", icon: Lightbulb },
    { type: "decision", label: "Decision", icon: Brain },
    { type: "bug", label: "Bug", icon: Bug },
    { type: "code_context", label: "Code", icon: Code },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Session header */}
      <div className="border-b border-neutral-800 px-6 py-4 bg-neutral-950">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 tracking-wide uppercase">Session Active</span>
              <span className="text-xs font-mono text-neutral-600">{elapsed}</span>
            </div>
            <h2 className="text-base font-bold text-neutral-100">{liveSession.title}</h2>
            <div className="flex gap-3 mt-1 text-xs text-neutral-600 font-mono">
              <span>{liveSession.project}</span>
              <span>·</span>
              <span>{liveSession.entries.length} entries</span>
              <span>·</span>
              <span>{liveSession.tasksCompleted} completed</span>
              <span>·</span>
              <span>{liveSession.decisionsCount} decisions</span>
              <span>·</span>
              <span>{liveSession.ideasCaptured} ideas</span>
            </div>
          </div>

          {!showEndConfirm ? (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-2 bg-neutral-800 hover:bg-red-400/15 hover:border-red-400/40 hover:text-red-400 border border-neutral-700 text-neutral-400 text-sm font-medium px-4 py-2 rounded-lg transition-all"
            >
              <Square className="w-3.5 h-3.5" />
              End Session
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Save & end?</span>
              <button onClick={handleEnd} className="bg-red-400 text-black text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-300 transition-colors">
                End & Save
              </button>
              <button onClick={() => setShowEndConfirm(false)} className="text-xs text-neutral-500 hover:text-neutral-300 px-3 py-2">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick capture */}
      <div className="border-b border-neutral-800 px-6 py-3 bg-neutral-950">
        <div className="flex gap-2">
          <div className="flex gap-1">
            {QUICK_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setQuickType(type as SessionEntry["type"])}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  quickType === type
                    ? ENTRY_COLORS[type]
                    : "border-neutral-800 text-neutral-600 hover:text-neutral-400"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
          <input
            ref={inputRef}
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddEntry()}
            placeholder={`Capture a ${quickType.replace("_", " ")}...`}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            onClick={handleAddEntry}
            disabled={!quickInput.trim()}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold text-sm px-4 rounded-lg transition-colors"
          >
            Log
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-0">
        {[
          { id: "log", label: `Session Log (${liveSession.entries.length})` },
          { id: "tasks", label: `Tasks (${tasks.length})` },
          { id: "decisions", label: `Decisions (${decisions.length})` },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "log" && (
          <div className="max-w-2xl mx-auto">
            {liveSession.entries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-neutral-600">Session started. Capture your first entry above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...liveSession.entries].reverse().map(entry => {
                  const Icon = ENTRY_ICONS[entry.type] || FileText;
                  const color = ENTRY_COLORS[entry.type] || ENTRY_COLORS.note;
                  return (
                    <div key={entry.id} className="flex gap-3 py-3 border-b border-neutral-800/50 last:border-0">
                      <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center ${color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-mono ${color.split(" ")[0]}`}>
                            {ENTRY_LABELS[entry.type]}
                          </span>
                          <span className="text-xs text-neutral-700">{formatTime(entry.timestamp)}</span>
                        </div>
                        <p className="text-sm text-neutral-300 leading-relaxed">{entry.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Add task */}
            <div className="flex gap-2">
              <input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddTask()}
                placeholder="Add a task..."
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                onClick={handleAddTask}
                disabled={!newTask.trim()}
                className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold text-sm px-4 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-neutral-600">No pending tasks. Add one above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg group">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="w-5 h-5 rounded-full border border-neutral-600 hover:border-emerald-400 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      {task.done && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                    <span className={`flex-1 text-sm ${task.done ? "line-through text-neutral-600" : "text-neutral-200"}`}>
                      {task.text}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      task.priority === "high" ? "bg-red-400" :
                      task.priority === "medium" ? "bg-amber-400" : "bg-neutral-600"
                    }`} />
                    <button
                      onClick={() => { deleteTask(task.id); setTasks(getPendingTasks()); }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "decisions" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <button
              onClick={() => setShowDecisionForm(!showDecisionForm)}
              className="flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log a Decision
              {showDecisionForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDecisionForm && (
              <div className="bg-neutral-900 border border-purple-400/20 rounded-lg p-4 space-y-3">
                <input
                  value={decisionText}
                  onChange={e => setDecisionText(e.target.value)}
                  placeholder="What did you decide?"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-400 transition-colors"
                />
                <textarea
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  placeholder="Why? What alternatives did you consider?"
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                />
                <button
                  onClick={handleAddDecision}
                  disabled={!decisionText.trim() || !decisionReason.trim()}
                  className="bg-purple-400/20 hover:bg-purple-400/30 disabled:opacity-40 border border-purple-400/30 text-purple-400 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Save Decision
                </button>
              </div>
            )}

            {decisions.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-neutral-600">No decisions logged yet. Every decision you make is worth recording.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {decisions.map(d => (
                  <div key={d.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-mono text-purple-400">{formatDate(d.createdAt)}</span>
                      {d.project && <span className="text-xs font-mono text-neutral-600">· {d.project}</span>}
                    </div>
                    <p className="text-sm font-semibold text-neutral-200 mb-2">{d.decision}</p>
                    <p className="text-xs text-neutral-500 leading-relaxed">{d.reasoning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAST SESSIONS ─────────────────────────────────────────────────────────────

function PastSessionsScreen() {
  const sessions = getAllSessions();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No past sessions yet. Start your first session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="text-xs font-mono text-neutral-500 tracking-widest uppercase mb-4">
          Session History ({sessions.length})
        </div>
        {sessions.map(session => (
          <div key={session.id} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === session.id ? null : session.id)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-200 truncate">{session.title}</p>
                <div className="flex gap-3 mt-1 text-xs text-neutral-600 font-mono">
                  <span>{formatDate(session.startedAt)}</span>
                  <span>·</span>
                  <span>{getDuration(session.startedAt, session.endedAt)}</span>
                  <span>·</span>
                  <span>{session.project}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {session.tasksCompleted > 0 && (
                  <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-400/20">
                    ✓{session.tasksCompleted}
                  </span>
                )}
                {session.decisionsCount > 0 && (
                  <span className="text-xs bg-purple-400/10 text-purple-400 px-2 py-0.5 rounded border border-purple-400/20">
                    ⊕{session.decisionsCount}
                  </span>
                )}
                {session.ideasCaptured > 0 && (
                  <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20">
                    💡{session.ideasCaptured}
                  </span>
                )}
              </div>
              {expanded === session.id
                ? <ChevronUp className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-neutral-600 flex-shrink-0" />
              }
            </button>

            {expanded === session.id && (
              <div className="border-t border-neutral-800 p-4 space-y-3">
                {session.summary && (
                  <p className="text-sm text-neutral-400 leading-relaxed">{session.summary}</p>
                )}
                {session.entries.length > 0 && (
                  <div className="space-y-1.5">
                    {session.entries.map(entry => {
                      const Icon = ENTRY_ICONS[entry.type] || FileText;
                      const color = ENTRY_COLORS[entry.type] || ENTRY_COLORS.note;
                      return (
                        <div key={entry.id} className="flex gap-2.5 items-start">
                          <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${color}`}>
                            <Icon className="w-2.5 h-2.5" />
                          </div>
                          <div>
                            <span className="text-xs text-neutral-600 font-mono">{formatTime(entry.timestamp)} · </span>
                            <span className="text-xs text-neutral-400">{entry.content}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function SessionBrain() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [view, setView] = useState<"start" | "active" | "history">("start");

  useEffect(() => {
    const existing = getActiveSession();
    if (existing) {
      setActiveSession(existing);
      setView("active");
    }
  }, []);

  function handleSessionStart(session: Session) {
    setActiveSession(session);
    setView("active");
  }

  function handleSessionEnd() {
    setActiveSession(null);
    setView("start");
  }

  function handleSessionUpdate(session: Session) {
    setActiveSession(session);
    updateActiveSession(session);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Topbar tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-0">
        {[
          { id: "start", label: activeSession ? "Active Session" : "Start Session", icon: activeSession ? Zap : Play },
          { id: "history", label: `History (${getAllSessions().length})`, icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id === "start" ? (activeSession ? "active" : "start") : "history")}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              (view === "active" || view === "start") && id === "start"
                ? "border-amber-400 text-amber-400"
                : view === "history" && id === "history"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {activeSession && id === "start" && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "history" ? (
        <PastSessionsScreen />
      ) : view === "active" && activeSession ? (
        <ActiveSessionScreen
          session={activeSession}
          onEnd={handleSessionEnd}
          onUpdate={handleSessionUpdate}
        />
      ) : (
        <StartSessionScreen onStart={handleSessionStart} />
      )}
    </div>
  );
}

// re-export type for use in parent
export type { SessionEntry };

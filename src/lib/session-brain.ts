// CORE BRIM TECH OS — Session Brain
// Complete session continuity — never lose context again

export interface SessionEntry {
  id: string;
  type: "task_done" | "task_added" | "decision" | "idea" | "bug" | "note" | "code_context";
  content: string;
  timestamp: string;
  tags?: string[];
}

export interface Session {
  id: string;
  title: string;             // what you set out to do
  status: "active" | "ended";
  startedAt: string;
  endedAt?: string;
  entries: SessionEntry[];
  summary?: string;          // auto-generated on end
  tasksCompleted: number;
  decisionsCount: number;
  ideasCaptured: number;
  energyLevel?: "low" | "medium" | "high";
  project?: string;          // e.g. "NextHire AI", "CBT OS"
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  project?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  doneAt?: string;
  sessionId?: string;
}

export interface Decision {
  id: string;
  decision: string;
  reasoning: string;
  alternatives?: string;
  sessionId: string;
  createdAt: string;
  project?: string;
}

// ── STORAGE ───────────────────────────────────────────────────────────────────

const KEYS = {
  sessions: "cbt_os_sessions",
  tasks: "cbt_os_tasks",
  decisions: "cbt_os_decisions",
  activeSession: "cbt_os_active_session",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── SESSION OPERATIONS ────────────────────────────────────────────────────────

export function startSession(title: string, project: string, energyLevel: Session["energyLevel"]): Session {
  const session: Session = {
    id: `session_${Date.now()}`,
    title,
    status: "active",
    startedAt: new Date().toISOString(),
    entries: [],
    tasksCompleted: 0,
    decisionsCount: 0,
    ideasCaptured: 0,
    energyLevel,
    project,
  };
  save(KEYS.activeSession, session);
  return session;
}

export function getActiveSession(): Session | null {
  return load<Session | null>(KEYS.activeSession, null);
}

export function updateActiveSession(session: Session): void {
  save(KEYS.activeSession, session);
}

export function addEntryToSession(entry: Omit<SessionEntry, "id" | "timestamp">): Session | null {
  const session = getActiveSession();
  if (!session) return null;

  const newEntry: SessionEntry = {
    ...entry,
    id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  session.entries.push(newEntry);

  // Update counts
  if (entry.type === "task_done") session.tasksCompleted++;
  if (entry.type === "decision") session.decisionsCount++;
  if (entry.type === "idea") session.ideasCaptured++;

  save(KEYS.activeSession, session);
  return session;
}

export function endSession(): Session | null {
  const session = getActiveSession();
  if (!session) return null;

  session.status = "ended";
  session.endedAt = new Date().toISOString();
  session.summary = generateSessionSummary(session);

  // Save to history
  const sessions = getAllSessions();
  sessions.unshift(session);
  save(KEYS.sessions, sessions);

  // Clear active
  localStorage.removeItem(KEYS.activeSession);
  return session;
}

export function getAllSessions(): Session[] {
  return load<Session[]>(KEYS.sessions, []);
}

export function getLastSession(): Session | null {
  const sessions = getAllSessions();
  return sessions[0] || null;
}

export function generateSessionSummary(session: Session): string {
  const duration = session.endedAt
    ? getDuration(session.startedAt, session.endedAt)
    : getDuration(session.startedAt, new Date().toISOString());

  const decisions = session.entries.filter(e => e.type === "decision");
  const ideas = session.entries.filter(e => e.type === "idea");
  const bugs = session.entries.filter(e => e.type === "bug");
  const notes = session.entries.filter(e => e.type === "note");
  const codeCtx = session.entries.filter(e => e.type === "code_context");

  let summary = `Worked on "${session.title}" for ${duration}.`;

  if (session.tasksCompleted > 0) summary += ` Completed ${session.tasksCompleted} task${session.tasksCompleted > 1 ? "s" : ""}.`;
  if (decisions.length > 0) summary += ` Made ${decisions.length} decision${decisions.length > 1 ? "s" : ""}: ${decisions.map(d => `"${d.content.slice(0, 60)}"`).join(", ")}.`;
  if (ideas.length > 0) summary += ` Captured ${ideas.length} idea${ideas.length > 1 ? "s" : ""}.`;
  if (bugs.length > 0) summary += ` Hit ${bugs.length} bug${bugs.length > 1 ? "s" : ""}.`;
  if (codeCtx.length > 0) summary += ` Left off: ${codeCtx[codeCtx.length - 1].content.slice(0, 100)}.`;
  if (notes.length > 0) summary += ` Key notes: ${notes.map(n => n.content.slice(0, 60)).join("; ")}.`;

  return summary;
}

function getDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

// ── TASK OPERATIONS ───────────────────────────────────────────────────────────

export function getTasks(): Task[] {
  return load<Task[]>(KEYS.tasks, []);
}

export function getPendingTasks(): Task[] {
  return getTasks().filter(t => !t.done);
}

export function addTask(text: string, project?: string, priority: Task["priority"] = "medium"): Task {
  const task: Task = {
    id: `task_${Date.now()}`,
    text,
    done: false,
    project,
    priority,
    createdAt: new Date().toISOString(),
    sessionId: getActiveSession()?.id,
  };
  const tasks = getTasks();
  tasks.unshift(task);
  save(KEYS.tasks, tasks);
  return task;
}

export function toggleTask(id: string): Task[] {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    task.doneAt = task.done ? new Date().toISOString() : undefined;
    if (task.done) {
      addEntryToSession({ type: "task_done", content: task.text, tags: [task.project || "general"] });
    }
  }
  save(KEYS.tasks, tasks);
  return tasks;
}

export function deleteTask(id: string): void {
  const tasks = getTasks().filter(t => t.id !== id);
  save(KEYS.tasks, tasks);
}

// ── DECISION OPERATIONS ───────────────────────────────────────────────────────

export function getDecisions(): Decision[] {
  return load<Decision[]>(KEYS.decisions, []);
}

export function addDecision(decision: string, reasoning: string, alternatives?: string, project?: string): Decision {
  const d: Decision = {
    id: `dec_${Date.now()}`,
    decision,
    reasoning,
    alternatives,
    sessionId: getActiveSession()?.id || "standalone",
    createdAt: new Date().toISOString(),
    project,
  };
  const decisions = getDecisions();
  decisions.unshift(d);
  save(KEYS.decisions, decisions);
  addEntryToSession({ type: "decision", content: decision, tags: [project || "general"] });
  return d;
}

// ── STATS ─────────────────────────────────────────────────────────────────────

export function getSessionStats() {
  const sessions = getAllSessions();
  const totalSessions = sessions.length;
  const totalDecisions = getDecisions().length;
  const pendingTasks = getPendingTasks().length;

  const thisWeek = sessions.filter(s => {
    const sessionDate = new Date(s.startedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate > weekAgo;
  });

  return { totalSessions, totalDecisions, pendingTasks, sessionsThisWeek: thisWeek.length };
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert, dbUpsertMany, dbDelete } from "./supabase";

export function syncSessionToCloud(session: Session): void {
  dbUpsert("sessions", session.id, session);
}
export function syncTaskToCloud(task: Task): void {
  dbUpsert("tasks", task.id, task);
}
export function syncDecisionToCloud(decision: Decision): void {
  dbUpsert("decisions", decision.id, decision);
}
export function deleteTaskFromCloud(id: string): void {
  dbDelete("tasks", id);
}

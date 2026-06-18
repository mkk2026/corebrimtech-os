// CORE BRIM TECH OS — Goals & OKRs
// Goal → Milestone → Task. Everything connects upward.

export type GoalStatus = "active" | "completed" | "paused" | "dropped";
export type GoalTimeframe = "weekly" | "monthly" | "quarterly" | "yearly" | "longterm";
export type MilestoneStatus = "pending" | "in_progress" | "done" | "missed";
export type GoalCategory = "revenue" | "product" | "growth" | "team" | "personal" | "research" | "partnerships";

export interface KeyResult {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string; // "users", "USD", "%", "applications", etc
  dueDate?: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  dueDate: string;
  completedAt?: string;
  tasks: string[]; // task IDs from session-brain
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  timeframe: GoalTimeframe;
  status: GoalStatus;
  keyResults: KeyResult[];
  milestones: Milestone[];
  startDate: string;
  endDate: string;
  progress: number; // 0-100, auto-calculated
  why: string; // the reason this goal matters
  createdAt: string;
  updatedAt: string;
}

const KEY = "cbt_os_goals";

function load(): Goal[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function persist(goals: Goal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(goals));
}

export function calcGoalProgress(goal: Goal): number {
  if (goal.keyResults.length === 0) {
    const doneMilestones = goal.milestones.filter(m => m.status === "done").length;
    if (goal.milestones.length === 0) return 0;
    return Math.round((doneMilestones / goal.milestones.length) * 100);
  }
  const avg = goal.keyResults.reduce((sum, kr) => {
    const pct = kr.target > 0 ? Math.min(100, (kr.current / kr.target) * 100) : 0;
    return sum + pct;
  }, 0) / goal.keyResults.length;
  return Math.round(avg);
}

export function getGoals(): Goal[] {
  return load().sort((a, b) => {
    const order: GoalStatus[] = ["active", "in_progress" as GoalStatus, "paused", "completed", "dropped"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });
}

export function getGoal(id: string): Goal | null {
  return load().find(g => g.id === id) || null;
}

export function addGoal(goal: Omit<Goal, "id" | "createdAt" | "updatedAt" | "progress">): Goal {
  const goals = load();
  const newGoal: Goal = {
    ...goal,
    id: `goal_${Date.now()}`,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  newGoal.progress = calcGoalProgress(newGoal);
  goals.unshift(newGoal);
  persist(goals);
  return newGoal;
}

export function updateGoal(id: string, updates: Partial<Goal>): void {
  const goals = load();
  const idx = goals.findIndex(g => g.id === id);
  if (idx >= 0) {
    goals[idx] = { ...goals[idx], ...updates, updatedAt: new Date().toISOString() };
    goals[idx].progress = calcGoalProgress(goals[idx]);
    persist(goals);
  }
}

export function deleteGoal(id: string): void {
  persist(load().filter(g => g.id !== id));
}

export function updateKeyResult(goalId: string, krId: string, current: number): void {
  const goals = load();
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;
  const kr = goal.keyResults.find(k => k.id === krId);
  if (kr) kr.current = current;
  goal.progress = calcGoalProgress(goal);
  goal.updatedAt = new Date().toISOString();
  persist(goals);
}

export function addMilestone(goalId: string, milestone: Omit<Milestone, "id" | "goalId">): void {
  const goals = load();
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;
  goal.milestones.push({ ...milestone, id: `ms_${Date.now()}`, goalId });
  goal.progress = calcGoalProgress(goal);
  goal.updatedAt = new Date().toISOString();
  persist(goals);
}

export function updateMilestone(goalId: string, milestoneId: string, updates: Partial<Milestone>): void {
  const goals = load();
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;
  const ms = goal.milestones.find(m => m.id === milestoneId);
  if (ms) {
    Object.assign(ms, updates);
    if (updates.status === "done") ms.completedAt = new Date().toISOString();
  }
  goal.progress = calcGoalProgress(goal);
  goal.updatedAt = new Date().toISOString();
  persist(goals);
}

export function getGoalStats() {
  const goals = load();
  const active = goals.filter(g => g.status === "active");
  const avgProgress = active.length > 0
    ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length) : 0;
  return {
    total: goals.length,
    active: active.length,
    completed: goals.filter(g => g.status === "completed").length,
    avgProgress,
    onTrack: active.filter(g => g.progress >= 60).length,
    atRisk: active.filter(g => g.progress < 30).length,
  };
}


// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert, dbDelete } from "./supabase";

export function syncGoalToCloud(goal: Goal): void {
  dbUpsert("goals", goal.id, goal);
}
export function deleteGoalFromCloud(id: string): void {
  dbDelete("goals", id);
}

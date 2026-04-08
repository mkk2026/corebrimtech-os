// CORE BRIM TECH OS — Idea Intelligence
// Capture, score, rank, and act on ideas

export type IdeaStatus = "captured" | "evaluating" | "building" | "parked" | "dropped";
export type IdeaCategory = "product" | "feature" | "business" | "research" | "personal" | "other";

export interface Idea {
  id: string;
  title: string;
  description?: string;
  category: IdeaCategory;
  status: IdeaStatus;
  project?: string;
  source: "manual" | "whatsapp" | "session";
  // Scoring (1-10)
  effortScore: number;
  impactScore: number;
  alignmentScore: number;
  totalScore: number; // weighted
  createdAt: string;
  updatedAt: string;
  sessionId?: string;
  tags?: string[];
  linkedResearch?: string[]; // research report IDs
}

const STORAGE_KEY = "cbt_os_ideas";

function load(): Idea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persist(ideas: Idea[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

export function calculateScore(effort: number, impact: number, alignment: number): number {
  // Lower effort is better, higher impact + alignment is better
  const effortInverse = 11 - effort; // invert: effort 1 = score 10, effort 10 = score 1
  return Math.round((effortInverse * 0.25 + impact * 0.45 + alignment * 0.30) * 10) / 10;
}

export function getIdeas(): Idea[] {
  return load().sort((a, b) => b.totalScore - a.totalScore);
}

export function getIdea(id: string): Idea | null {
  return load().find(i => i.id === id) || null;
}

export function addIdea(
  title: string,
  opts: {
    description?: string;
    category?: IdeaCategory;
    project?: string;
    effort?: number;
    impact?: number;
    alignment?: number;
    source?: Idea["source"];
    sessionId?: string;
    tags?: string[];
  } = {}
): Idea {
  const effort = opts.effort ?? 5;
  const impact = opts.impact ?? 5;
  const alignment = opts.alignment ?? 5;

  const idea: Idea = {
    id: `idea_${Date.now()}`,
    title,
    description: opts.description,
    category: opts.category ?? "other",
    status: "captured",
    project: opts.project,
    source: opts.source ?? "manual",
    effortScore: effort,
    impactScore: impact,
    alignmentScore: alignment,
    totalScore: calculateScore(effort, impact, alignment),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sessionId: opts.sessionId,
    tags: opts.tags,
  };

  const ideas = load();
  ideas.unshift(idea);
  persist(ideas);
  return idea;
}

export function updateIdea(id: string, updates: Partial<Idea>): Idea | null {
  const ideas = load();
  const idx = ideas.findIndex(i => i.id === id);
  if (idx === -1) return null;

  ideas[idx] = {
    ...ideas[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate score if scoring changed
  if (updates.effortScore || updates.impactScore || updates.alignmentScore) {
    ideas[idx].totalScore = calculateScore(
      ideas[idx].effortScore,
      ideas[idx].impactScore,
      ideas[idx].alignmentScore
    );
  }

  persist(ideas);
  return ideas[idx];
}

export function deleteIdea(id: string): void {
  persist(load().filter(i => i.id !== id));
}

export function getTopIdeas(n = 5): Idea[] {
  return getIdeas()
    .filter(i => i.status === "captured" || i.status === "evaluating")
    .slice(0, n);
}

export function getIdeasByStatus(status: IdeaStatus): Idea[] {
  return getIdeas().filter(i => i.status === status);
}

export function getIdeaStats() {
  const all = load();
  return {
    total: all.length,
    captured: all.filter(i => i.status === "captured").length,
    building: all.filter(i => i.status === "building").length,
    parked: all.filter(i => i.status === "parked").length,
    avgScore: all.length ? Math.round((all.reduce((s, i) => s + i.totalScore, 0) / all.length) * 10) / 10 : 0,
  };
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert, dbDelete } from "./supabase";

export function syncIdeaToCloud(idea: Idea): void {
  dbUpsert("ideas", idea.id, idea);
}
export function deleteIdeaFromCloud(id: string): void {
  dbDelete("ideas", id);
}

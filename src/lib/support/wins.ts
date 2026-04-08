// CORE BRIM TECH OS — Support Module: Portfolio/Wins Logger
import { getSupabaseClient, dbUpsert, dbDelete } from "../supabase";

export type WinType = "hackathon" | "grant" | "client" | "product" | "media" | "partnership" | "award" | "milestone";

export interface Win {
  id: string;
  type: WinType;
  title: string;
  description: string;
  value?: number;
  date: string;
  proof?: string;
  tags: string[];
  featured: boolean;
  lessonsLearned?: string;
  whatWorked?: string;
  createdAt: string;
}

const WIN_KEY = "cbt_os_wins";

function syncUpsert(id: string, data: Win): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbUpsert("wins", id, data).catch(() => {});
}

function syncDelete(id: string): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbDelete("wins", id).catch(() => {});
}

export function getWins(): Win[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WIN_KEY) || "[]")
      .sort((a: Win, b: Win) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

export function addWin(win: Omit<Win, "id" | "createdAt">): Win {
  const wins = getWins();
  const newWin: Win = { ...win, id: `win_${Date.now()}`, createdAt: new Date().toISOString() };
  wins.unshift(newWin);
  localStorage.setItem(WIN_KEY, JSON.stringify(wins));
  syncUpsert(newWin.id, newWin);
  return newWin;
}

export function updateWin(id: string, updates: Partial<Win>): void {
  const wins = getWins();
  const idx = wins.findIndex(w => w.id === id);
  if (idx >= 0) {
    wins[idx] = { ...wins[idx], ...updates };
    localStorage.setItem(WIN_KEY, JSON.stringify(wins));
    syncUpsert(id, wins[idx]);
  }
}

export function deleteWin(id: string): void {
  localStorage.setItem(WIN_KEY, JSON.stringify(getWins().filter(w => w.id !== id)));
  syncDelete(id);
}

export function getWinStats() {
  const wins = getWins();
  return {
    total: wins.length,
    totalValue: wins.reduce((s, w) => s + (w.value || 0), 0),
    hackathons: wins.filter(w => w.type === "hackathon").length,
    grants: wins.filter(w => w.type === "grant").length,
    clients: wins.filter(w => w.type === "client").length,
    featured: wins.filter(w => w.featured).length,
  };
}

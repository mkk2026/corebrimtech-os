// CORE BRIM TECH OS — Research Storage (localStorage for now, Supabase later)
import type { ResearchReport } from "./research-engine";

const STORAGE_KEY = "cbt_os_research_library";

export function saveReport(report: ResearchReport): void {
  const library = getLibrary();
  library.unshift(report); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function getLibrary(): ResearchReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getReport(id: string): ResearchReport | null {
  return getLibrary().find((r) => r.id === id) || null;
}

export function deleteReport(id: string): void {
  const library = getLibrary().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function searchLibrary(query: string): ResearchReport[] {
  const q = query.toLowerCase();
  return getLibrary().filter(
    (r) =>
      r.topic.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.keyFindings.some((f) => f.toLowerCase().includes(q))
  );
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert } from "./supabase";

export function syncReportToLibraryCloud(id: string, data: object): void {
  dbUpsert("research_library", id, data);
}

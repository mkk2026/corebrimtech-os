// CORE BRIM TECH OS — Support Module: Knowledge Base
import { getSupabaseClient, dbUpsert, dbUpsertMany, dbDelete } from "../supabase";

export type KBCategory = "hackathon" | "grant" | "sales" | "product" | "operations" | "finance" | "marketing" | "general";

export interface KBEntry {
  id: string;
  title: string;
  content: string;
  category: KBCategory;
  tags: string[];
  source?: string;
  linkedWinId?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const KB_KEY = "cbt_os_knowledge_base";

function syncUpsert(id: string, data: KBEntry): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbUpsert("knowledge_base", id, data).catch(() => {});
}

function syncUpsertMany(records: KBEntry[]): void {
  const client = getSupabaseClient();
  if (!client || records.length === 0) return;
  void dbUpsertMany("knowledge_base", records.map(r => ({ id: r.id, data: r }))).catch(() => {});
}

function syncDelete(id: string): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbDelete("knowledge_base", id).catch(() => {});
}

function initKB(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KB_KEY)) return;
  
  const starter: KBEntry[] = [
    {
      id: "kb_1",
      title: "What makes a winning hackathon project",
      content: "1. Solve a real problem in the theme. 2. Demo that works — judges don't read code. 3. Clear impact story — who benefits and how much. 4. African/emerging market angle = differentiation. 5. Team story matters — why are YOU the right person to build this?",
      category: "hackathon",
      tags: ["winning", "strategy"],
      source: "CBT research",
      pinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "kb_2",
      title: "Grant application must-haves",
      content: "Every winning grant application has: (1) Clear problem statement with data, (2) Specific solution — not vague, (3) Measurable impact metrics, (4) Team credibility — why us, (5) Realistic budget breakdown, (6) Sustainability plan — what happens after the grant. Most applications fail on #4 and #5.",
      category: "grant",
      tags: ["applications", "strategy"],
      source: "CBT research",
      pinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "kb_3",
      title: "Proposal language that closes clients",
      content: "Lead with their problem, not your solution. Use 'you' 3x more than 'we'. Include a specific timeline. State the price clearly — don't hide it. End with ONE clear CTA. Follow up in exactly 3 days if no response. Short proposals win over long ones.",
      category: "sales",
      tags: ["proposals", "closing"],
      source: "Sales research",
      pinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "kb_4",
      title: "Tony Elumelu Foundation — what they want",
      content: "TEF funds African entrepreneurs with strong social impact. Key: (1) Be authentically African — your story matters, (2) Show employment creation potential, (3) Highlight sustainability beyond the grant, (4) Keep language simple and direct, (5) Video pitch should be personal and confident — not scripted. Deadline is typically January.",
      category: "grant",
      tags: ["TEF", "africa"],
      source: "TEF research",
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  
  localStorage.setItem(KB_KEY, JSON.stringify(starter));
  syncUpsertMany(starter);
}

export function getKBEntries(): KBEntry[] {
  if (typeof window === "undefined") return [];
  initKB();
  try {
    return JSON.parse(localStorage.getItem(KB_KEY) || "[]")
      .sort((a: KBEntry, b: KBEntry) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  } catch {
    return [];
  }
}

export function addKBEntry(entry: Omit<KBEntry, "id" | "createdAt" | "updatedAt">): KBEntry {
  const entries = getKBEntries();
  const newEntry: KBEntry = {
    ...entry,
    id: `kb_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.unshift(newEntry);
  localStorage.setItem(KB_KEY, JSON.stringify(entries));
  syncUpsert(newEntry.id, newEntry);
  return newEntry;
}

export function updateKBEntry(id: string, updates: Partial<KBEntry>): void {
  const entries = getKBEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(KB_KEY, JSON.stringify(entries));
    syncUpsert(id, entries[idx]);
  }
}

export function deleteKBEntry(id: string): void {
  localStorage.setItem(KB_KEY, JSON.stringify(getKBEntries().filter(e => e.id !== id)));
  syncDelete(id);
}

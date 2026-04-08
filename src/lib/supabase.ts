// CORE BRIM TECH OS — Supabase Client & Database Layer
// Drop-in replacement for all localStorage operations
// Write-through: localStorage (fast) + Supabase (persistent)

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── CLIENT SETUP ──────────────────────────────────────────────────────────────

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your_supabase_url") return null;

  _client = createClient(url, key);
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url";
}

// ── TABLE NAMES ───────────────────────────────────────────────────────────────

export type TableName =
  | "founder_brain"
  | "sessions"
  | "tasks"
  | "decisions"
  | "ideas"
  | "goals"
  | "grants"
  | "clients"
  | "revenue"
  | "hackathon_projects"
  | "hackathon_listings"
  | "competitor_reports"
  | "research_library"
  | "wins"
  | "knowledge_base"
  | "sops"
  | "notifications"
  | "templates"
  | "scheduler";

// ── CORE DB OPERATIONS ────────────────────────────────────────────────────────

/**
 * Upsert a single record by id
 * Falls back gracefully if Supabase not configured
 */
export async function dbUpsert(table: TableName, id: string, data: object): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb.from(table).upsert({ id, data, updated_at: new Date().toISOString() });
    if (error) console.warn(`[CBT-DB] upsert ${table}:${id}`, error.message);
  } catch (e) {
    console.warn(`[CBT-DB] upsert failed ${table}`, e);
  }
}

/**
 * Upsert multiple records at once
 */
export async function dbUpsertMany(table: TableName, records: { id: string; data: object }[]): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb || records.length === 0) return;
  try {
    const rows = records.map(r => ({ id: r.id, data: r.data, updated_at: new Date().toISOString() }));
    const { error } = await sb.from(table).upsert(rows);
    if (error) console.warn(`[CBT-DB] upsertMany ${table}`, error.message);
  } catch (e) {
    console.warn(`[CBT-DB] upsertMany failed ${table}`, e);
  }
}

/**
 * Fetch all records from a table
 */
export async function dbFetchAll<T>(table: TableName): Promise<T[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from(table).select("data").order("created_at", { ascending: false });
    if (error) { console.warn(`[CBT-DB] fetchAll ${table}`, error.message); return []; }
    return (data || []).map((row: { data: T }) => row.data);
  } catch (e) {
    console.warn(`[CBT-DB] fetchAll failed ${table}`, e);
    return [];
  }
}

/**
 * Fetch a single record by id
 */
export async function dbFetchOne<T>(table: TableName, id: string): Promise<T | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from(table).select("data").eq("id", id).single();
    if (error) return null;
    return data?.data as T || null;
  } catch { return null; }
}

/**
 * Delete a record by id
 */
export async function dbDelete(table: TableName, id: string): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    const { error } = await sb.from(table).delete().eq("id", id);
    if (error) console.warn(`[CBT-DB] delete ${table}:${id}`, error.message);
  } catch (e) {
    console.warn(`[CBT-DB] delete failed ${table}`, e);
  }
}

/**
 * Special case for founder_brain (single record, no id needed)
 */
export async function dbSaveBrain(data: object): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) return;
  try {
    // Get existing record or insert new
    const { data: existing } = await sb.from("founder_brain").select("id").limit(1).single();
    if (existing?.id) {
      await sb.from("founder_brain").update({ data, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await sb.from("founder_brain").insert({ data, updated_at: new Date().toISOString() });
    }
  } catch (e) {
    console.warn("[CBT-DB] saveBrain failed", e);
  }
}

export async function dbLoadBrain<T>(): Promise<T | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from("founder_brain").select("data").limit(1).single();
    if (error) return null;
    return data?.data as T || null;
  } catch { return null; }
}

// ── SYNC ENGINE ───────────────────────────────────────────────────────────────
// On app load, pull latest data from Supabase and merge with localStorage
// This ensures data is always fresh across devices

export interface SyncStatus {
  lastSync: string | null;
  syncing: boolean;
  error: string | null;
  tablesSync: Partial<Record<TableName, number>>;
}

const SYNC_STATUS_KEY = "cbt_os_sync_status";

export function getSyncStatus(): SyncStatus {
  if (typeof window === "undefined") return { lastSync: null, syncing: false, error: null, tablesSync: {} };
  try {
    return JSON.parse(localStorage.getItem(SYNC_STATUS_KEY) || "{}");
  } catch {
    return { lastSync: null, syncing: false, error: null, tablesSync: {} };
  }
}

export function setSyncStatus(updates: Partial<SyncStatus>): void {
  if (typeof window === "undefined") return;
  const current = getSyncStatus();
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({ ...current, ...updates }));
}

// Map of table → localStorage key
const TABLE_TO_LOCALSTORAGE: Partial<Record<TableName, string>> = {
  sessions:            "cbt_os_sessions",
  tasks:               "cbt_os_tasks",
  decisions:           "cbt_os_decisions",
  ideas:               "cbt_os_ideas",
  goals:               "cbt_os_goals",
  grants:              "cbt_os_grants",
  clients:             "cbt_os_clients",
  revenue:             "cbt_os_revenue",
  hackathon_projects:  "cbt_os_hackathon_projects",
  hackathon_listings:  "cbt_os_hackathon_listings",
  competitor_reports:  "cbt_os_competitor_reports",
  research_library:    "cbt_os_research_library",
  wins:                "cbt_os_wins",
  knowledge_base:      "cbt_os_knowledge_base",
  sops:                "cbt_os_sops",
  notifications:       "cbt_os_notifications",
  templates:           "cbt_os_templates",
  scheduler:           "cbt_os_scheduler",
};

/**
 * Pull all data from Supabase and populate localStorage
 * Run this once on app startup
 */
export async function syncFromSupabase(): Promise<{ success: boolean; tablesSync: Partial<Record<TableName, number>> }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, tablesSync: {} };

  setSyncStatus({ syncing: true, error: null });
  const tablesSync: Partial<Record<TableName, number>> = {};

  try {
    // Sync founder brain
    const brain = await dbLoadBrain();
    if (brain) {
      localStorage.setItem("cbt_os_founder_brain", JSON.stringify(brain));
      tablesSync["founder_brain"] = 1;
    }

    // Sync all array tables
    for (const [table, lsKey] of Object.entries(TABLE_TO_LOCALSTORAGE) as [TableName, string][]) {
      const records = await dbFetchAll(table);
      if (records.length > 0) {
        localStorage.setItem(lsKey, JSON.stringify(records));
        tablesSync[table] = records.length;
      }
    }

    setSyncStatus({
      syncing: false,
      lastSync: new Date().toISOString(),
      tablesSync,
      error: null,
    });

    return { success: true, tablesSync };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    setSyncStatus({ syncing: false, error: msg });
    return { success: false, tablesSync };
  }
}

/**
 * Push all localStorage data to Supabase
 * Run this when first setting up Supabase (migrate existing data)
 */
export async function pushLocalToSupabase(): Promise<{ success: boolean; pushed: number }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, pushed: 0 };

  let pushed = 0;

  try {
    // Push founder brain
    const brainRaw = localStorage.getItem("cbt_os_founder_brain");
    if (brainRaw) {
      await dbSaveBrain(JSON.parse(brainRaw));
      pushed++;
    }

    // Push all array tables
    for (const [table, lsKey] of Object.entries(TABLE_TO_LOCALSTORAGE) as [TableName, string][]) {
      const raw = localStorage.getItem(lsKey);
      if (!raw) continue;
      const records: ({ id: string } & object)[] = JSON.parse(raw);
      if (!Array.isArray(records) || records.length === 0) continue;

      const upsertRows = records.map(r => ({
        id: r.id || `migrated_${Date.now()}_${Math.random()}`,
        data: r,
      }));

      // Upsert in batches of 50
      for (let i = 0; i < upsertRows.length; i += 50) {
        const batch = upsertRows.slice(i, i + 50);
        await dbUpsertMany(table, batch);
        pushed += batch.length;
      }
    }

    return { success: true, pushed };
  } catch (e) {
    console.error("[CBT-DB] push failed", e);
    return { success: false, pushed };
  }
}

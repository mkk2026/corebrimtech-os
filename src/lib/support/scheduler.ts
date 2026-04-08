// CORE BRIM TECH OS — Support Module: Scheduler & Data Export
import { getSupabaseClient, dbUpsert, dbUpsertMany } from "../supabase";

export interface ScheduledJob {
  id: string;
  skillId: string;
  skillName: string;
  schedule: string;
  nextRun: string;
  lastRun?: string;
  enabled: boolean;
  runCount: number;
}

const SCHEDULER_KEY = "cbt_os_scheduler";

function syncUpsert(id: string, data: ScheduledJob): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbUpsert("scheduler", id, data).catch(() => {});
}

function syncUpsertMany(jobs: ScheduledJob[]): void {
  const client = getSupabaseClient();
  if (!client || jobs.length === 0) return;
  void dbUpsertMany("scheduler", jobs.map(j => ({ id: j.id, data: j }))).catch(() => {});
}

export function getScheduledJobs(): ScheduledJob[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SCHEDULER_KEY) || "[]");
  } catch {
    return [];
  }
}

export function initScheduler(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SCHEDULER_KEY)) return;

  const now = new Date();
  const tomorrow6am = new Date(now);
  tomorrow6am.setDate(tomorrow6am.getDate() + 1);
  tomorrow6am.setHours(6, 0, 0, 0);

  const tomorrow7am = new Date(tomorrow6am);
  tomorrow7am.setHours(7, 0, 0, 0);

  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay() + 1) % 7 || 7);
  nextMonday.setHours(7, 0, 0, 0);

  const nextSunday = new Date(now);
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7 || 7);
  nextSunday.setHours(18, 0, 0, 0);

  const jobs: ScheduledJob[] = [
    {
      id: "job_1",
      skillId: "skill_grant_drafter",
      skillName: "Grant Drafter",
      schedule: "daily_6am",
      nextRun: tomorrow6am.toISOString(),
      enabled: true,
      runCount: 0,
    },
    {
      id: "job_2",
      skillId: "skill_opportunity_scanner",
      skillName: "Opportunity Scanner",
      schedule: "daily_7am",
      nextRun: tomorrow7am.toISOString(),
      enabled: true,
      runCount: 0,
    },
    {
      id: "job_3",
      skillId: "skill_competitor_monitor",
      skillName: "Competitor Monitor",
      schedule: "weekly_monday",
      nextRun: nextMonday.toISOString(),
      enabled: true,
      runCount: 0,
    },
    {
      id: "job_4",
      skillId: "skill_weekly_report",
      skillName: "Weekly Reporter",
      schedule: "weekly_sunday",
      nextRun: nextSunday.toISOString(),
      enabled: true,
      runCount: 0,
    },
  ];

  localStorage.setItem(SCHEDULER_KEY, JSON.stringify(jobs));
  syncUpsertMany(jobs);
}

export function toggleJob(id: string): void {
  const jobs = getScheduledJobs();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx >= 0) {
    jobs[idx].enabled = !jobs[idx].enabled;
    localStorage.setItem(SCHEDULER_KEY, JSON.stringify(jobs));
    syncUpsert(id, jobs[idx]);
  }
}

export function logJobRun(skillId: string): void {
  const jobs = getScheduledJobs();
  const job = jobs.find(j => j.skillId === skillId);
  if (!job) return;

  job.lastRun = new Date().toISOString();
  job.runCount += 1;

  const next = new Date();
  if (job.schedule.startsWith("daily")) {
    next.setDate(next.getDate() + 1);
    next.setHours(job.schedule.includes("6am") ? 6 : 7, 0, 0, 0);
  } else if (job.schedule === "weekly_monday") {
    next.setDate(next.getDate() + 7);
  } else if (job.schedule === "weekly_sunday") {
    next.setDate(next.getDate() + 7);
  }

  job.nextRun = next.toISOString();
  localStorage.setItem(SCHEDULER_KEY, JSON.stringify(jobs));
  syncUpsert(job.id, job);
}

// ═══════════════════════════════════════════════════════════════
// DATA EXPORT
// ═══════════════════════════════════════════════════════════════

export interface ExportBundle {
  exportedAt: string;
  version: string;
  data: Record<string, unknown>;
}

const EXPORT_KEYS = [
  "cbt_os_founder_brain",
  "cbt_os_sessions",
  "cbt_os_tasks",
  "cbt_os_decisions",
  "cbt_os_ideas",
  "cbt_os_goals",
  "cbt_os_grants",
  "cbt_os_clients",
  "cbt_os_revenue",
  "cbt_os_hackathon_projects",
  "cbt_os_hackathon_listings",
  "cbt_os_competitor_reports",
  "cbt_os_research_library",
  "cbt_os_skills",
  "cbt_os_skill_runs",
  "cbt_os_wins",
  "cbt_os_knowledge_base",
  "cbt_os_sops",
  "cbt_os_templates",
  "cbt_os_notifications",
  "cbt_os_scheduler",
];

export function exportAllData(): ExportBundle {
  if (typeof window === "undefined") {
    return { exportedAt: new Date().toISOString(), version: "3.0", data: {} };
  }

  const data: Record<string, unknown> = {};
  EXPORT_KEYS.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  });

  return { exportedAt: new Date().toISOString(), version: "3.0", data };
}

export function downloadJSON(bundle: ExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cbt-os-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(bundle: ExportBundle): void {
  if (typeof window === "undefined") return;
  Object.entries(bundle.data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
}

export function exportCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify((row as Record<string, unknown>)[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

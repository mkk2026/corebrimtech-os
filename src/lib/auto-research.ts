/**
 * Auto-research seed scan.
 *
 * Fired (un-awaited) when onboarding completes. Reuses the founder's company
 * context to populate REAL competitor/market signal so the Command Center is
 * alive on first landing. No mock data: with no key/no company we skip and say so.
 *
 *   company ─▶ seedAutoResearch ─▶ runScan ─▶ saveReport/addMarketGap ─▶ banner
 *      │             │                │                                    │
 * [blank?→skip] [no key?→needs-key] [throws?→failed+Retry]          [found(n) / failed]
 *               [flag off?→skip]    [progress?→researching(msg)]
 *               [seeded?→skip]
 *
 * The branchy guard/error logic is pure and injected (testable without network);
 * production wiring lives in `seedAutoResearchLive` below.
 */

import { z } from "zod";
import type { SeedStatus } from "./seed-scan-store";
import { getSeedStatus, setSeedStatus } from "./seed-scan-store";
import { complete, getActiveProvider } from "./llm";
import { saveReport, type CompetitorReport } from "./competitor-intelligence";
import { addMarketGap } from "./market-gap-scanner";
import { getBrain, saveBrain } from "./founder-brain";
import { isFeatureEnabled } from "./feature-flags";

export interface SeedScanResult {
  competitors: number;
  gaps: number;
}

export interface SeedCompany {
  name: string;
  tagline: string;
}

export interface SeedAutoResearchDeps {
  /** Is the auto-research feature flag on? */
  isEnabled: () => boolean;
  /** Has this brain already been seeded (dedup guard)? */
  alreadySeeded: () => boolean;
  /** Is an AI API key configured? */
  hasKey: () => boolean;
  /** Company context to seed the scan from. */
  getCompany: () => SeedCompany | null;
  /** Persist the dedup flag (only called on success). */
  markSeeded: () => void;
  /** Push a status update to the banner store. */
  emit: (status: SeedStatus) => void;
  /** Drive the real scan; reports progress for the streaming reveal. */
  runScan: (company: SeedCompany, onProgress: (message: string) => void) => Promise<SeedScanResult>;
  /** Optional structured logger. */
  log?: (message: string, context?: unknown) => void;
}

export async function seedAutoResearch(deps: SeedAutoResearchDeps): Promise<void> {
  const log = deps.log ?? (() => {});

  if (!deps.isEnabled()) return void log("auto-research: flag off");
  if (deps.alreadySeeded()) return void log("auto-research: already seeded");

  const company = deps.getCompany();
  if (!company || !company.name.trim()) return void log("auto-research: no company name");

  if (!deps.hasKey()) {
    deps.emit({ phase: "needs-key" });
    return void log("auto-research: no API key");
  }

  deps.emit({ phase: "researching", message: "Researching your market…" });
  log("auto-research: started", { company: company.name });

  try {
    const result = await deps.runScan(company, (message) => {
      deps.emit({ phase: "researching", message });
    });
    deps.markSeeded();
    deps.emit({ phase: "found", competitors: result.competitors, gaps: result.gaps });
    log("auto-research: done", result);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "Research failed. Try again.";
    deps.emit({ phase: "failed", reason });
    log("auto-research: failed", reason);
  }
}

// ── Production wiring ──────────────────────────────────────────────────────────

const scanSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().default(""),
        threatAssessment: z.string().default(""),
        strengths: z.array(z.string()).default([]),
        weaknesses: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  gaps: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().default(""),
        evidence: z.array(z.string()).default([]),
        keywords: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});

/** Pull the first JSON object out of an LLM response that may wrap it in prose/fences. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

function toReport(c: z.infer<typeof scanSchema>["competitors"][number]): CompetitorReport {
  const now = new Date().toISOString();
  return {
    id: `report_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    competitorId: `comp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    competitorName: c.name,
    generatedAt: now,
    recentReleases: [],
    pricingChanges: [],
    teamChanges: [],
    marketingMoves: [],
    fundingNews: [],
    currentStrengths: c.strengths,
    currentWeaknesses: c.weaknesses,
    threatAssessment: c.threatAssessment,
    counterStrategies: [],
    opportunities: [],
    warnings: [],
    overallSummary: c.description,
    sourcesChecked: 0,
    confidenceScore: 50,
  };
}

/** Production scan: one focused LLM call, validated, mapped into real reports/gaps. */
async function runScanLive(
  company: SeedCompany,
  onProgress: (message: string) => void,
): Promise<SeedScanResult> {
  onProgress("Analyzing your market…");
  const context = company.tagline ? `${company.name} — ${company.tagline}` : company.name;
  const text = await complete({
    prompt:
      `You are scouting the market for the startup: ${context}.\n` +
      `Identify up to 3 real direct competitors and up to 3 concrete market gaps (unmet needs).\n` +
      `Return ONLY a JSON object: {"competitors":[{"name","description","threatAssessment","strengths":[],"weaknesses":[]}],` +
      `"gaps":[{"title","description","evidence":[],"keywords":[]}]}.`,
    maxTokens: 1500,
  });

  let parsed: z.infer<typeof scanSchema>;
  try {
    parsed = scanSchema.parse(JSON.parse(extractJson(text)));
  } catch {
    throw new Error("Could not read the research results. Try again.");
  }

  let competitors = 0;
  for (const c of parsed.competitors) {
    onProgress(`Found competitor: ${c.name}`);
    saveReport(toReport(c));
    competitors++;
  }

  let gaps = 0;
  for (const g of parsed.gaps) {
    onProgress(`Spotted a gap: ${g.title}`);
    addMarketGap({
      title: g.title,
      description: g.description,
      category: "unmet_need",
      source: "manual",
      urgency: "emerging",
      evidence: g.evidence,
      volume: 50,
      sentiment: "neutral",
      keywords: g.keywords,
      relatedToProduct: true,
      fitScore: 60,
    });
    gaps++;
  }

  return { competitors, gaps };
}

/** Fire-and-forget entrypoint called when onboarding completes. */
export function seedAutoResearchLive(): Promise<void> {
  // In-flight guard: never run two scans at once (ready-screen fire + Retry).
  if (getSeedStatus().phase === "researching") return Promise.resolve();
  return seedAutoResearch({
    isEnabled: () => isFeatureEnabled("autoResearch"),
    alreadySeeded: () => !!getBrain()?.seededAt,
    hasKey: () => getActiveProvider() !== null,
    getCompany: () => {
      const brain = getBrain();
      return brain ? { name: brain.companyName, tagline: brain.companyTagline } : null;
    },
    markSeeded: () => {
      const brain = getBrain();
      if (brain) saveBrain({ ...brain, seededAt: new Date().toISOString() });
    },
    emit: setSeedStatus,
    runScan: runScanLive,
    log: (message, context) => console.warn(`[CBT-seed] ${message}`, context ?? ""),
  });
}

/**
 * Co-founder context aggregator.
 *
 * Builds one compact, token-bounded snapshot of "everything about this startup" from the existing
 * module stores, for both the reactive chat engine and the proactive signal engine to ground on.
 *
 * No mock data: every source is optional. A missing or empty store yields a null section (rendered
 * as "not set yet"), never a fabricated value and never a throw.
 */

import { getBrain } from "@/lib/founder-brain";
import { getBurnStats } from "@/lib/burn-rate";
import { getPipelineStats } from "@/lib/deal-pipeline";
import { getGoalStats } from "@/lib/goals";
import { getEnergyStats } from "@/lib/energy-tracker";
import { getDecisionStats } from "@/lib/decision-journal";
import { getWeeklyReviewStats, getReviewStreak } from "@/lib/weekly-review";
import { getMarketGaps } from "@/lib/market-gap-scanner";
import { getCompetitorReports } from "@/lib/competitor-intelligence";

export interface FounderContext {
  company: { name: string; tagline: string; mission: string; stage: string; founderName: string } | null;
  burn: { runwayMonths: number; monthlyBurn: number; monthlyRevenue: number; isProfitable: boolean } | null;
  deals: { pipelineValue: number; weightedValue: number } | null;
  goals: { active: number; avgProgress: number; atRisk: number } | null;
  energy: { avgEnergy: number; streak: number } | null;
  decisions: { total: number } | null;
  weekly: { completed: number; streak: number } | null;
  market: { competitors: number; gaps: number; topGaps: string[]; topCompetitors: string[] } | null;
}

/** Run a source getter, swallowing any failure into null (defensive aggregation). */
function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export function buildFounderContext(): FounderContext {
  const brain = safe(getBrain);
  const burn = safe(getBurnStats);
  const pipeline = safe(getPipelineStats);
  const goals = safe(getGoalStats);
  const energy = safe(getEnergyStats);
  const decisions = safe(getDecisionStats);
  const weekly = safe(getWeeklyReviewStats);
  const reviewStreak = safe(getReviewStreak) ?? 0;
  const gaps = safe(getMarketGaps) ?? [];
  const competitors = safe(getCompetitorReports) ?? [];

  return {
    company: brain && brain.companyName
      ? { name: brain.companyName, tagline: brain.companyTagline ?? "", mission: brain.companyMission ?? "", stage: brain.stage, founderName: brain.founders?.[0]?.name ?? "" }
      : null,
    burn: burn && (burn.totalExpenses > 0 || burn.totalRevenueStreams > 0)
      ? { runwayMonths: burn.runwayMonths, monthlyBurn: burn.monthlyBurn, monthlyRevenue: burn.monthlyRevenue, isProfitable: burn.isProfitable }
      : null,
    deals: pipeline && (pipeline.totalValue > 0 || pipeline.weightedValue > 0)
      ? { pipelineValue: pipeline.totalValue, weightedValue: Math.round(pipeline.weightedValue) }
      : null,
    goals: goals && goals.total > 0
      ? { active: goals.active, avgProgress: goals.avgProgress, atRisk: goals.atRisk }
      : null,
    energy: energy && energy.totalEntries > 0
      ? { avgEnergy: Math.round(energy.avgEnergy * 10) / 10, streak: energy.streak }
      : null,
    decisions: decisions && decisions.total > 0 ? { total: decisions.total } : null,
    weekly: weekly && (weekly.completed > 0 || weekly.total > 0)
      ? { completed: weekly.completed, streak: reviewStreak }
      : null,
    market: gaps.length > 0 || competitors.length > 0
      ? {
          competitors: competitors.length,
          gaps: gaps.length,
          topGaps: gaps.slice(0, 3).map((g) => g.title),
          topCompetitors: competitors.slice(0, 3).map((c) => c.competitorName),
        }
      : null,
  };
}

/** Render the context as a compact, bounded prompt block for the co-founder system prompt. */
export function renderContextPrompt(ctx: FounderContext): string {
  const lines: string[] = [];

  if (ctx.company) {
    lines.push(`Company: ${ctx.company.name}${ctx.company.tagline ? ` — ${ctx.company.tagline}` : ""} (stage: ${ctx.company.stage}).`);
    if (ctx.company.founderName) lines.push(`Founder: ${ctx.company.founderName}.`);
    if (ctx.company.mission) lines.push(`Mission: ${ctx.company.mission}.`);
  }
  if (ctx.burn) {
    lines.push(`Finances: ${ctx.burn.isProfitable ? "profitable" : `${ctx.burn.runwayMonths} months runway`}, monthly burn $${ctx.burn.monthlyBurn}, monthly revenue $${ctx.burn.monthlyRevenue}.`);
  }
  if (ctx.deals) {
    lines.push(`Pipeline: $${ctx.deals.pipelineValue} active, $${ctx.deals.weightedValue} weighted.`);
  }
  if (ctx.goals) {
    lines.push(`Goals: ${ctx.goals.active} active at ${ctx.goals.avgProgress}% avg progress, ${ctx.goals.atRisk} at risk.`);
  }
  if (ctx.energy) {
    lines.push(`Energy: averaging ${ctx.energy.avgEnergy}/5 (${ctx.energy.streak}-day streak).`);
  }
  if (ctx.decisions) {
    lines.push(`Decisions logged: ${ctx.decisions.total}.`);
  }
  if (ctx.weekly) {
    lines.push(`Weekly reviews: ${ctx.weekly.completed} completed (${ctx.weekly.streak}-week streak).`);
  }
  if (ctx.market) {
    const gapList = ctx.market.topGaps.length ? ` (e.g. ${ctx.market.topGaps.join("; ")})` : "";
    lines.push(`Market: ${ctx.market.competitors} competitors tracked, ${ctx.market.gaps} gaps${gapList}.`);
  }

  if (lines.length === 0) {
    return "The founder hasn't entered any data yet — encourage them to set up their company profile and modules so you can help with specifics.";
  }
  return lines.join("\n");
}

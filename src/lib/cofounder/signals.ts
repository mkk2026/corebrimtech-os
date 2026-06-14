/**
 * Proactive signal engine — the difference between a chatbot and a co-founder.
 *
 * Pure rules over the aggregated FounderContext (A1). Each rule fires only when the relevant real
 * data is present (no mock data → no data simply produces no nudge). Output is sorted by severity
 * so the most urgent thing the co-founder should raise comes first.
 *
 * Stable ids per rule let the dock (A5) dedup / snooze without nagging.
 */

import { buildFounderContext, type FounderContext } from "./context";

export type NudgeSeverity = "high" | "medium" | "low";

export interface Nudge {
  id: string;
  severity: NudgeSeverity;
  message: string;
  actionLabel: string;
  targetModule: string;
}

const RUNWAY_ALERT_MONTHS = 4;
const LOW_ENERGY_THRESHOLD = 2.5;

const SEVERITY_RANK: Record<NudgeSeverity, number> = { high: 0, medium: 1, low: 2 };

export function detectSignals(ctx: FounderContext): Nudge[] {
  const nudges: Nudge[] = [];

  if (ctx.burn && !ctx.burn.isProfitable && ctx.burn.runwayMonths <= RUNWAY_ALERT_MONTHS) {
    nudges.push({
      id: "runway",
      severity: "high",
      message: `Runway is ${ctx.burn.runwayMonths} months and you're not profitable yet — time to extend it or cut burn.`,
      actionLabel: "Review burn rate",
      targetModule: "burnrate",
    });
  }

  if (ctx.burn && !ctx.burn.isProfitable && !ctx.deals) {
    nudges.push({
      id: "empty-pipeline",
      severity: "medium",
      message: "You're burning cash with no active deals in the pipeline. Let's build it.",
      actionLabel: "Open deal pipeline",
      targetModule: "pipeline",
    });
  }

  if (ctx.goals && ctx.goals.atRisk > 0) {
    nudges.push({
      id: "goals-at-risk",
      severity: "medium",
      message: `${ctx.goals.atRisk} of your goals are at risk. Worth a look before they slip.`,
      actionLabel: "Review goals",
      targetModule: "goals",
    });
  }

  if (ctx.energy && ctx.energy.avgEnergy < LOW_ENERGY_THRESHOLD) {
    nudges.push({
      id: "low-energy",
      severity: "medium",
      message: `Your energy's been low (${ctx.energy.avgEnergy}/5). Protect your peak hours and rest.`,
      actionLabel: "Check energy patterns",
      targetModule: "energy",
    });
  }

  if (ctx.weekly && ctx.weekly.streak === 0) {
    nudges.push({
      id: "no-weekly",
      severity: "low",
      message: "You haven't closed out a weekly review lately. Five minutes keeps the compass true.",
      actionLabel: "Do weekly review",
      targetModule: "weeklyreview",
    });
  }

  if (ctx.market && ctx.market.gaps > 0) {
    nudges.push({
      id: "market-gaps",
      severity: "low",
      message: `${ctx.market.gaps} market gap${ctx.market.gaps === 1 ? "" : "s"} in your space worth exploring.`,
      actionLabel: "See market gaps",
      targetModule: "marketgaps",
    });
  }

  return nudges.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

/** Production entrypoint: detect signals from the live founder context. */
export function detectSignalsLive(): Nudge[] {
  return detectSignals(buildFounderContext());
}

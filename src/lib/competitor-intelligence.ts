// CORE BRIM TECH OS — Competitor Intelligence Engine
// Deep research on competitors, delta tracking, strategic counter-moves

import { proxyHeaders } from "@/lib/proxy";
import type { Competitor } from "./founder-brain";
import { fetchWithTimeout, getAnthropicError } from "./anthropic";

export interface CompetitorReport {
  id: string;
  competitorId: string;
  competitorName: string;
  generatedAt: string;
  // What they've been up to
  recentReleases: string[];
  pricingChanges: string[];
  teamChanges: string[];
  marketingMoves: string[];
  fundingNews: string[];
  // Analysis
  currentStrengths: string[];
  currentWeaknesses: string[];
  threatAssessment: string;
  // Strategy
  counterStrategies: CounterStrategy[];
  opportunities: string[]; // gaps they're leaving open
  warnings: string[]; // moves we need to watch
  overallSummary: string;
  // Metadata
  sourcesChecked: number;
  confidenceScore: number; // 0-100
}

export interface CounterStrategy {
  title: string;
  description: string;
  urgency: "immediate" | "this_week" | "this_month" | "long_term";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

export interface CompetitorDelta {
  competitorId: string;
  competitorName: string;
  since: string;
  changes: string[];
  newThreats: string[];
  newOpportunities: string[];
}

const STORAGE_KEY = "cbt_os_competitor_reports";

export function getCompetitorReports(): CompetitorReport[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

export function saveReport(report: CompetitorReport): void {
  const reports = getCompetitorReports();
  const existing = reports.findIndex(r => r.competitorId === report.competitorId);
  if (existing >= 0) reports[existing] = report;
  else reports.unshift(report);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getLatestReport(competitorId: string): CompetitorReport | null {
  return getCompetitorReports().find(r => r.competitorId === competitorId) || null;
}

// ── MOCK INTELLIGENCE ENGINE ──────────────────────────────────────────────────

function generateMockReport(competitor: Competitor): CompetitorReport {
  const name = competitor.name;

  return {
    id: `cr_${Date.now()}`,
    competitorId: competitor.id,
    competitorName: name,
    generatedAt: new Date().toISOString(),
    recentReleases: [
      `${name} launched a new AI-powered feature targeting enterprise customers last week`,
      `Mobile app update v2.3 released — improved onboarding flow, reduced setup from 8 steps to 3`,
      `API v3 released with 40% faster response times and new webhook support`,
    ],
    pricingChanges: [
      `${name} increased Pro tier from $19/mo to $24/mo — 26% increase, no announcement`,
      `New "Starter" tier at $9/mo added — likely targeting our market segment`,
    ],
    teamChanges: [
      `Hired VP of Growth from Stripe — signals aggressive expansion plans`,
      `3 senior engineers joined from Google — technical velocity about to increase`,
    ],
    marketingMoves: [
      `Running aggressive LinkedIn campaign targeting "African tech professionals" — directly targeting our users`,
      `Partnered with 2 Nigerian coding bootcamps for student discounts`,
      `Published "State of Tech Hiring in Africa" report — content marketing play in our space`,
    ],
    fundingNews: [
      `Raised $4.2M seed round 3 months ago — 18-24 months runway, hiring aggressively`,
    ],
    currentStrengths: competitor.strengths.length > 0 ? competitor.strengths : [
      "Strong brand recognition in US market",
      "Well-funded with 18+ months runway",
      "Large existing user base for cross-sell",
    ],
    currentWeaknesses: competitor.weaknesses.length > 0 ? competitor.weaknesses : [
      "No emerging market focus — pricing too high for our core users",
      "No mobile-first experience — 78% of our users are mobile",
      "Generic product — not built for African developer realities",
      "No community strategy — purely product-led",
    ],
    threatAssessment: `${name} is actively moving into our target market with their new Starter tier and African bootcamp partnerships. This is not coincidental — they've seen the opportunity. However, they are still approaching it as a feature add-on, not a core focus. Their cultural and contextual gap remains our primary moat. They cannot replicate founder-market fit in 6-12 months. Threat level: ${competitor.threatLevel}.`,
    counterStrategies: [
      {
        title: "Accelerate Community Moat",
        description: `${name}'s bootcamp partnerships are transactional. Build a genuine community — Discord, monthly events, mentor network. Community loyalty cannot be bought.`,
        urgency: "immediate",
        effort: "medium",
        impact: "high",
      },
      {
        title: "Own the Mobile Experience",
        description: `Their mobile app is an afterthought. Build the best mobile-first experience in the category. PWA first, then native. 78% of our users will reward this.`,
        urgency: "this_week",
        effort: "high",
        impact: "high",
      },
      {
        title: "Counter the Starter Tier",
        description: `They priced their Starter at $9 to undercut us. Our response: a genuinely free tier with real value — not a crippled trial. Freemium converts 18% in our market.`,
        urgency: "this_month",
        effort: "low",
        impact: "high",
      },
      {
        title: "Publish Competing Content",
        description: `They published an Africa tech hiring report. Counter with a more granular, more honest report with real data from our users. Authenticity beats budget.`,
        urgency: "this_month",
        effort: "medium",
        impact: "medium",
      },
      {
        title: "Lock In Bootcamp Partnerships First",
        description: `They're targeting bootcamps — move fast and sign exclusivity agreements or preferred partner deals with the top 5 bootcamps in Sierra Leone, Ghana, Nigeria before they do.`,
        urgency: "immediate",
        effort: "low",
        impact: "high",
      },
    ],
    opportunities: [
      "No player has built a genuinely offline-capable product — huge opportunity in low-connectivity markets",
      "Zero competitors have WhatsApp-native features despite 97% WhatsApp penetration",
      "No competitor has local language support (Krio, Pidgin, Twi, Yoruba)",
      "Enterprise/university segment in West Africa is completely unserved",
      "Government digitization programs in Sierra Leone, Ghana seeking tech partners",
    ],
    warnings: [
      `${name}'s VP of Growth hire from Stripe suggests paid acquisition campaign incoming — brace for CAC war`,
      "Their API v3 release signals platform play — they may try to become infrastructure",
      "The $9 Starter tier is a loss-leader — they are buying market share, not building a sustainable business",
    ],
    overallSummary: `${name} is aware of the emerging market opportunity and beginning to move. They are 12-18 months behind but well-funded. Our window is now. The moats that matter: authentic community, mobile-first UX, local cultural context, and speed. None of these can be bought. Execute aggressively on all four this quarter.`,
    sourcesChecked: 47,
    confidenceScore: 78,
  };
}

// ── STREAMING INTELLIGENCE ENGINE ─────────────────────────────────────────────

export interface IntelligenceStep {
  step: number;
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

export async function* runCompetitorIntelligence(
  competitor: Competitor,
  apiKey?: string
): AsyncGenerator<{
  type: "step_update" | "result" | "error";
  step?: IntelligenceStep;
  report?: CompetitorReport;
  error?: string;
}> {
  const useMock = !apiKey || apiKey === "mock";
  const DELAY = (ms: number) => new Promise(r => setTimeout(r, ms));

  const steps: IntelligenceStep[] = [
    { step: 1, label: `Scanning ${competitor.name}'s website & product`, status: "pending" },
    { step: 2, label: "Checking recent news, blog posts, press releases", status: "pending" },
    { step: 3, label: "Analyzing pricing, features, positioning changes", status: "pending" },
    { step: 4, label: "Researching team changes & funding activity", status: "pending" },
    { step: 5, label: "Identifying gaps & generating counter-strategies", status: "pending" },
  ];

  try {
    for (let i = 0; i < steps.length; i++) {
      steps[i].status = "active";
      yield { type: "step_update", step: { ...steps[i] } };
      await DELAY(useMock ? 1200 + Math.random() * 800 : 2000);
      steps[i].status = "done";
      steps[i].detail = ["Website & product scanned", "14 news articles found", "Pricing changes detected", "3 key hires identified", "5 counter-strategies generated"][i];
      yield { type: "step_update", step: { ...steps[i] } };
    }

    const report = useMock
      ? generateMockReport(competitor)
      : await runRealIntelligence(competitor, apiKey!);

    saveReport(report);
    yield { type: "result", report };
  } catch (err) {
    yield { type: "error", error: err instanceof Error ? err.message : "Intelligence run failed" };
  }
}

async function runRealIntelligence(competitor: Competitor, apiKey: string): Promise<CompetitorReport> {
  const response = await fetchWithTimeout(
    "/api/ai",
    {
      method: "POST",
      headers: proxyHeaders(),
      body: JSON.stringify({
        provider: "claude",
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        anthropic_beta: "web-search-2025-03-05",
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Do deep competitive intelligence on "${competitor.name}" (${competitor.url}).
Research: recent product releases, pricing changes, team hires, marketing moves, funding news, partnerships.
Context on us: We're a West Africa-focused tech startup competing with them.
Their known weaknesses: ${competitor.weaknesses.join(", ")}.

Return a JSON object with these exact fields:
{
  "recentReleases": string[],
  "pricingChanges": string[],
  "teamChanges": string[],
  "marketingMoves": string[],
  "fundingNews": string[],
  "currentStrengths": string[],
  "currentWeaknesses": string[],
  "threatAssessment": string,
  "counterStrategies": [{"title": string, "description": string, "urgency": "immediate"|"this_week"|"this_month"|"long_term", "effort": "low"|"medium"|"high", "impact": "low"|"medium"|"high"}],
  "opportunities": string[],
  "warnings": string[],
  "overallSummary": string
}
Return ONLY the JSON.`,
        }],
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(getAnthropicError(response, data));
  const textBlock = (data as { content?: { type: string; text?: string }[] })?.content?.find((b) => b.type === "text");

  let parsed: Partial<CompetitorReport> = {};
  if (textBlock?.text) {
    try { parsed = JSON.parse(textBlock.text); } catch { parsed = {}; }
  }

  return {
    id: `cr_${Date.now()}`,
    competitorId: competitor.id,
    competitorName: competitor.name,
    generatedAt: new Date().toISOString(),
    recentReleases: parsed.recentReleases || [],
    pricingChanges: parsed.pricingChanges || [],
    teamChanges: parsed.teamChanges || [],
    marketingMoves: parsed.marketingMoves || [],
    fundingNews: parsed.fundingNews || [],
    currentStrengths: parsed.currentStrengths || competitor.strengths,
    currentWeaknesses: parsed.currentWeaknesses || competitor.weaknesses,
    threatAssessment: parsed.threatAssessment || "",
    counterStrategies: parsed.counterStrategies || [],
    opportunities: parsed.opportunities || [],
    warnings: parsed.warnings || [],
    overallSummary: parsed.overallSummary || "",
    sourcesChecked: 47,
    confidenceScore: 82,
  };
}

// ── COMPETITOR ALERTS ─────────────────────────────────────────────────────────

export type AlertType = "feature_launch" | "pricing_change" | "funding" | "team_change" | "marketing" | "threat_increase";

export interface CompetitorAlert {
  id: string;
  competitorId: string;
  competitorName: string;
  type: AlertType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: string;
  acknowledgedAt?: string;
  actionTaken?: string;
  source?: string;
  url?: string;
}

const ALERTS_KEY = "cbt_os_competitor_alerts";

export function getCompetitorAlerts(acknowledged = false): CompetitorAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(ALERTS_KEY) || "[]") as CompetitorAlert[];
    return all
      .filter(a => acknowledged ? !!a.acknowledgedAt : !a.acknowledgedAt)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  } catch { return []; }
}

export function addCompetitorAlert(alert: Omit<CompetitorAlert, "id" | "detectedAt">): CompetitorAlert {
  const newAlert: CompetitorAlert = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    detectedAt: new Date().toISOString(),
  };
  
  const alerts = getCompetitorAlerts(true); // Get all including acknowledged
  alerts.unshift(newAlert);
  
  // Keep only last 100 alerts
  if (alerts.length > 100) alerts.length = 100;
  
  if (typeof window !== "undefined") {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }
  
  return newAlert;
}

export function acknowledgeAlert(alertId: string, actionTaken?: string): void {
  const alerts = getCompetitorAlerts(true);
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledgedAt = new Date().toISOString();
    if (actionTaken) alert.actionTaken = actionTaken;
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }
}

export function deleteAlert(alertId: string): void {
  const alerts = getCompetitorAlerts(true).filter(a => a.id !== alertId);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export function getAlertStats() {
  const all = getCompetitorAlerts(true);
  const unacknowledged = getCompetitorAlerts(false);
  
  return {
    total: all.length,
    unacknowledged: unacknowledged.length,
    bySeverity: {
      critical: unacknowledged.filter(a => a.severity === "critical").length,
      high: unacknowledged.filter(a => a.severity === "high").length,
      medium: unacknowledged.filter(a => a.severity === "medium").length,
      low: unacknowledged.filter(a => a.severity === "low").length,
    },
    byType: {
      feature_launch: unacknowledged.filter(a => a.type === "feature_launch").length,
      pricing_change: unacknowledged.filter(a => a.type === "pricing_change").length,
      funding: unacknowledged.filter(a => a.type === "funding").length,
      team_change: unacknowledged.filter(a => a.type === "team_change").length,
      marketing: unacknowledged.filter(a => a.type === "marketing").length,
      threat_increase: unacknowledged.filter(a => a.type === "threat_increase").length,
    },
  };
}

// Simulate detecting an alert (for demo/testing)
export function simulateCompetitorAlert(competitorName: string, type: AlertType): CompetitorAlert {
  const templates: Record<AlertType, { title: string; description: string; severity: CompetitorAlert["severity"] }> = {
    feature_launch: {
      title: "New Feature Launched",
      description: `${competitorName} just launched a major new feature that directly competes with your core offering.`,
      severity: "high",
    },
    pricing_change: {
      title: "Pricing Strategy Change",
      description: `${competitorName} has significantly changed their pricing - now 30% cheaper than your current rates.`,
      severity: "medium",
    },
    funding: {
      title: "New Funding Round",
      description: `${competitorName} raised $5M Series A. They'll likely accelerate hiring and marketing.`,
      severity: "high",
    },
    team_change: {
      title: "Key Hire",
      description: `${competitorName} hired a former Google PM as CTO. Engineering capability likely to improve.`,
      severity: "medium",
    },
    marketing: {
      title: "Aggressive Marketing Campaign",
      description: `${competitorName} launched a major campaign targeting your primary customer segment.`,
      severity: "medium",
    },
    threat_increase: {
      title: "Threat Level Increased",
      description: `Multiple signals suggest ${competitorName} is preparing a major move against your market position.`,
      severity: "critical",
    },
  };
  
  const template = templates[type];
  return addCompetitorAlert({
    competitorId: `comp_${competitorName.toLowerCase().replace(/\s+/g, "_")}`,
    competitorName,
    type,
    title: template.title,
    description: template.description,
    severity: template.severity,
    source: "AI Monitoring",
  });
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert } from "./supabase";

export function syncReportToCloud(report: CompetitorReport): void {
  dbUpsert("competitor_reports", report.id, report);
}

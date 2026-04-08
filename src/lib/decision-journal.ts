// CORE BRIM TECH OS — Decision Journal
// Track decisions, outcomes, and learn patterns

export type DecisionCategory = "product" | "hiring" | "funding" | "marketing" | "sales" | "strategy" | "operations" | "personal";
export type DecisionImpact = "low" | "medium" | "high" | "critical";
export type DecisionStatus = "pending" | "implemented" | "reversed" | "cancelled";

export interface Decision {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  impact: DecisionImpact;
  status: DecisionStatus;
  decidedAt: string;
  expectedOutcome: string;
  actualOutcome?: string;
  outcomeNotes?: string;
  lessonsLearned?: string;
  wouldRepeat: boolean | null;
  reviewedAt?: string;
  context: string; // What was happening at the time
  alternatives: string[];
  stakeholders: string[];
}

export interface DecisionStats {
  total: number;
  byCategory: Record<DecisionCategory, number>;
  byImpact: Record<DecisionImpact, number>;
  byStatus: Record<DecisionStatus, number>;
  repeatRate: number; // % of decisions you'd repeat
  pendingReview: number;
  highImpactPending: number;
}

const DECISIONS_KEY = "cbt_os_decisions";

export function getDecisions(): Decision[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DECISIONS_KEY) || "[]")
      .sort((a: Decision, b: Decision) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());
  } catch { return []; }
}

export function addDecision(decision: Omit<Decision, "id" | "decidedAt" | "status">): Decision {
  const newDecision: Decision = {
    ...decision,
    id: `decision_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    decidedAt: new Date().toISOString(),
    status: "pending",
  };
  
  const decisions = getDecisions();
  decisions.unshift(newDecision);
  
  if (decisions.length > 200) decisions.length = 200;
  
  if (typeof window !== "undefined") {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
  }
  
  return newDecision;
}

export function updateDecision(id: string, updates: Partial<Decision>): void {
  const decisions = getDecisions();
  const idx = decisions.findIndex(d => d.id === id);
  if (idx >= 0) {
    decisions[idx] = { ...decisions[idx], ...updates };
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
  }
}

export function deleteDecision(id: string): void {
  const decisions = getDecisions().filter(d => d.id !== id);
  localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
}

export function getDecisionStats(): DecisionStats {
  const decisions = getDecisions();
  const reviewed = decisions.filter(d => d.wouldRepeat !== null);
  
  return {
    total: decisions.length,
    byCategory: {
      product: decisions.filter(d => d.category === "product").length,
      hiring: decisions.filter(d => d.category === "hiring").length,
      funding: decisions.filter(d => d.category === "funding").length,
      marketing: decisions.filter(d => d.category === "marketing").length,
      sales: decisions.filter(d => d.category === "sales").length,
      strategy: decisions.filter(d => d.category === "strategy").length,
      operations: decisions.filter(d => d.category === "operations").length,
      personal: decisions.filter(d => d.category === "personal").length,
    },
    byImpact: {
      low: decisions.filter(d => d.impact === "low").length,
      medium: decisions.filter(d => d.impact === "medium").length,
      high: decisions.filter(d => d.impact === "high").length,
      critical: decisions.filter(d => d.impact === "critical").length,
    },
    byStatus: {
      pending: decisions.filter(d => d.status === "pending").length,
      implemented: decisions.filter(d => d.status === "implemented").length,
      reversed: decisions.filter(d => d.status === "reversed").length,
      cancelled: decisions.filter(d => d.status === "cancelled").length,
    },
    repeatRate: reviewed.length > 0 
      ? Math.round((reviewed.filter(d => d.wouldRepeat).length / reviewed.length) * 100)
      : 0,
    pendingReview: decisions.filter(d => d.status === "implemented" && !d.reviewedAt).length,
    highImpactPending: decisions.filter(d => d.impact === "critical" && d.status === "pending").length,
  };
}

// Get decisions that need review (implemented but not reviewed)
export function getDecisionsNeedingReview(): Decision[] {
  return getDecisions().filter(d => d.status === "implemented" && !d.reviewedAt);
}

// Get pattern insights
export function getDecisionPatterns(): { category: DecisionCategory; repeatRate: number; total: number }[] {
  const decisions = getDecisions().filter(d => d.wouldRepeat !== null);
  const categories: DecisionCategory[] = ["product", "hiring", "funding", "marketing", "sales", "strategy", "operations", "personal"];
  
  return categories.map(cat => {
    const catDecisions = decisions.filter(d => d.category === cat);
    return {
      category: cat,
      repeatRate: catDecisions.length > 0 
        ? Math.round((catDecisions.filter(d => d.wouldRepeat).length / catDecisions.length) * 100)
        : 0,
      total: catDecisions.length,
    };
  }).filter(p => p.total > 0).sort((a, b) => b.repeatRate - a.repeatRate);
}

// Sample decisions for first-time users
export const SAMPLE_DECISIONS: Omit<Decision, "id" | "decidedAt" | "status">[] = [
  {
    title: "Pivot from B2C to B2B",
    description: "Shifted target market from individual consumers to enterprise customers",
    category: "strategy",
    impact: "critical",
    expectedOutcome: "Higher LTV, longer sales cycles but bigger deals",
    actualOutcome: "Closed 3 enterprise clients in first month, 10x revenue per customer",
    lessonsLearned: "B2B sales cycle is longer but worth it. Need dedicated sales person.",
    wouldRepeat: true,
    context: "B2C acquisition costs were unsustainable",
    alternatives: ["Keep grinding B2C", "Shut down", "Raise more for marketing"],
    stakeholders: ["Co-founder", "Advisor"],
  },
  {
    title: "Hired first employee",
    description: "Brought on full-stack developer as employee #1",
    category: "hiring",
    impact: "high",
    expectedOutcome: "2x development velocity",
    actualOutcome: "1.5x velocity but huge knowledge transfer value",
    lessonsLearned: "First hire should be someone who can work independently",
    wouldRepeat: true,
    context: "Founder was bottleneck on all technical decisions",
    alternatives: ["Keep solo", "Hire contractor", "Outsource"],
    stakeholders: ["Co-founder"],
  },
];

export function initializeSampleDecisions(): void {
  const existing = getDecisions();
  if (existing.length === 0) {
    SAMPLE_DECISIONS.forEach(d => addDecision(d));
  }
}

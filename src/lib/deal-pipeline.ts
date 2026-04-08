// CORE BRIM TECH OS — Deal Pipeline CRM
// Track leads from first contact to closed deal

export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
export type DealSource = "outbound" | "inbound" | "referral" | "event" | "partner" | "other";

export interface Deal {
  id: string;
  company: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  title?: string; // Their job title
  value: number; // Expected deal value
  stage: DealStage;
  source: DealSource;
  probability: number; // 0-100
  expectedCloseDate: string;
  actualCloseDate?: string;
  createdAt: string;
  lastContactAt: string;
  notes: string;
  nextAction?: string;
  nextActionDate?: string;
  lostReason?: string;
  tags: string[];
}

export interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  byStage: Record<DealStage, { count: number; value: number }>;
  bySource: Record<DealSource, number>;
  winRate: number;
  avgDealSize: number;
  avgSalesCycle: number; // days
  dealsNeedingAttention: number;
}

const DEALS_KEY = "cbt_os_deals";

export function getDeals(): Deal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEALS_KEY) || "[]")
      .sort((a: Deal, b: Deal) => new Date(b.lastContactAt).getTime() - new Date(a.lastContactAt).getTime());
  } catch { return []; }
}

export function addDeal(deal: Omit<Deal, "id" | "createdAt" | "lastContactAt">): Deal {
  const now = new Date().toISOString();
  const newDeal: Deal = {
    ...deal,
    id: `deal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    lastContactAt: now,
  };
  
  const deals = getDeals();
  deals.unshift(newDeal);
  
  if (deals.length > 500) deals.length = 500;
  
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
  return newDeal;
}

export function updateDeal(id: string, updates: Partial<Deal>): void {
  const deals = getDeals();
  const idx = deals.findIndex(d => d.id === id);
  if (idx >= 0) {
    deals[idx] = { ...deals[idx], ...updates, lastContactAt: new Date().toISOString() };
    localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
  }
}

export function moveDealStage(id: string, newStage: DealStage): void {
  const deals = getDeals();
  const deal = deals.find(d => d.id === id);
  if (!deal) return;
  
  const updates: Partial<Deal> = { stage: newStage };
  
  if (newStage === "closed_won" || newStage === "closed_lost") {
    updates.actualCloseDate = new Date().toISOString();
    updates.probability = newStage === "closed_won" ? 100 : 0;
  }
  
  updateDeal(id, updates);
}

export function deleteDeal(id: string): void {
  const deals = getDeals().filter(d => d.id !== id);
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
}

export function getPipelineStats(): PipelineStats {
  const deals = getDeals();
  const activeDeals = deals.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost");
  const wonDeals = deals.filter(d => d.stage === "closed_won");
  const lostDeals = deals.filter(d => d.stage === "closed_lost");
  const closedDeals = [...wonDeals, ...lostDeals];
  
  const totalValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = activeDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
  
  const stages: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
  const byStage = Object.fromEntries(
    stages.map(stage => [
      stage,
      {
        count: deals.filter(d => d.stage === stage).length,
        value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
      },
    ])
  ) as Record<DealStage, { count: number; value: number }>;
  
  const sources: DealSource[] = ["outbound", "inbound", "referral", "event", "partner", "other"];
  const bySource = Object.fromEntries(
    sources.map(source => [
      source,
      deals.filter(d => d.source === source).length,
    ])
  ) as Record<DealSource, number>;
  
  // Calculate average sales cycle
  let avgSalesCycle = 0;
  if (closedDeals.length > 0) {
    const cycles = closedDeals.map(d => {
      const created = new Date(d.createdAt).getTime();
      const closed = new Date(d.actualCloseDate || d.createdAt).getTime();
      return (closed - created) / (1000 * 60 * 60 * 24);
    });
    avgSalesCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
  }
  
  // Deals needing attention (no contact in 7 days and not closed)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dealsNeedingAttention = activeDeals.filter(
    d => new Date(d.lastContactAt) < sevenDaysAgo
  ).length;
  
  return {
    totalDeals: activeDeals.length,
    totalValue,
    weightedValue,
    byStage,
    bySource,
    winRate: closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0,
    avgDealSize: wonDeals.length > 0 ? Math.round(wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length) : 0,
    avgSalesCycle,
    dealsNeedingAttention,
  };
}

export function getDealsByStage(stage: DealStage): Deal[] {
  return getDeals().filter(d => d.stage === stage);
}

export function getDealsNeedingAttention(): Deal[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return getDeals().filter(
    d => d.stage !== "closed_won" && 
         d.stage !== "closed_lost" &&
         new Date(d.lastContactAt) < sevenDaysAgo
  );
}

export function getUpcomingActions(): Deal[] {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  return getDeals().filter(
    d => d.nextActionDate && 
         new Date(d.nextActionDate) >= today &&
         new Date(d.nextActionDate) <= threeDaysFromNow
  ).sort((a, b) => new Date(a.nextActionDate!).getTime() - new Date(b.nextActionDate!).getTime());
}

// Stage configuration
export const STAGE_CONFIG: Record<DealStage, { label: string; color: string; probability: number }> = {
  lead: { label: "Lead", color: "text-neutral-400", probability: 10 },
  qualified: { label: "Qualified", color: "text-blue-400", probability: 25 },
  proposal: { label: "Proposal Sent", color: "text-amber-400", probability: 50 },
  negotiation: { label: "Negotiation", color: "text-purple-400", probability: 75 },
  closed_won: { label: "Closed Won", color: "text-emerald-400", probability: 100 },
  closed_lost: { label: "Closed Lost", color: "text-red-400", probability: 0 },
};

export const SOURCE_LABELS: Record<DealSource, string> = {
  outbound: "Outbound",
  inbound: "Inbound",
  referral: "Referral",
  event: "Event",
  partner: "Partner",
  other: "Other",
};

// Sample deals
export const SAMPLE_DEALS: Omit<Deal, "id" | "createdAt" | "lastContactAt">[] = [
  {
    company: "Acme Corp",
    contactName: "John Smith",
    contactEmail: "john@acme.com",
    title: "CTO",
    value: 25000,
    stage: "negotiation",
    source: "referral",
    probability: 75,
    expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "They love the product. Negotiating on implementation timeline.",
    nextAction: "Send revised proposal",
    nextActionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["enterprise", "priority"],
  },
  {
    company: "TechStart Inc",
    contactName: "Sarah Johnson",
    contactEmail: "sarah@techstart.io",
    title: "CEO",
    value: 12000,
    stage: "proposal",
    source: "inbound",
    probability: 50,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Requested custom integration. Pricing discussion next.",
    nextAction: "Schedule technical call",
    nextActionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["startup"],
  },
  {
    company: "Global Systems",
    contactName: "Mike Chen",
    value: 50000,
    stage: "qualified",
    source: "outbound",
    probability: 25,
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Initial call went well. Need to understand procurement process.",
    tags: ["enterprise", "complex"],
  },
];

export function initializeSampleDeals(): void {
  const existing = getDeals();
  if (existing.length === 0) {
    SAMPLE_DEALS.forEach(d => addDeal(d));
  }
}

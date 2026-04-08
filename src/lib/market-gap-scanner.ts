// CORE BRIM TECH OS — Market Gap Scanner
// Find opportunities by analyzing what people complain about

export type GapSource = "twitter" | "reddit" | "hackernews" | "linkedin" | "producthunt" | "manual";
export type GapCategory = "feature_request" | "pain_point" | "unmet_need" | "competitor_weakness" | "trend";
export type GapUrgency = "emerging" | "growing" | "mature" | "saturated";

export interface MarketGap {
  id: string;
  title: string;
  description: string;
  category: GapCategory;
  source: GapSource;
  sourceUrl?: string;
  urgency: GapUrgency;
  evidence: string[]; // Quotes, links, etc
  volume: number; // 1-100, how many people talking about this
  sentiment: "frustrated" | "hopeful" | "neutral";
  keywords: string[];
  relatedToProduct: boolean;
  fitScore: number; // 0-100, how well it fits CBT
  actionTaken?: string;
  discoveredAt: string;
  lastUpdatedAt: string;
}

const GAPS_KEY = "cbt_os_market_gaps";

export function getMarketGaps(onlyRelated = false): MarketGap[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(GAPS_KEY) || "[]") as MarketGap[];
    return all
      .filter(g => !onlyRelated || g.relatedToProduct)
      .sort((a, b) => b.fitScore - a.fitScore);
  } catch { return []; }
}

export function addMarketGap(gap: Omit<MarketGap, "id" | "discoveredAt" | "lastUpdatedAt">): MarketGap {
  const newGap: MarketGap = {
    ...gap,
    id: `gap_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    discoveredAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
  
  const gaps = getMarketGaps(true);
  gaps.unshift(newGap);
  
  // Keep only last 200 gaps
  if (gaps.length > 200) gaps.length = 200;
  
  if (typeof window !== "undefined") {
    localStorage.setItem(GAPS_KEY, JSON.stringify(gaps));
  }
  
  return newGap;
}

export function updateMarketGap(id: string, updates: Partial<MarketGap>): void {
  const gaps = getMarketGaps(true);
  const idx = gaps.findIndex(g => g.id === id);
  if (idx >= 0) {
    gaps[idx] = { ...gaps[idx], ...updates, lastUpdatedAt: new Date().toISOString() };
    localStorage.setItem(GAPS_KEY, JSON.stringify(gaps));
  }
}

export function deleteMarketGap(id: string): void {
  const gaps = getMarketGaps(true).filter(g => g.id !== id);
  localStorage.setItem(GAPS_KEY, JSON.stringify(gaps));
}

export function getMarketGapStats() {
  const gaps = getMarketGaps(true);
  const related = gaps.filter(g => g.relatedToProduct);
  
  return {
    total: gaps.length,
    relatedToProduct: related.length,
    highFit: gaps.filter(g => g.fitScore >= 70).length,
    byCategory: {
      feature_request: gaps.filter(g => g.category === "feature_request").length,
      pain_point: gaps.filter(g => g.category === "pain_point").length,
      unmet_need: gaps.filter(g => g.category === "unmet_need").length,
      competitor_weakness: gaps.filter(g => g.category === "competitor_weakness").length,
      trend: gaps.filter(g => g.category === "trend").length,
    },
    byUrgency: {
      emerging: gaps.filter(g => g.urgency === "emerging").length,
      growing: gaps.filter(g => g.urgency === "growing").length,
      mature: gaps.filter(g => g.urgency === "mature").length,
      saturated: gaps.filter(g => g.urgency === "saturated").length,
    },
    bySource: {
      twitter: gaps.filter(g => g.source === "twitter").length,
      reddit: gaps.filter(g => g.source === "reddit").length,
      hackernews: gaps.filter(g => g.source === "hackernews").length,
      linkedin: gaps.filter(g => g.source === "linkedin").length,
      producthunt: gaps.filter(g => g.source === "producthunt").length,
      manual: gaps.filter(g => g.source === "manual").length,
    },
  };
}

// Curated market gaps for African tech / emerging markets
export const CURATED_MARKET_GAPS: Omit<MarketGap, "id" | "discoveredAt" | "lastUpdatedAt">[] = [
  {
    title: "Offline-First SaaS for Africa",
    description: "Most African users have intermittent connectivity. Apps that work offline and sync when connected are desperately needed.",
    category: "unmet_need",
    source: "hackernews",
    urgency: "growing",
    evidence: [
      "'Our biggest churn reason is users in areas with poor connectivity' - African fintech founder",
      "Reddit r/africa: 'Why don't apps work offline in 2024?'",
    ],
    volume: 85,
    sentiment: "frustrated",
    keywords: ["offline", "connectivity", "africa", "sync"],
    relatedToProduct: true,
    fitScore: 90,
  },
  {
    title: "Local Payment Integration Pain",
    description: "Startups struggle to integrate local payment methods (M-Pesa, MTN Mobile Money) with international platforms.",
    category: "pain_point",
    source: "reddit",
    urgency: "mature",
    evidence: [
      "'Stripe doesn't work here, and local APIs are terrible' - founder on IndieHackers",
      "Twitter: 'Building fintech in Africa = payment integration hell'",
    ],
    volume: 95,
    sentiment: "frustrated",
    keywords: ["payments", "mpesa", "mobile money", "integration"],
    relatedToProduct: true,
    fitScore: 85,
  },
  {
    title: "Affordable AI for Small Businesses",
    description: "SMBs in emerging markets want AI tools but can't afford $20/month ChatGPT Plus or enterprise pricing.",
    category: "unmet_need",
    source: "twitter",
    urgency: "emerging",
    evidence: [
      "'I'd use AI if it wasn't 2x my monthly revenue' - small business owner",
      "Product Hunt comments: 'Too expensive for markets like India, Nigeria'",
    ],
    volume: 70,
    sentiment: "hopeful",
    keywords: ["ai", "affordable", "smb", "pricing"],
    relatedToProduct: true,
    fitScore: 95,
  },
  {
    title: "Multi-Currency Invoicing Headaches",
    description: "Freelancers and agencies serving international clients struggle with currency conversion, taxes, and compliance.",
    category: "pain_point",
    source: "linkedin",
    urgency: "growing",
    evidence: [
      "'Invoicing in USD, getting paid in local currency, accounting in both = nightmare'",
      "Reddit r/freelance: 'How do you handle multi-currency?' weekly posts",
    ],
    volume: 80,
    sentiment: "frustrated",
    keywords: ["invoicing", "currency", "freelance", "compliance"],
    relatedToProduct: true,
    fitScore: 80,
  },
  {
    title: "Grant Discovery Fragmentation",
    description: "Founders spend hours searching for grants across dozens of sites. No centralized, curated database exists.",
    category: "competitor_weakness",
    source: "twitter",
    urgency: "mature",
    evidence: [
      "'I found 3 perfect grants after they closed. No alerts, no aggregation.'",
      "IndieHackers: 'Built a scraper just to track grants for my startup'",
    ],
    volume: 60,
    sentiment: "frustrated",
    keywords: ["grants", "discovery", "funding", "aggregation"],
    relatedToProduct: true,
    fitScore: 100,
  },
  {
    title: "Technical Co-Founder Search",
    description: "Non-technical founders in Africa struggle to find technical co-founders. Existing platforms don't serve this market well.",
    category: "unmet_need",
    source: "reddit",
    urgency: "mature",
    evidence: [
      "r/startups: 'How do I find a technical co-founder in Lagos?'",
      "'Y Combinator for Africa needs a co-founder matching feature'",
    ],
    volume: 90,
    sentiment: "hopeful",
    keywords: ["co-founder", "technical", "matching", "networking"],
    relatedToProduct: false,
    fitScore: 40,
  },
  {
    title: "Regulatory Compliance Automation",
    description: "Startups waste weeks understanding local regulations (data privacy, business registration, taxes).",
    category: "pain_point",
    source: "hackernews",
    urgency: "growing",
    evidence: [
      "'Spent 3 months just on compliance before writing a line of code'",
      "Twitter: 'Every African country has different data laws, no clear guides'",
    ],
    volume: 75,
    sentiment: "frustrated",
    keywords: ["compliance", "regulation", "legal", "automation"],
    relatedToProduct: false,
    fitScore: 50,
  },
  {
    title: "Remote Team Management for Africa",
    description: "Managing remote teams across African time zones with poor infrastructure is uniquely challenging.",
    category: "pain_point",
    source: "linkedin",
    urgency: "emerging",
    evidence: [
      "'Power outages, internet issues, timezone chaos - remote work in Africa is hard'",
      "'Slack doesn't work well on 2G networks'",
    ],
    volume: 65,
    sentiment: "frustrated",
    keywords: ["remote", "team", "management", "infrastructure"],
    relatedToProduct: false,
    fitScore: 45,
  },
  {
    title: "Localized AI Training Data",
    description: "AI models perform poorly on African languages, accents, and contexts. Local training data is scarce.",
    category: "unmet_need",
    source: "twitter",
    urgency: "emerging",
    evidence: [
      "'Speech recognition fails on Nigerian accents'",
      "'GPT-4 thinks Pidgin is broken English'",
    ],
    volume: 55,
    sentiment: "hopeful",
    keywords: ["ai", "localization", "languages", "training data"],
    relatedToProduct: false,
    fitScore: 60,
  },
  {
    title: "Simple Analytics for Non-Tech Founders",
    description: "Google Analytics is too complex. Founders want simple, actionable metrics without the learning curve.",
    category: "competitor_weakness",
    source: "producthunt",
    urgency: "mature",
    evidence: [
      "'I just want to know: how many visitors, where from, what did they do?'",
      "Product Hunt: 'Another analytics tool that's too complicated'",
    ],
    volume: 85,
    sentiment: "frustrated",
    keywords: ["analytics", "simple", "metrics", "dashboard"],
    relatedToProduct: true,
    fitScore: 75,
  },
];

// Initialize curated gaps if none exist
export function initializeMarketGaps(): void {
  const existing = getMarketGaps(true);
  if (existing.length === 0) {
    CURATED_MARKET_GAPS.forEach(gap => addMarketGap(gap));
  }
}

// Get high-opportunity gaps (high fit + growing/emerging)
export function getHighOpportunityGaps(): MarketGap[] {
  return getMarketGaps(true)
    .filter(g => g.fitScore >= 70 && ["emerging", "growing"].includes(g.urgency))
    .slice(0, 10);
}

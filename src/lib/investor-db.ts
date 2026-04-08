// CORE BRIM TECH OS — Investor Database
// Live funding opportunities for African and emerging market startups

export type InvestorType = "vc" | "angel" | "accelerator" | "grant" | "impact" | "corporate";
export type InvestmentStage = "pre-seed" | "seed" | "series-a" | "series-b" | "growth";
export type CheckSize = "10k-50k" | "50k-250k" | "250k-1m" | "1m-5m" | "5m+";

export interface Investor {
  id: string;
  name: string;
  type: InvestorType;
  description: string;
  website: string;
  location: string; // "Pan-Africa", "Nigeria", "Global", etc
  stages: InvestmentStage[];
  checkSizes: CheckSize[];
  sectors: string[]; // "fintech", "healthtech", "agritech", etc
  thesis: string; // What they invest in
  notableInvestments: string[];
  contactEmail?: string;
  applicationUrl?: string;
  openForApplications: boolean;
  nextDeadline?: string;
  requirements: string[];
  fitScore: number; // 0-100, calculated based on CBT profile
  fitReason: string;
  lastUpdated: string;
  isActive: boolean;
}

export interface InvestmentOpportunity {
  id: string;
  investorId: string;
  investorName: string;
  title: string;
  type: "open" | "deadline_soon" | "new_program";
  amount?: string;
  deadline?: string;
  description: string;
  url: string;
  fitScore: number;
  createdAt: string;
}

// Curated investor database for African/emerging market founders
export const INVESTOR_DATABASE: Omit<Investor, "id" | "fitScore" | "fitReason" | "lastUpdated">[] = [
  {
    name: "Launch Africa Ventures",
    type: "vc",
    description: "Leading early-stage VC focused exclusively on African tech startups. $36M fund investing in pre-seed to Series A.",
    website: "https://launchafricaventures.com",
    location: "Pan-Africa",
    stages: ["pre-seed", "seed", "series-a"],
    checkSizes: ["250k-1m", "1m-5m"],
    sectors: ["fintech", "healthtech", "edtech", "logistics", "agritech"],
    thesis: "Technology companies solving fundamental problems for African markets with scalable business models",
    notableInvestments: ["Chipper Cash", "Kuda", "Wave"],
    contactEmail: "invest@launchafricaventures.com",
    openForApplications: true,
    requirements: ["African market focus", "Product in market", "Revenue or strong traction"],
    isActive: true,
  },
  {
    name: "Future Africa",
    type: "vc",
    description: "Community-powered VC fund backing exceptional African founders at the earliest stages. $10M+ deployed.",
    website: "https://future.africa",
    location: "Nigeria / Pan-Africa",
    stages: ["pre-seed", "seed"],
    checkSizes: ["50k-250k", "250k-1m"],
    sectors: ["fintech", "climate", "health", "education", "infrastructure"],
    thesis: "Founders building the future of Africa, solving problems they deeply understand",
    notableInvestments: ["Paystack", "Kobo360", "Helium Health"],
    applicationUrl: "https://future.africa/apply",
    openForApplications: true,
    requirements: ["African founder", "Full-time commitment", "Clear problem insight"],
    isActive: true,
  },
  {
    name: "Y Combinator",
    type: "accelerator",
    description: "World's top startup accelerator. $500k investment for 7%. Remote-first batches.",
    website: "https://ycombinator.com",
    location: "Global (Remote)",
    stages: ["pre-seed", "seed"],
    checkSizes: ["250k-1m"],
    sectors: ["all"],
    thesis: "Ambitious founders building technology companies that can scale globally",
    notableInvestments: ["Stripe", "Airbnb", "Flutterwave", "Paystack"],
    applicationUrl: "https://apply.ycombinator.com",
    openForApplications: true,
    nextDeadline: "Rolling applications",
    requirements: ["Technical co-founder", "Working prototype", "Clear growth path"],
    isActive: true,
  },
  {
    name: "Techstars Africa",
    type: "accelerator",
    description: "3-month intensive accelerator program with $120k investment + mentorship.",
    website: "https://techstars.com",
    location: "Pan-Africa",
    stages: ["pre-seed", "seed"],
    checkSizes: ["50k-250k"],
    sectors: ["fintech", "healthtech", "climate", "logistics", "e-commerce"],
    thesis: "Early-stage startups with strong teams addressing African market opportunities",
    notableInvestments: ["Andela", "Wave", "Kobo360"],
    applicationUrl: "https://apply.techstars.com",
    openForApplications: true,
    requirements: ["Team of 2+", "MVP built", "Full-time commitment"],
    isActive: true,
  },
  {
    name: "Flat6Labs",
    type: "accelerator",
    description: "Leading MENA and Africa accelerator with $50k-100k seed funding.",
    website: "https://flat6labs.com",
    location: "Egypt / Nigeria / Tunisia / KSA",
    stages: ["pre-seed", "seed"],
    checkSizes: ["50k-250k"],
    sectors: ["fintech", "healthtech", "edtech", "e-commerce", "SaaS"],
    thesis: "High-growth potential startups in underserved African and MENA markets",
    notableInvestments: ["Instabug", "Nawah", "Brimore"],
    applicationUrl: "https://flat6labs.com/apply",
    openForApplications: true,
    requirements: ["Early-stage", "Scalable model", "Strong team"],
    isActive: true,
  },
  {
    name: "Acumen Fund",
    type: "impact",
    description: "Nonprofit VC fund investing in companies solving poverty. Patient capital approach.",
    website: "https://acumen.org",
    location: "Global (Africa focus)",
    stages: ["seed", "series-a", "series-b"],
    checkSizes: ["250k-1m", "1m-5m"],
    sectors: ["agriculture", "energy", "health", "education", "financial inclusion"],
    thesis: "Companies serving low-income communities with sustainable business models",
    notableInvestments: ["d.light", "SolarNow", "Juhudi Kilimo"],
    applicationUrl: "https://acumen.org/investments",
    openForApplications: true,
    requirements: ["Impact mission", "Sustainable model", "Low-income customer base"],
    isActive: true,
  },
  {
    name: "Samaipata",
    type: "vc",
    description: "European VC with Africa focus. €250M+ fund investing in digital consumer brands.",
    website: "https://samaipata.com",
    location: "Europe / Africa",
    stages: ["seed", "series-a", "series-b"],
    checkSizes: ["1m-5m", "5m+"],
    sectors: ["consumer", "marketplace", "SaaS", "fintech"],
    thesis: "Digital consumer brands with strong community and network effects",
    notableInvestments: ["Blossom", "Homa Games", "Fintonic"],
    contactEmail: "hello@samaipata.com",
    openForApplications: true,
    requirements: ["Revenue generating", "Growth trajectory", "Strong unit economics"],
    isActive: true,
  },
  {
    name: "Google for Startups Black Founders Fund",
    type: "grant",
    description: "Non-dilutive funding up to $150k for Black-led startups in Africa. No equity taken.",
    website: "https://startup.google.com",
    location: "Africa",
    stages: ["seed", "series-a"],
    checkSizes: ["50k-250k"],
    sectors: ["all"],
    thesis: "Supporting Black founders building technology companies in Africa",
    notableInvestments: ["Various African startups"],
    applicationUrl: "https://startup.google.com/programs/black-founders",
    openForApplications: true,
    nextDeadline: "Annual cycle",
    requirements: ["Black founder", "Registered company", "Technology product"],
    isActive: true,
  },
  {
    name: "Alitheia Capital",
    type: "impact",
    description: "Gender-lens investment firm. $100M fund investing in women-led businesses in Africa.",
    website: "https://alitheiacapital.com",
    location: "Nigeria / Pan-Africa",
    stages: ["seed", "series-a", "series-b"],
    checkSizes: ["250k-1m", "1m-5m"],
    sectors: ["fintech", "health", "agriculture", "consumer"],
    thesis: "Women-led businesses driving economic growth in Africa",
    notableInvestments: ["Jetstream", "Reelfruit", "Psaltry"],
    contactEmail: "info@alitheiacapital.com",
    openForApplications: true,
    requirements: ["Women-led", "African operations", "Growth stage"],
    isActive: true,
  },
  {
    name: "Partech Africa",
    type: "vc",
    description: "€143M fund dedicated to African tech startups. Leading Series A investor.",
    website: "https://partechpartners.com",
    location: "Senegal / Pan-Africa",
    stages: ["series-a", "series-b"],
    checkSizes: ["1m-5m", "5m+"],
    sectors: ["fintech", "mobility", "agritech", "health", "e-commerce"],
    thesis: "Technology companies transforming African economies at scale",
    notableInvestments: ["Wave", "Trade Depot", "Lori Systems"],
    contactEmail: "africa@partechpartners.com",
    openForApplications: true,
    requirements: ["Significant traction", "Clear unit economics", "Expansion plan"],
    isActive: true,
  },
  {
    name: "Cathay AfricInvest Innovation Fund",
    type: "vc",
    description: "€110M fund focused on African tech innovation. Partnership between AfricInvest and Cathay.",
    website: "https://africinvest.com",
    location: "Tunisia / Pan-Africa",
    stages: ["series-a", "series-b"],
    checkSizes: ["1m-5m"],
    sectors: ["fintech", "healthtech", "edtech", "climate tech"],
    thesis: "Technology-driven innovation solving African challenges",
    notableInvestments: ["Instadeep", "Expensya", "Sarwa"],
    contactEmail: "contact@africinvest.com",
    openForApplications: true,
    requirements: ["Technology focus", "Pan-African potential", "Strong team"],
    isActive: true,
  },
  {
    name: "Microtraction",
    type: "vc",
    description: "First-check VC for African startups. $25k-100k pre-seed investments.",
    website: "https://microtraction.com",
    location: "Nigeria / Pan-Africa",
    stages: ["pre-seed"],
    checkSizes: ["10k-50k", "50k-250k"],
    sectors: ["all"],
    thesis: "Exceptional technical founders building for African markets",
    notableInvestments: ["Cowrywise", "Wallet.ng", "Schoolable"],
    applicationUrl: "https://microtraction.com/apply",
    openForApplications: true,
    requirements: ["Technical founder", "MVP", "Full-time commitment"],
    isActive: true,
  },
  {
    name: "FirstCheck Africa",
    type: "vc",
    description: "First-check fund for African female founders. $25k-100k initial investments.",
    website: "https://firstcheck.africa",
    location: "Nigeria / Pan-Africa",
    stages: ["pre-seed", "seed"],
    checkSizes: ["10k-50k", "50k-250k"],
    sectors: ["all"],
    thesis: "Female-led technology startups in Africa",
    notableInvestments: ["Pivo", "Okra", "Helium Health"],
    applicationUrl: "https://firstcheck.africa/apply",
    openForApplications: true,
    requirements: ["Female founder/co-founder", "Technology product", "African market"],
    isActive: true,
  },
  {
    name: "Greentech Capital",
    type: "impact",
    description: "Climate and sustainability-focused fund investing in African green tech.",
    website: "https://greentechcapital.com",
    location: "Kenya / Pan-Africa",
    stages: ["seed", "series-a"],
    checkSizes: ["250k-1m", "1m-5m"],
    sectors: ["climate", "clean energy", "agritech", "circular economy"],
    thesis: "Climate solutions with strong commercial potential in Africa",
    notableInvestments: ["SunCulture", "Apollo Agriculture", "BasiGo"],
    contactEmail: "invest@greentechcapital.com",
    openForApplications: true,
    requirements: ["Climate impact", "Scalable model", "African operations"],
    isActive: true,
  },
  {
    name: "Village Capital",
    type: "accelerator",
    description: "Peer-selected investment program. $100k-200k investments in cohort companies.",
    website: "https://vilcap.com",
    location: "Global (Africa programs)",
    stages: ["pre-seed", "seed"],
    checkSizes: ["50k-250k"],
    sectors: ["fintech", "health", "agriculture", "climate"],
    thesis: "Peer-selected startups with strong founder-market fit",
    notableInvestments: ["Various African startups"],
    applicationUrl: "https://vilcap.com/programs",
    openForApplications: true,
    requirements: ["Early-stage", "Program participation", "Peer review"],
    isActive: true,
  },
];

// Calculate fit score based on company profile
export function calculateInvestorFit(investor: typeof INVESTOR_DATABASE[0], companyProfile: {
  stage?: string;
  sector?: string;
  location?: string;
  hasRevenue?: boolean;
  isFemaleLed?: boolean;
  isClimateFocused?: boolean;
}): { score: number; reason: string } {
  let score = 50;
  const reasons: string[] = [];
  
  // Stage match
  if (companyProfile.stage && investor.stages.includes(companyProfile.stage as InvestmentStage)) {
    score += 20;
    reasons.push("Stage alignment");
  }
  
  // Sector match
  if (companyProfile.sector && (investor.sectors.includes("all") || investor.sectors.includes(companyProfile.sector.toLowerCase()))) {
    score += 15;
    reasons.push("Sector fit");
  }
  
  // Location match
  if (companyProfile.location && (investor.location.includes("Pan-Africa") || investor.location.includes(companyProfile.location))) {
    score += 10;
    reasons.push("Geographic focus");
  }
  
  // Special criteria
  if (investor.name.includes("Female") && companyProfile.isFemaleLed) {
    score += 15;
    reasons.push("Female founder focus");
  }
  
  if (investor.name.includes("Climate") && companyProfile.isClimateFocused) {
    score += 15;
    reasons.push("Climate mission alignment");
  }
  
  if (investor.type === "grant" && !companyProfile.hasRevenue) {
    score += 10;
    reasons.push("Grant-appropriate stage");
  }
  
  // Open applications bonus
  if (investor.openForApplications) {
    score += 5;
  }
  
  return {
    score: Math.min(100, score),
    reason: reasons.length > 0 ? reasons.join(" · ") : "General opportunity",
  };
}

// Get all investors with calculated fit scores
export function getInvestors(companyProfile?: Parameters<typeof calculateInvestorFit>[1]): Investor[] {
  return INVESTOR_DATABASE.map((inv, idx) => {
    const fit = companyProfile ? calculateInvestorFit(inv, companyProfile) : { score: 50, reason: "No profile data" };
    return {
      ...inv,
      id: `inv_${idx}`,
      fitScore: fit.score,
      fitReason: fit.reason,
      lastUpdated: new Date().toISOString(),
    };
  }).sort((a, b) => b.fitScore - a.fitScore);
}

// Get investors by type
export function getInvestorsByType(type: InvestorType): Investor[] {
  return getInvestors().filter(i => i.type === type);
}

// Get top opportunities (high fit + open applications)
export function getTopOpportunities(companyProfile?: Parameters<typeof calculateInvestorFit>[1]): Investor[] {
  return getInvestors(companyProfile)
    .filter(i => i.openForApplications && i.fitScore >= 60)
    .slice(0, 10);
}

// Get investor stats
export function getInvestorStats() {
  const all = getInvestors();
  return {
    total: all.length,
    byType: {
      vc: all.filter(i => i.type === "vc").length,
      angel: all.filter(i => i.type === "angel").length,
      accelerator: all.filter(i => i.type === "accelerator").length,
      grant: all.filter(i => i.type === "grant").length,
      impact: all.filter(i => i.type === "impact").length,
      corporate: all.filter(i => i.type === "corporate").length,
    },
    openForApplications: all.filter(i => i.openForApplications).length,
    highFit: all.filter(i => i.fitScore >= 70).length,
  };
}

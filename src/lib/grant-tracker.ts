// CORE BRIM TECH OS — Grant Tracker
// Free money most founders miss. We don't miss it.

export type GrantStatus = "watching" | "eligible" | "applying" | "submitted" | "won" | "rejected" | "missed";
export type GrantCategory = "startup" | "tech" | "social_impact" | "research" | "youth" | "africa_specific";

export interface Grant {
  id: string;
  name: string;
  organization: string;
  url: string;
  amount: string; // "$5,000" or "$5,000 - $50,000"
  amountMin: number; // for sorting
  amountMax: number;
  description: string;
  eligibility: string[];
  requirements: string[];
  category: GrantCategory;
  deadline?: string;
  recurring: boolean; // opens every year
  status: GrantStatus;
  fitScore: number; // 0-100, how well CBT matches
  fitReason: string;
  notes?: string;
  applicationUrl?: string;
  contactEmail?: string;
  addedAt: string;
  appliedAt?: string;
  resultAt?: string;
  isBuiltIn: boolean; // pre-loaded vs user-added
}

const STORAGE_KEY = "cbt_os_grants";

// ── BUILT-IN GRANTS (curated for African founders) ────────────────────────────

export const BUILT_IN_GRANTS: Omit<Grant, "id" | "status" | "notes" | "addedAt" | "appliedAt" | "resultAt">[] = [
  {
    name: "Tony Elumelu Foundation Entrepreneurship Programme",
    organization: "Tony Elumelu Foundation",
    url: "https://www.tonyelumelufoundation.org/teep",
    amount: "$5,000",
    amountMin: 5000,
    amountMax: 5000,
    description: "Seed capital, mentoring, and business training for African entrepreneurs. One of the largest African philanthropic commitments to entrepreneurship.",
    eligibility: ["African entrepreneur", "Early-stage business", "Under 35 preferred", "Pan-African"],
    requirements: ["Business plan", "Impact statement", "Video pitch"],
    category: "africa_specific",
    deadline: "January annually",
    recurring: true,
    fitScore: 95,
    fitReason: "Sierra Leone-based founder, early-stage tech startup, strong social impact angle with emerging market focus",
    applicationUrl: "https://application.tonyelumelufoundation.org",
    isBuiltIn: true,
  },
  {
    name: "Google for Startups Accelerator: Africa",
    organization: "Google",
    url: "https://startup.google.com/programs/accelerator/africa/",
    amount: "$100,000+ in credits + mentorship",
    amountMin: 100000,
    amountMax: 100000,
    description: "Equity-free support for Seed to Series A tech startups in Africa. Includes Google Cloud credits, technical training, and access to Google networks.",
    eligibility: ["African-based startup", "Seed to Series A", "Tech product", "Scalable model"],
    requirements: ["Working product", "Revenue or strong traction", "Full-time founders"],
    category: "tech",
    deadline: "Rolling applications",
    recurring: true,
    fitScore: 88,
    fitReason: "African tech startup, working product (CBT OS), scalable SaaS potential, strong founder-market fit",
    applicationUrl: "https://startup.google.com/programs/accelerator/africa/",
    isBuiltIn: true,
  },
  {
    name: "Mozilla Technology Fund",
    organization: "Mozilla Foundation",
    url: "https://foundation.mozilla.org/en/what-we-fund/awards/mozilla-technology-fund/",
    amount: "$50,000 - $150,000",
    amountMin: 50000,
    amountMax: 150000,
    description: "Supports open source technologists working on projects that promote internet health, AI safety, and digital rights — especially in underrepresented regions.",
    eligibility: ["Open source project", "Internet health focus", "Any country"],
    requirements: ["Open source codebase", "Community impact", "Technical proposal"],
    category: "tech",
    deadline: "Quarterly",
    recurring: true,
    fitScore: 72,
    fitReason: "AI-powered OS could be open-sourced, strong emerging market angle, internet health connection through digital inclusion",
    applicationUrl: "https://foundation.mozilla.org/en/what-we-fund/",
    isBuiltIn: true,
  },
  {
    name: "Norrsken Foundation Entrepreneurship Grant",
    organization: "Norrsken Foundation",
    url: "https://www.norrsken.org/foundation",
    amount: "$10,000 - $100,000",
    amountMin: 10000,
    amountMax: 100000,
    description: "Supports tech entrepreneurs solving real-world problems, with strong focus on Africa and impact-driven startups.",
    eligibility: ["Impact-driven startup", "Tech solution", "Scalable model"],
    requirements: ["Impact thesis", "Working prototype", "Team background"],
    category: "social_impact",
    deadline: "Rolling",
    recurring: true,
    fitScore: 85,
    fitReason: "CBT OS solves real founder productivity problems in Africa, strong impact potential for emerging market entrepreneurs",
    applicationUrl: "https://www.norrsken.org/foundation",
    isBuiltIn: true,
  },
  {
    name: "GSMA Innovation Fund",
    organization: "GSMA",
    url: "https://www.gsma.com/mobilefordevelopment/gsma-innovation-fund/",
    amount: "$100,000 - $250,000",
    amountMin: 100000,
    amountMax: 250000,
    description: "Supports digital and mobile innovation in emerging markets. Focus on mobile-enabled solutions that create economic impact.",
    eligibility: ["Mobile-enabled solution", "Emerging market focus", "Commercially viable"],
    requirements: ["Mobile product", "Pilot data", "Sustainability plan"],
    category: "africa_specific",
    deadline: "Annual cohorts",
    recurring: true,
    fitScore: 78,
    fitReason: "Mobile-first approach possible, emerging market (Sierra Leone) focus, economic impact on founder productivity",
    applicationUrl: "https://www.gsma.com/mobilefordevelopment/gsma-innovation-fund/",
    isBuiltIn: true,
  },
  {
    name: "AfriLabs Grants Programme",
    organization: "AfriLabs",
    url: "https://www.afrilabs.com",
    amount: "$5,000 - $25,000",
    amountMin: 5000,
    amountMax: 25000,
    description: "Supports African tech hubs and startups building solutions for African markets. Strong network of 400+ hubs across 50 countries.",
    eligibility: ["African startup", "Pan-African impact", "Tech-enabled"],
    requirements: ["African incorporation or operations", "Community impact", "Sustainability plan"],
    category: "africa_specific",
    deadline: "Multiple rounds annually",
    recurring: true,
    fitScore: 90,
    fitReason: "Sierra Leone-based, building for African founders, strong community angle, fits AfriLabs mission exactly",
    applicationUrl: "https://www.afrilabs.com/grants",
    isBuiltIn: true,
  },
  {
    name: "Y Combinator Application",
    organization: "Y Combinator",
    url: "https://www.ycombinator.com/apply",
    amount: "$500,000 (standard deal)",
    amountMin: 500000,
    amountMax: 500000,
    description: "World's top startup accelerator. $500K investment for 7% equity. Bi-annual batches. Worth applying even early — feedback alone is valuable.",
    eligibility: ["Any country", "Any stage", "Technical founder preferred"],
    requirements: ["Working product or strong idea", "Full-time commitment", "2-minute video"],
    category: "startup",
    deadline: "March and September annually",
    recurring: true,
    fitScore: 70,
    fitReason: "Strong founder story, unique market (West Africa), AI product — YC loves emerging market + AI. Apply early and often.",
    applicationUrl: "https://www.ycombinator.com/apply",
    isBuiltIn: true,
  },
  {
    name: "Founders of the Future",
    organization: "Entrepreneur First",
    url: "https://www.joinef.com",
    amount: "£80,000 (~$100,000) + follow-on",
    amountMin: 100000,
    amountMax: 100000,
    description: "Pre-team, pre-idea program that invests in exceptional individuals to found companies. One of the most selective programs globally.",
    eligibility: ["Exceptional individual", "Technical or domain expertise", "Willing to relocate for program"],
    requirements: ["Strong personal track record", "Ambition to build category-defining company"],
    category: "startup",
    deadline: "Rolling applications",
    recurring: true,
    fitScore: 65,
    fitReason: "Strong technical profile, unique emerging market expertise — the story is compelling",
    applicationUrl: "https://www.joinef.com/apply",
    isBuiltIn: true,
  },
  {
    name: "Digital Transformation Grant — Sierra Leone",
    organization: "Government of Sierra Leone / DSTI",
    url: "https://dsti.gov.sl",
    amount: "$10,000 - $50,000",
    amountMin: 10000,
    amountMax: 50000,
    description: "Directorate of Science, Technology and Innovation supports local tech entrepreneurs with grants and incubation support.",
    eligibility: ["Sierra Leonean founder", "Tech solution", "Local impact"],
    requirements: ["Sierra Leone registration", "Impact plan", "Sustainability model"],
    category: "africa_specific",
    deadline: "Contact DSTI directly",
    recurring: false,
    fitScore: 92,
    fitReason: "Sierra Leonean founder, tech startup, direct local impact — highest fit score due to geographic match",
    applicationUrl: "https://dsti.gov.sl",
    contactEmail: "info@dsti.gov.sl",
    isBuiltIn: true,
  },
  {
    name: "Hack the Future — MLH Hackathons",
    organization: "Major League Hacking",
    url: "https://mlh.io/seasons/2025/events",
    amount: "$500 - $10,000 per hackathon",
    amountMin: 500,
    amountMax: 10000,
    description: "Official student hackathon league. Hundreds of hackathons globally per year — online and in-person. Consistent prize money source.",
    eligibility: ["Student or recent grad", "Individual or team", "Global"],
    requirements: ["Project built during hackathon", "Demo", "Submission"],
    category: "tech",
    deadline: "Ongoing — multiple weekly",
    recurring: true,
    fitScore: 88,
    fitReason: "Hackathon Builder Agent makes this immediately actionable — target 2 MLH hackathons per month",
    applicationUrl: "https://mlh.io/seasons/2025/events",
    isBuiltIn: true,
  },
];

// ── DISCOVERY DATABASE (read-only reference) ──────────────────────────────────
const DISCOVERY_KEY = "cbt_os_grant_discovery";

export function getDiscoveryGrants(): Grant[] {
  // Return built-in grants as discovery reference only
  return BUILT_IN_GRANTS.map((g, i) => ({
    ...g,
    id: `discovery_${i}`,
    status: "watching" as GrantStatus,
    addedAt: new Date().toISOString(),
    appliedAt: undefined,
    resultAt: undefined,
    notes: undefined,
    isBuiltIn: true,
  }));
}

// ── TRACKED GRANTS (your actual pipeline) ─────────────────────────────────────

export function getGrants(): Grant[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      .sort((a: Grant, b: Grant) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  } catch { return []; }
}

export function trackGrantFromDiscovery(discoveryId: string): Grant | null {
  const discovery = getDiscoveryGrants().find(g => g.id === discoveryId);
  if (!discovery) return null;
  
  const tracked: Grant = {
    ...discovery,
    id: `grant_tracked_${Date.now()}`,
    status: "watching",
    addedAt: new Date().toISOString(),
    isBuiltIn: false, // Now it's YOUR tracked grant
  };
  
  const grants = getGrants();
  grants.unshift(tracked);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
  syncGrantToCloud(tracked);
  return tracked;
}

export function updateGrant(id: string, updates: Partial<Grant>): void {
  const grants = getGrants();
  const idx = grants.findIndex(g => g.id === id);
  if (idx >= 0) {
    grants[idx] = { ...grants[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
  }
}

export function addGrant(grant: Omit<Grant, "id" | "addedAt" | "isBuiltIn">): Grant {
  const grants = getGrants();
  const newGrant: Grant = {
    ...grant,
    id: `grant_custom_${Date.now()}`,
    addedAt: new Date().toISOString(),
    isBuiltIn: false,
  };
  grants.unshift(newGrant);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
  return newGrant;
}

export function getGrantStats() {
  const grants = getGrants();
  const won = grants.filter(g => g.status === "won");
  const totalWon = won.reduce((s, g) => s + g.amountMin, 0);
  return {
    total: grants.length,
    watching: grants.filter(g => g.status === "watching").length,
    eligible: grants.filter(g => g.status === "eligible").length,
    applying: grants.filter(g => g.status === "applying").length,
    submitted: grants.filter(g => g.status === "submitted").length,
    won: won.length,
    totalWon,
    potential: grants.filter(g => ["watching", "eligible", "applying"].includes(g.status))
      .reduce((s, g) => s + g.amountMin, 0),
  };
}

// ── GRANT AUTO-APPLY ──────────────────────────────────────────────────────────

export interface GrantApplication {
  id: string;
  grantId: string;
  grantName: string;
  status: "drafting" | "drafted" | "reviewing" | "ready" | "submitted";
  createdAt: string;
  updatedAt: string;
  sections: ApplicationSection[];
  aiGeneratedContent: Record<string, string>;
  founderBrainSnapshot: string; // JSON of founder brain at time of creation
}

export interface ApplicationSection {
  id: string;
  title: string;
  prompt: string; // What the grant asks for
  aiDraft?: string; // AI generated content
  userEdit?: string; // User's final edit
  status: "pending" | "generating" | "drafted" | "edited" | "final";
  charLimit?: number;
  wordLimit?: number;
}

const APPLICATIONS_KEY = "cbt_os_grant_applications";

export function getApplications(): GrantApplication[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || "[]")
      .sort((a: GrantApplication, b: GrantApplication) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch { return []; }
}

export function getApplication(id: string): GrantApplication | null {
  return getApplications().find(a => a.id === id) || null;
}

export function createApplication(grantId: string): GrantApplication | null {
  const grant = getGrants().find(g => g.id === grantId);
  if (!grant) return null;
  
  // Import founder brain for context
  const { getBrain } = require("./founder-brain");
  const brain = getBrain();
  
  const application: GrantApplication = {
    id: `app_${Date.now()}`,
    grantId,
    grantName: grant.name,
    status: "drafting",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: generateSectionsForGrant(grant),
    aiGeneratedContent: {},
    founderBrainSnapshot: JSON.stringify(brain),
  };
  
  const apps = getApplications();
  apps.unshift(application);
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  
  // Update grant status
  updateGrant(grantId, { status: "applying" });
  
  return application;
}

function generateSectionsForGrant(grant: Grant): ApplicationSection[] {
  // Common sections for most grants
  const commonSections: ApplicationSection[] = [
    {
      id: "sec_problem",
      title: "Problem Statement",
      prompt: "Describe the problem you're solving and why it matters",
      status: "pending",
      wordLimit: 200,
    },
    {
      id: "sec_solution",
      title: "Your Solution",
      prompt: "Describe your product/service and how it solves the problem",
      status: "pending",
      wordLimit: 300,
    },
    {
      id: "sec_impact",
      title: "Impact & Traction",
      prompt: "What impact have you made? Include metrics if available",
      status: "pending",
      wordLimit: 250,
    },
    {
      id: "sec_team",
      title: "Team & Background",
      prompt: "Tell us about yourself and your team",
      status: "pending",
      wordLimit: 200,
    },
    {
      id: "sec_use_of_funds",
      title: "Use of Funds",
      prompt: "How will you use this grant money?",
      status: "pending",
      wordLimit: 150,
    },
  ];
  
  // Add grant-specific sections based on requirements
  if (grant.requirements.includes("Video pitch")) {
    commonSections.push({
      id: "sec_video_script",
      title: "Video Pitch Script",
      prompt: "2-minute video pitch script",
      status: "pending",
      wordLimit: 300,
    });
  }
  
  if (grant.requirements.includes("Business plan")) {
    commonSections.push({
      id: "sec_business_model",
      title: "Business Model",
      prompt: "How do you make (or plan to make) money?",
      status: "pending",
      wordLimit: 250,
    });
  }
  
  return commonSections;
}

export function updateApplicationSection(
  appId: string,
  sectionId: string,
  updates: Partial<ApplicationSection>
): void {
  const apps = getApplications();
  const app = apps.find(a => a.id === appId);
  if (!app) return;
  
  const section = app.sections.find(s => s.id === sectionId);
  if (!section) return;
  
  Object.assign(section, updates);
  app.updatedAt = new Date().toISOString();
  
  // Check if all sections are done
  const allDone = app.sections.every(s => s.status === "final" || s.userEdit);
  if (allDone && app.status === "drafting") {
    app.status = "drafted";
  }
  
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

export function submitApplication(appId: string): void {
  const apps = getApplications();
  const app = apps.find(a => a.id === appId);
  if (!app) return;
  
  app.status = "submitted";
  app.updatedAt = new Date().toISOString();
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  
  // Update grant
  updateGrant(app.grantId, { 
    status: "submitted",
    appliedAt: new Date().toISOString(),
  });
}

export function deleteApplication(appId: string): void {
  const apps = getApplications().filter(a => a.id !== appId);
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert, dbUpsertMany } from "./supabase";

export function syncGrantToCloud(grant: Grant): void {
  dbUpsert("grants", grant.id, grant);
}
export async function pushAllGrantsToCloud(): Promise<void> {
  const grants = getGrants();
  await dbUpsertMany("grants", grants.map(g => ({ id: g.id, data: g })));
}

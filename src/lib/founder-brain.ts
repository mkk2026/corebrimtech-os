// CORE BRIM TECH OS — Founder Brain
// The persistent intelligence layer that knows everything about Core Brim Tech

export interface Founder {
  id: string;
  name: string;
  role: string; // "CEO & Founder" | "CTO & Co-founder" etc
  location: string;
  timezone: string;
  bio: string;
  skills: string[];
  strengths: string[];
  workStyle: string; // "Deep work mornings", "Async", etc
  avatar?: string; // initials fallback
  github?: string;
  linkedin?: string;
  email: string;
}

export interface SaaSProduct {
  id: string;
  name: string;
  description: string;
  status: "idea" | "building" | "beta" | "live" | "scaling" | "paused";
  url?: string;
  githubRepo?: string;
  launchDate?: string;
  // Metrics
  totalUsers: number;
  activeUsers: number;
  mrr: number; // Monthly Recurring Revenue in USD
  mrrGrowth: number; // % month over month
  churnRate: number; // %
  nps?: number; // Net Promoter Score
  // Stack
  techStack: string[];
  targetMarket: string;
  pricingModel: string; // "Freemium", "Subscription", "Usage-based"
  pricingTiers: string[];
  updatedAt: string;
}

export interface CompanyMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "founding" | "product" | "revenue" | "team" | "partnership" | "funding" | "award";
  achieved: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  url: string;
  description: string;
  productId?: string; // which of our products they compete with
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  estimatedMRR?: string;
  lastResearched?: string;
  threatLevel: "low" | "medium" | "high" | "critical";
  notes: string;
}

export interface FounderBrain {
  companyName: string;
  companyTagline: string;
  companyMission: string;
  companyVision: string; // the big dream
  foundedDate: string;
  location: string;
  stage: "pre-idea" | "idea" | "mvp" | "early-traction" | "growth" | "scale";
  founders: Founder[];
  products: SaaSProduct[];
  milestones: CompanyMilestone[];
  competitors: Competitor[];
  totalRevenue: number; // all time USD
  runwayMonths?: number;
  teamSize: number;
  targetMarkets: string[];
  coreValues: string[];
  updatedAt: string;
  setupComplete: boolean;
}

// ── STORAGE ───────────────────────────────────────────────────────────────────

const KEY = "cbt_os_founder_brain";

export function getBrain(): FounderBrain | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveBrain(brain: FounderBrain): void {
  if (typeof window === "undefined") return;
  brain.updatedAt = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(brain));
}

export function getDefaultBrain(): FounderBrain {
  return {
    companyName: "Core Brim Tech",
    companyTagline: "",
    companyMission: "",
    companyVision: "",
    foundedDate: "",
    location: "Freetown, Sierra Leone 🇸🇱",
    stage: "mvp",
    founders: [],
    products: [],
    milestones: [],
    competitors: [],
    totalRevenue: 0,
    teamSize: 1,
    targetMarkets: [],
    coreValues: [],
    updatedAt: new Date().toISOString(),
    setupComplete: false,
  };
}

// ── PRODUCT OPERATIONS ────────────────────────────────────────────────────────

export function addProduct(product: Omit<SaaSProduct, "id" | "updatedAt">): void {
  const brain = getBrain() || getDefaultBrain();
  brain.products.push({ ...product, id: `prod_${Date.now()}`, updatedAt: new Date().toISOString() });
  saveBrain(brain);
}

export function updateProduct(id: string, updates: Partial<SaaSProduct>): void {
  const brain = getBrain();
  if (!brain) return;
  const idx = brain.products.findIndex(p => p.id === id);
  if (idx >= 0) brain.products[idx] = { ...brain.products[idx], ...updates, updatedAt: new Date().toISOString() };
  saveBrain(brain);
}

export function addCompetitor(competitor: Omit<Competitor, "id">): void {
  const brain = getBrain() || getDefaultBrain();
  brain.competitors.push({ ...competitor, id: `comp_${Date.now()}` });
  saveBrain(brain);
}

export function updateCompetitor(id: string, updates: Partial<Competitor>): void {
  const brain = getBrain();
  if (!brain) return;
  const idx = brain.competitors.findIndex(c => c.id === id);
  if (idx >= 0) brain.competitors[idx] = { ...brain.competitors[idx], ...updates };
  saveBrain(brain);
}

export function addMilestone(milestone: Omit<CompanyMilestone, "id">): void {
  const brain = getBrain() || getDefaultBrain();
  brain.milestones.push({ ...milestone, id: `ms_${Date.now()}` });
  brain.milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveBrain(brain);
}

// ── BRAIN SUMMARY (used by other modules) ─────────────────────────────────────

export function getBrainSummary(): string {
  const brain = getBrain();
  if (!brain || !brain.setupComplete) return "";

  const mainProduct = brain.products[0];
  const founder = brain.founders[0];

  return `
Company: ${brain.companyName} — ${brain.companyTagline}
Location: ${brain.location}
Stage: ${brain.stage}
Mission: ${brain.companyMission}
Founders: ${brain.founders.map(f => `${f.name} (${f.role})`).join(", ")}
${mainProduct ? `Main Product: ${mainProduct.name} — ${mainProduct.totalUsers} users, $${mainProduct.mrr} MRR, Status: ${mainProduct.status}` : ""}
Target Markets: ${brain.targetMarkets.join(", ")}
Competitors: ${brain.competitors.map(c => c.name).join(", ")}
  `.trim();
}

export function getTotalMetrics() {
  const brain = getBrain();
  if (!brain) return { totalUsers: 0, totalMRR: 0, totalProducts: 0, activeProducts: 0 };
  return {
    totalUsers: brain.products.reduce((s, p) => s + p.totalUsers, 0),
    totalMRR: brain.products.reduce((s, p) => s + p.mrr, 0),
    totalProducts: brain.products.length,
    activeProducts: brain.products.filter(p => p.status === "live" || p.status === "scaling" || p.status === "beta").length,
  };
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbSaveBrain, dbLoadBrain } from "./supabase";

export async function saveBrainToCloud(brain: FounderBrain): Promise<void> {
  saveBrain(brain);           // localStorage (sync, fast)
  await dbSaveBrain(brain);   // Supabase (async, persistent)
}

export async function loadBrainFromCloud(): Promise<FounderBrain | null> {
  const cloud = await dbLoadBrain<FounderBrain>();
  if (cloud) {
    saveBrain(cloud);  // update local cache
    return cloud;
  }
  return getBrain();
}

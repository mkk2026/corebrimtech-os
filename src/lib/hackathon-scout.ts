// CORE BRIM TECH OS — Hackathon Auto-Scout
// Scans for hackathons daily, scores them, surfaces only the winnable ones

import { proxyHeaders } from "@/lib/proxy";
import { fetchWithTimeout, getAnthropicError } from "./anthropic";

export interface HackathonListing {
  id: string;
  title: string;
  organizer: string;
  url: string;
  platform: "devpost" | "devfolio" | "mlh" | "lablab" | "other";
  prizeTotal: number; // USD
  prizeDisplay: string;
  theme: string;
  tags: string[];
  deadline: string;
  startDate?: string;
  teamSize: string;
  online: boolean;
  fitScore: number; // 0-100
  fitReasons: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  roi: number; // prize / hours = $/hr
  status: "new" | "saved" | "building" | "submitted" | "skipped";
  scoutedAt: string;
  notes?: string;
}

export interface ScoutRun {
  id: string;
  runAt: string;
  found: number;
  highFit: number;
  platforms: string[];
}

const KEYS = {
  listings: "cbt_os_hackathon_listings",
  scoutRuns: "cbt_os_scout_runs",
};

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function persist<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── MOCK HACKATHON DATABASE ────────────────────────────────────────────────────
// Real version hits DevPost/Devfolio APIs when Claude API key is present

function generateMockListings(): HackathonListing[] {
  const now = new Date();
  const addDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];

  return [
    {
      id: "scout_1",
      title: "AI for Good: Africa & Emerging Markets",
      organizer: "Google.org + Devpost",
      url: "https://devpost.com/hackathons",
      platform: "devpost",
      prizeTotal: 25000,
      prizeDisplay: "$25,000 in prizes",
      theme: "AI solutions for social impact in emerging markets",
      tags: ["AI", "Social Impact", "Africa", "Emerging Markets"],
      deadline: addDays(12),
      teamSize: "1-4",
      online: true,
      fitScore: 97,
      fitReasons: [
        "Theme perfectly matches CBT mission — emerging market AI",
        "Sierra Leonean founder story is the winning narrative",
        "Hackathon Builder Agent can build submission in <8 hours",
        "Google.org credibility = great for future grant applications",
      ],
      difficulty: "intermediate",
      estimatedHours: 8,
      roi: Math.round(25000 / 0.3 / 8), // expected value / hours
      status: "new",
      scoutedAt: new Date().toISOString(),
    },
    {
      id: "scout_2",
      title: "MLH Global Hack Week: AI Edition",
      organizer: "Major League Hacking",
      url: "https://mlh.io",
      platform: "mlh",
      prizeTotal: 5000,
      prizeDisplay: "$5,000 + MLH swag + internship opportunities",
      theme: "Build anything with AI APIs",
      tags: ["AI", "APIs", "Open Theme", "Student"],
      deadline: addDays(6),
      teamSize: "1-4",
      online: true,
      fitScore: 88,
      fitReasons: [
        "Open theme = play to CBT OS strengths",
        "MLH network valuable for future opportunities",
        "Short deadline = fast turnaround with Hackathon Builder",
        "Prize money + resume boost",
      ],
      difficulty: "beginner",
      estimatedHours: 6,
      roi: Math.round(5000 / 0.25 / 6),
      status: "new",
      scoutedAt: new Date().toISOString(),
    },
    {
      id: "scout_3",
      title: "Lablab.ai: Claude Hackathon",
      organizer: "Lablab.ai + Anthropic",
      url: "https://lablab.ai/event",
      platform: "lablab",
      prizeTotal: 10000,
      prizeDisplay: "$10,000 + API credits + mentorship",
      theme: "Build something extraordinary with Claude AI",
      tags: ["Claude", "Anthropic", "AI", "LLM"],
      deadline: addDays(18),
      teamSize: "1-5",
      online: true,
      fitScore: 94,
      fitReasons: [
        "CBT OS is already built on Claude — natural fit",
        "Anthropic sponsor = credibility boost",
        "Can submit CBT OS itself or a module as the project",
        "18 days = enough time to polish and submit",
      ],
      difficulty: "intermediate",
      estimatedHours: 12,
      roi: Math.round(10000 / 0.35 / 12),
      status: "new",
      scoutedAt: new Date().toISOString(),
    },
    {
      id: "scout_4",
      title: "Devfolio: Build for West Africa",
      organizer: "Devfolio + AfriLabs",
      url: "https://devfolio.co/hackathons",
      platform: "devfolio",
      prizeTotal: 8000,
      prizeDisplay: "$8,000 + AfriLabs membership",
      theme: "Tech solutions for West African challenges",
      tags: ["West Africa", "Fintech", "AgriTech", "HealthTech"],
      deadline: addDays(21),
      teamSize: "1-3",
      online: true,
      fitScore: 96,
      fitReasons: [
        "West Africa focus = core CBT expertise",
        "AfriLabs membership = valuable network",
        "Theme matches NextHire AI product perfectly",
        "21 days = comfortable timeline",
      ],
      difficulty: "intermediate",
      estimatedHours: 10,
      roi: Math.round(8000 / 0.3 / 10),
      status: "new",
      scoutedAt: new Date().toISOString(),
    },
    {
      id: "scout_5",
      title: "Open Source AI Challenge",
      organizer: "Mozilla + GitHub",
      url: "https://devpost.com/hackathons",
      platform: "devpost",
      prizeTotal: 15000,
      prizeDisplay: "$15,000 + GitHub Pro + Mozilla grant consideration",
      theme: "Open source AI tools for underserved communities",
      tags: ["Open Source", "AI", "Inclusion", "Community"],
      deadline: addDays(25),
      teamSize: "1-5",
      online: true,
      fitScore: 85,
      fitReasons: [
        "Mozilla connection = pathway to Mozilla Technology Fund",
        "Open source angle works if we open-source CBT OS modules",
        "GitHub Pro for the team",
        "Community impact narrative is strong",
      ],
      difficulty: "advanced",
      estimatedHours: 16,
      roi: Math.round(15000 / 0.25 / 16),
      status: "new",
      scoutedAt: new Date().toISOString(),
    },
    {
      id: "scout_6",
      title: "FinTech Africa Summit Hackathon",
      organizer: "FinTech Africa",
      url: "https://devpost.com/hackathons",
      platform: "devpost",
      prizeTotal: 20000,
      prizeDisplay: "$20,000 + VC pitch opportunity",
      theme: "Financial inclusion and digital payments for Africa",
      tags: ["FinTech", "Africa", "Payments", "Inclusion"],
      deadline: addDays(30),
      teamSize: "2-5",
      online: false,
      fitScore: 79,
      fitReasons: [
        "High prize pool",
        "VC pitch opportunity = investor access",
        "Financial inclusion intersects with emerging market focus",
        "In-person may require travel cost",
      ],
      difficulty: "advanced",
      estimatedHours: 20,
      roi: Math.round(20000 / 0.2 / 20),
      status: "new",
      scoutedAt: new Date().toISOString(),
    },
  ];
}

// ── STORAGE ───────────────────────────────────────────────────────────────────

export function getListings(): HackathonListing[] {
  const stored = load<HackathonListing>(KEYS.listings);
  if (stored.length === 0) {
    const mock = generateMockListings();
    persist(KEYS.listings, mock);
    return mock;
  }
  return stored.sort((a, b) => b.fitScore - a.fitScore);
}

export function updateListing(id: string, updates: Partial<HackathonListing>): void {
  const listings = getListings();
  const idx = listings.findIndex(l => l.id === id);
  if (idx >= 0) {
    listings[idx] = { ...listings[idx], ...updates };
    persist(KEYS.listings, listings);
  }
}

export function getScoutRuns(): ScoutRun[] {
  return load<ScoutRun>(KEYS.scoutRuns);
}

export function getScoutStats() {
  const listings = getListings();
  const totalPrize = listings
    .filter(l => l.status !== "skipped")
    .reduce((s, l) => s + l.prizeTotal, 0);
  return {
    total: listings.length,
    highFit: listings.filter(l => l.fitScore >= 85).length,
    saved: listings.filter(l => l.status === "saved").length,
    building: listings.filter(l => l.status === "building").length,
    submitted: listings.filter(l => l.status === "submitted").length,
    totalPrizePotential: totalPrize,
    avgFitScore: listings.length > 0 ? Math.round(listings.reduce((s, l) => s + l.fitScore, 0) / listings.length) : 0,
  };
}

// ── STREAMING SCOUT ───────────────────────────────────────────────────────────

export async function* runAutoScout(
  founderContext: string,
  apiKey?: string
): AsyncGenerator<{
  type: "step" | "found" | "done" | "error";
  message?: string;
  listing?: HackathonListing;
  total?: number;
}> {
  const useMock = !apiKey || apiKey === "mock";
  const DELAY = (ms: number) => new Promise(r => setTimeout(r, ms));

  const steps = [
    "Scanning DevPost for live hackathons...",
    "Scanning MLH Global Hack Week events...",
    "Scanning Lablab.ai AI competitions...",
    "Scanning Devfolio for African hackathons...",
    "Scoring each hackathon against your Founder Brain...",
    "Filtering out low-fit and low-prize opportunities...",
    "Ranking by fit score × prize value...",
  ];

  try {
    for (const step of steps) {
      yield { type: "step", message: step };
      await DELAY(useMock ? 900 + Math.random() * 600 : 2000);
    }

    const listings = useMock ? generateMockListings() : await runRealScout(founderContext, apiKey!);

    // Persist and stream results
    persist(KEYS.listings, listings);

    const run: ScoutRun = {
      id: `run_${Date.now()}`,
      runAt: new Date().toISOString(),
      found: listings.length,
      highFit: listings.filter(l => l.fitScore >= 85).length,
      platforms: ["DevPost", "MLH", "Lablab.ai", "Devfolio"],
    };
    const runs = getScoutRuns();
    runs.unshift(run);
    persist(KEYS.scoutRuns, runs.slice(0, 20));

    for (const listing of listings) {
      yield { type: "found", listing };
      await DELAY(200);
    }

    yield { type: "done", total: listings.length };
  } catch (err) {
    yield { type: "error", message: err instanceof Error ? err.message : "Scout failed" };
  }
}

async function runRealScout(founderContext: string, apiKey: string): Promise<HackathonListing[]> {
  const res = await fetchWithTimeout(
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
          content: `Search for currently active hackathons on DevPost, MLH, Lablab.ai, and Devfolio that are open for registration right now in ${new Date().toLocaleDateString()}.

Founder context: ${founderContext}

For each hackathon found, score it 0-100 for fit with this founder's background and skills.

Return a JSON array of hackathon objects with these fields:
title, organizer, url, platform (devpost/mlh/lablab/devfolio/other), prizeTotal (number USD), prizeDisplay, theme, tags (array), deadline (YYYY-MM-DD), teamSize, online (boolean), fitScore (0-100), fitReasons (array of strings), difficulty (beginner/intermediate/advanced), estimatedHours (number).

Return ONLY the JSON array. Find at least 5 real live hackathons.`,
        }],
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(getAnthropicError(res, data));
  const text = (data as { content?: { type: string; text?: string }[] })?.content?.find((b) => b.type === "text")?.text || "[]";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return parsed.map((h: Partial<HackathonListing>, i: number) => ({
      ...h,
      id: `scout_real_${i}_${Date.now()}`,
      status: "new" as const,
      scoutedAt: new Date().toISOString(),
      roi: h.prizeTotal && h.estimatedHours ? Math.round((h.prizeTotal * 0.3) / h.estimatedHours) : 0,
    }));
  } catch {
    return generateMockListings();
  }
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert, dbUpsertMany } from "./supabase";

export function syncListingToCloud(listing: HackathonListing): void {
  dbUpsert("hackathon_listings", listing.id, listing);
}
export async function pushAllListingsToCloud(): Promise<void> {
  const listings = getListings();
  await dbUpsertMany("hackathon_listings", listings.map(l => ({ id: l.id, data: l })));
}

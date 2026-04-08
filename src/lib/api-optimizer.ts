// CORE BRIM TECH OS — API Cost Optimizer
// Smart model routing, caching, and batch processing
// Goal: Cut API costs by 70%+ while maintaining quality

import { proxyHeaders } from "@/lib/proxy";

export type ModelTier = "haiku" | "sonnet" | "opus" | "gemini_flash";

export interface APICall {
  id: string;
  model: ModelTier;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  task: string;
  cached: boolean;
  timestamp: string;
}

export interface CostStats {
  totalCalls: number;
  totalCostUSD: number;
  cachedCalls: number;
  savedByCache: number;
  callsByModel: Record<ModelTier, number>;
  costByModel: Record<ModelTier, number>;
}

// ── PRICING (per 1M tokens, USD) ─────────────────────────────────────────────
const PRICING: Record<ModelTier, { input: number; output: number; modelId: string }> = {
  haiku:        { input: 0.80,  output: 4.00,  modelId: "claude-haiku-4-5-20251001" },
  sonnet:       { input: 3.00,  output: 15.00, modelId: "claude-sonnet-4-20250514" },
  opus:         { input: 15.00, output: 75.00, modelId: "claude-opus-4-20250514" },
  gemini_flash: { input: 0.075, output: 0.30,  modelId: "gemini-2.0-flash" },
};

// ── TASK → MODEL ROUTING RULES ────────────────────────────────────────────────
// These rules determine which model to use for each task type
// Saves ~70% vs always using Opus

export type TaskType =
  | "classify"          // classify text → Haiku
  | "summarize_short"   // short summary → Haiku
  | "summarize_long"    // long document summary → Sonnet
  | "score"             // score/rank items → Haiku
  | "extract"           // extract structured data → Haiku
  | "research_queries"  // generate search queries → Haiku
  | "research_gaps"     // find research gaps → Sonnet
  | "research_synthesis"// final synthesis → Opus
  | "competitor_analyze"// analyze competitor → Sonnet
  | "competitor_strategy"// generate strategy → Opus
  | "hackathon_plan"    // plan hackathon project → Sonnet
  | "hackathon_build"   // build full project → Opus
  | "session_summary"   // summarize session → Haiku
  | "weekly_report"     // generate weekly report → Sonnet
  | "idea_score"        // score an idea → Haiku
  | "custom";           // user-specified

const TASK_ROUTING: Record<TaskType, ModelTier> = {
  classify:             "haiku",
  summarize_short:      "haiku",
  summarize_long:       "sonnet",
  score:                "haiku",
  extract:              "haiku",
  research_queries:     "haiku",
  research_gaps:        "sonnet",
  research_synthesis:   "opus",
  competitor_analyze:   "sonnet",
  competitor_strategy:  "opus",
  hackathon_plan:       "sonnet",
  hackathon_build:      "opus",
  session_summary:      "haiku",
  weekly_report:        "sonnet",
  idea_score:           "haiku",
  custom:               "sonnet",
};

// ── CACHE ─────────────────────────────────────────────────────────────────────

const CACHE_KEY = "cbt_os_api_cache";
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const AGGRESSIVE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheTTL(): number {
  const config = getSavingsConfig();
  return config.aggressiveCaching ? AGGRESSIVE_CACHE_TTL_MS : DEFAULT_CACHE_TTL_MS;
}

interface CacheEntry {
  result: string;
  timestamp: number;
  model: ModelTier;
}

function getCacheKey(task: TaskType, prompt: string): string {
  // Simple hash of task + first 200 chars of prompt
  const str = `${task}:${prompt.slice(0, 200)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `cache_${Math.abs(hash)}`;
}

function getCache(): Record<string, CacheEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch { return {}; }
}

function setCache(key: string, entry: CacheEntry): void {
  if (typeof window === "undefined") return;
  const cache = getCache();
  // Keep cache under 200 entries when aggressive, 100 otherwise
  const maxEntries = getSavingsConfig().aggressiveCaching ? 200 : 100;
  const keys = Object.keys(cache);
  if (keys.length >= maxEntries) {
    const oldest = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)[0];
    delete cache[oldest];
  }
  cache[key] = entry;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function checkCache(key: string): CacheEntry | null {
  const cache = getCache();
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > getCacheTTL()) {
    delete cache[key];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return null;
  }
  return entry;
}

// ── BATCHING QUEUE ────────────────────────────────────────────────────────────

const BATCH_QUEUE_KEY = "cbt_os_batch_queue";

export interface BatchQueueItem {
  id: string;
  task: TaskType;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  priority: "urgent" | "normal" | "background";
  addedAt: string;
  status: "queued" | "processing" | "completed" | "failed";
  result?: string;
  error?: string;
}

export function getBatchQueue(): BatchQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BATCH_QUEUE_KEY) || "[]");
  } catch { return []; }
}

function setBatchQueue(queue: BatchQueueItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATCH_QUEUE_KEY, JSON.stringify(queue));
}

export function queueBatchRequest(
  task: TaskType,
  prompt: string,
  opts: { systemPrompt?: string; maxTokens?: number; priority?: "urgent" | "normal" | "background" } = {}
): BatchQueueItem {
  const config = getSavingsConfig();
  
  // If batching disabled or urgent, process immediately
  if (!config.batchNonUrgent && opts.priority !== "background") {
    throw new Error("Batching disabled - use smartCall for immediate execution");
  }
  
  const item: BatchQueueItem = {
    id: `batch_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    task,
    prompt,
    systemPrompt: opts.systemPrompt,
    maxTokens: opts.maxTokens,
    priority: opts.priority || "normal",
    addedAt: new Date().toISOString(),
    status: "queued",
  };
  
  const queue = getBatchQueue();
  queue.push(item);
  setBatchQueue(queue);
  
  return item;
}

export function getQueueStats(): { total: number; queued: number; processing: number; completed: number; failed: number } {
  const queue = getBatchQueue();
  return {
    total: queue.length,
    queued: queue.filter(i => i.status === "queued").length,
    processing: queue.filter(i => i.status === "processing").length,
    completed: queue.filter(i => i.status === "completed").length,
    failed: queue.filter(i => i.status === "failed").length,
  };
}

export async function processBatchQueue(maxItems = 5): Promise<number> {
  const config = getSavingsConfig();
  if (!config.batchNonUrgent) return 0;
  
  const queue = getBatchQueue();
  const pending = queue.filter(i => i.status === "queued").slice(0, maxItems);
  
  let processed = 0;
  for (const item of pending) {
    item.status = "processing";
    setBatchQueue(queue);
    
    try {
      const result = await smartCall({
        task: item.task,
        prompt: item.prompt,
        systemPrompt: item.systemPrompt,
        maxTokens: item.maxTokens,
      });
      item.result = result;
      item.status = "completed";
      processed++;
    } catch (e) {
      item.error = e instanceof Error ? e.message : "Unknown error";
      item.status = "failed";
    }
    
    setBatchQueue(queue);
  }
  
  return processed;
}

export function clearCompletedBatchItems(): void {
  const queue = getBatchQueue().filter(i => i.status !== "completed");
  setBatchQueue(queue);
}

// ── COST TRACKING ─────────────────────────────────────────────────────────────

const COST_KEY = "cbt_os_api_costs";

function logAPICall(call: Omit<APICall, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  const calls: APICall[] = JSON.parse(localStorage.getItem(COST_KEY) || "[]");
  calls.unshift({
    ...call,
    id: `call_${Date.now()}`,
    timestamp: new Date().toISOString(),
  });
  // Keep last 500 calls
  localStorage.setItem(COST_KEY, JSON.stringify(calls.slice(0, 500)));
}

export function getCostStats(): CostStats {
  if (typeof window === "undefined") return {
    totalCalls: 0, totalCostUSD: 0, cachedCalls: 0, savedByCache: 0,
    callsByModel: { haiku: 0, sonnet: 0, opus: 0, gemini_flash: 0 },
    costByModel: { haiku: 0, sonnet: 0, opus: 0, gemini_flash: 0 },
  };

  const calls: APICall[] = JSON.parse(localStorage.getItem(COST_KEY) || "[]");
  const stats: CostStats = {
    totalCalls: calls.length,
    totalCostUSD: 0,
    cachedCalls: calls.filter(c => c.cached).length,
    savedByCache: 0,
    callsByModel: { haiku: 0, sonnet: 0, opus: 0, gemini_flash: 0 },
    costByModel: { haiku: 0, sonnet: 0, opus: 0, gemini_flash: 0 },
  };

  for (const call of calls) {
    stats.totalCostUSD += call.costUSD;
    stats.callsByModel[call.model]++;
    stats.costByModel[call.model] += call.costUSD;
    if (call.cached) stats.savedByCache += call.costUSD;
  }

  return stats;
}

export function getRecentCalls(n = 20): APICall[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(COST_KEY) || "[]").slice(0, n);
}

// ── MAIN API CALL FUNCTION ────────────────────────────────────────────────────

import { getActiveProvider, complete } from "@/lib/llm";

export async function smartCall(opts: {
  task: TaskType;
  prompt: string;
  systemPrompt?: string;
  forceModel?: ModelTier;
  skipCache?: boolean;
  maxTokens?: number;
}): Promise<string> {
  const model = opts.forceModel || TASK_ROUTING[opts.task];
  const modelConfig = PRICING[model];

  // Check cache first
  if (!opts.skipCache) {
    const cacheKey = getCacheKey(opts.task, opts.prompt);
    const cached = checkCache(cacheKey);
    if (cached) {
      logAPICall({ model: cached.model, inputTokens: 0, outputTokens: 0, costUSD: 0, task: opts.task, cached: true });
      return cached.result;
    }
  }

  const active = getActiveProvider();

  // Use Google (Gemini) when preferred and key is set
  if (active?.provider === "google") {
    const result = await complete({
      prompt: opts.prompt,
      systemPrompt: opts.systemPrompt,
      maxTokens: opts.maxTokens || 1000,
    });
    const inputTokens = Math.ceil((opts.prompt.length + (opts.systemPrompt?.length ?? 0)) / 4);
    const outputTokens = Math.ceil(result.length / 4);
    const geminiConfig = PRICING.gemini_flash;
    const costUSD = (inputTokens / 1_000_000) * geminiConfig.input + (outputTokens / 1_000_000) * geminiConfig.output;
    logAPICall({ model: "gemini_flash", inputTokens, outputTokens, costUSD, task: opts.task, cached: false });
    if (!opts.skipCache) {
      const cacheKey = getCacheKey(opts.task, opts.prompt);
      setCache(cacheKey, { result, timestamp: Date.now(), model: "gemini_flash" });
    }
    return result;
  }

  // Claude path: use server-side proxy (no client-side API key needed)
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: proxyHeaders(),
    body: JSON.stringify({
      provider: "claude",
      model: modelConfig.modelId,
      max_tokens: opts.maxTokens || 1000,
      prompt: opts.prompt,
      system: opts.systemPrompt,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "API call failed");
  }

  const result = data.content?.[0]?.text || "";
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const costUSD = ((inputTokens / 1_000_000) * modelConfig.input) +
                  ((outputTokens / 1_000_000) * modelConfig.output);

  logAPICall({ model, inputTokens, outputTokens, costUSD, task: opts.task, cached: false });

  if (!opts.skipCache) {
    const cacheKey = getCacheKey(opts.task, opts.prompt);
    setCache(cacheKey, { result, timestamp: Date.now(), model });
  }

  return result;
}

// ── USER SAVINGS CONFIGURATION ────────────────────────────────────────────────

const SAVINGS_CONFIG_KEY = "cbt_os_savings_config";

export interface SavingsConfig {
  monthlyBudgetUSD: number;
  targetSavingsPercent: number; // 80-90%
  autoDowngrade: boolean;       // Auto-switch to cheaper models when approaching budget
  aggressiveCaching: boolean;   // Extend cache to 7 days
  batchNonUrgent: boolean;      // Queue background tasks
  preferredFreeTier: boolean;   // Prefer Gemini free tier when available
}

export function getDefaultSavingsConfig(): SavingsConfig {
  return {
    monthlyBudgetUSD: 30,
    targetSavingsPercent: 85,
    autoDowngrade: true,
    aggressiveCaching: true,
    batchNonUrgent: true,
    preferredFreeTier: true,
  };
}

export function getSavingsConfig(): SavingsConfig {
  if (typeof window === "undefined") return getDefaultSavingsConfig();
  try {
    const stored = localStorage.getItem(SAVINGS_CONFIG_KEY);
    return stored ? { ...getDefaultSavingsConfig(), ...JSON.parse(stored) } : getDefaultSavingsConfig();
  } catch { return getDefaultSavingsConfig(); }
}

export function setSavingsConfig(config: Partial<SavingsConfig>): void {
  if (typeof window === "undefined") return;
  const current = getSavingsConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(SAVINGS_CONFIG_KEY, JSON.stringify(updated));
}

// ── SAVINGS ANALYSIS ──────────────────────────────────────────────────────────

export interface SavingsAnalysis {
  currentMonthlySpend: number;
  projectedMonthlySpend: number;
  potentialSavingsUSD: number;
  potentialSavingsPercent: number;
  recommendations: string[];
  currentTierBreakdown: Record<ModelTier, number>;
  optimizedTierBreakdown: Record<ModelTier, number>;
}

export function analyzeSavingsOpportunity(): SavingsAnalysis {
  const stats = getCostStats();
  const calls = getRecentCalls(100);
  
  // Calculate current monthly rate
  const daysOfData = calls.length > 0 
    ? (Date.now() - new Date(calls[calls.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24)
    : 1;
  const currentDailySpend = stats.totalCostUSD / Math.max(daysOfData, 1);
  const currentMonthlySpend = currentDailySpend * 30;
  
  // Analyze what could be optimized
  let opusCalls = stats.callsByModel.opus;
  let sonnetCalls = stats.callsByModel.sonnet;
  let haikuCalls = stats.callsByModel.haiku;
  let geminiCalls = stats.callsByModel.gemini_flash;
  
  // Estimate how many could be downgraded
  // 60% of Opus calls could be Sonnet (saves 80%)
  // 40% of Sonnet calls could be Haiku (saves 94%)
  // 30% of all calls could use Gemini (saves 97%)
  const opusToSonnet = Math.floor(opusCalls * 0.6);
  const sonnetToHaiku = Math.floor(sonnetCalls * 0.4);
  const anyToGemini = Math.floor((stats.totalCalls - geminiCalls) * 0.3);
  
  const currentOpusCost = stats.costByModel.opus;
  const currentSonnetCost = stats.costByModel.sonnet;
  const currentHaikuCost = stats.costByModel.haiku;
  const currentGeminiCost = stats.costByModel.gemini_flash;
  
  // Calculate optimized costs
  const savedByDowngradingOpus = opusToSonnet * (15 - 3) * (1000 / 1000000); // Approximate per call
  const savedByDowngradingSonnet = sonnetToHaiku * (3 - 0.25) * (1000 / 1000000);
  const savedByUsingGemini = anyToGemini * (3 - 0.075) * (1000 / 1000000); // Avg vs Gemini
  
  const totalPotentialSavings = savedByDowngradingOpus + savedByDowngradingSonnet + savedByUsingGemini;
  const potentialSavingsPercent = stats.totalCostUSD > 0 
    ? Math.round((totalPotentialSavings / stats.totalCostUSD) * 100)
    : 85;
  
  const recommendations: string[] = [];
  
  if (opusCalls > 0) {
    recommendations.push(`Move ${opusToSonnet} Opus calls to Sonnet — saves ~80% per call`);
  }
  if (sonnetCalls > 0) {
    recommendations.push(`Use Haiku for ${sonnetToHaiku} Sonnet calls — saves ~94% per call`);
  }
  if (anyToGemini > 0) {
    recommendations.push(`Switch ${anyToGemini} calls to Gemini free tier — saves ~97%`);
  }
  if (stats.cachedCalls / stats.totalCalls < 0.3) {
    recommendations.push("Enable aggressive caching — 24h → 7 days for repetitive tasks");
  }
  recommendations.push("Batch non-urgent background tasks — process during off-peak hours");
  recommendations.push("Use 'classify' and 'score' tasks for Haiku — 60x cheaper than Opus");
  
  return {
    currentMonthlySpend,
    projectedMonthlySpend: currentMonthlySpend - (totalPotentialSavings * 30 / Math.max(daysOfData, 1)),
    potentialSavingsUSD: totalPotentialSavings * 30 / Math.max(daysOfData, 1),
    potentialSavingsPercent: Math.min(potentialSavingsPercent, 90),
    recommendations,
    currentTierBreakdown: { ...stats.callsByModel },
    optimizedTierBreakdown: {
      haiku: haikuCalls + sonnetToHaiku,
      sonnet: sonnetCalls - sonnetToHaiku + opusToSonnet,
      opus: opusCalls - opusToSonnet,
      gemini_flash: geminiCalls + anyToGemini,
    },
  };
}

// ── COST CALCULATOR (for UI) ──────────────────────────────────────────────────

export function estimateCost(task: TaskType, estimatedTokens: number): {
  model: ModelTier;
  estimatedCostUSD: number;
  modelId: string;
} {
  const model = TASK_ROUTING[task];
  const config = PRICING[model];
  const estimatedCostUSD = (estimatedTokens / 1_000_000) * (config.input + config.output) / 2;
  return { model, estimatedCostUSD, modelId: config.modelId };
}

export function getModelLabel(tier: ModelTier): string {
  const labels: Record<ModelTier, string> = {
    haiku: "Claude Haiku — Fast & Cheap",
    sonnet: "Claude Sonnet — Balanced",
    opus: "Claude Opus — Maximum Power",
    gemini_flash: "Google Gemini Flash — Free tier / low cost",
  };
  return labels[tier];
}

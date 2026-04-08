"use client";

import { useState, useEffect } from "react";
import { DollarSign, Zap, TrendingDown, RefreshCw, Brain, Clock, Target, Shield, Settings, List, Play, Trash2 } from "lucide-react";
import { getCostStats, getRecentCalls, getSavingsConfig, setSavingsConfig, analyzeSavingsOpportunity, getQueueStats, processBatchQueue, clearCompletedBatchItems, type ModelTier, type CostStats, type APICall, type SavingsConfig } from "@/lib/api-optimizer";
import { getPreferredProvider, getActiveProvider } from "@/lib/llm";

const MODEL_CONFIG: Record<ModelTier, { label: string; color: string; desc: string; inputCost: string; outputCost: string }> = {
  haiku:        { label: "Claude Haiku",     color: "text-emerald-400", desc: "Fast & cheap — classification, summaries, scoring", inputCost: "$0.25", outputCost: "$1.25" },
  sonnet:       { label: "Claude Sonnet",    color: "text-blue-400",    desc: "Balanced — research, analysis, reports",            inputCost: "$3.00",  outputCost: "$15.00" },
  opus:         { label: "Claude Opus",      color: "text-purple-400",  desc: "Maximum power — synthesis, strategy, builds",       inputCost: "$15.00", outputCost: "$75.00" },
  gemini_flash: { label: "Google Gemini",    color: "text-blue-300",   desc: "Free tier / low cost — Skills & optimizer",        inputCost: "$0.075", outputCost: "$0.30" },
};

const TASK_ROUTING_DISPLAY = [
  { task: "Classify / Score / Extract",     model: "haiku",  savings: "94%" },
  { task: "Short summaries",                model: "haiku",  savings: "94%" },
  { task: "Session summaries",              model: "haiku",  savings: "94%" },
  { task: "Research query generation",      model: "haiku",  savings: "94%" },
  { task: "Long document summaries",        model: "sonnet", savings: "80%" },
  { task: "Research gap analysis",          model: "sonnet", savings: "80%" },
  { task: "Competitor analysis",            model: "sonnet", savings: "80%" },
  { task: "Weekly reports",                 model: "sonnet", savings: "80%" },
  { task: "Hackathon planning",             model: "sonnet", savings: "80%" },
  { task: "Research synthesis (final)",     model: "opus",   savings: "0%" },
  { task: "Competitor strategy",            model: "opus",   savings: "0%" },
  { task: "Hackathon full build",           model: "opus",   savings: "0%" },
];

function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
  return `$${usd.toFixed(4)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function APICostOptimizer() {
  const [stats, setStats] = useState<CostStats | null>(null);
  const [calls, setCalls] = useState<APICall[]>([]);
  const [savingsConfig, setSavingsConfigState] = useState<SavingsConfig>(getSavingsConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [queueStats, setQueueStats] = useState({ total: 0, queued: 0, processing: 0, completed: 0, failed: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { refresh(); }, []);

  function refresh() {
    setStats(getCostStats());
    setCalls(getRecentCalls(30));
    setSavingsConfigState(getSavingsConfig());
    setQueueStats(getQueueStats());
  }

  function updateConfig(updates: Partial<SavingsConfig>) {
    setSavingsConfig(updates);
    setSavingsConfigState(getSavingsConfig());
  }

  async function handleProcessQueue() {
    setIsProcessing(true);
    await processBatchQueue(5);
    refresh();
    setIsProcessing(false);
  }

  function handleClearCompleted() {
    clearCompletedBatchItems();
    refresh();
  }

  const cacheRate = stats && stats.totalCalls > 0
    ? Math.round((stats.cachedCalls / stats.totalCalls) * 100) : 0;

  const estimatedWithoutOptimization = stats
    ? stats.costByModel.haiku * (15 / 0.25) + stats.costByModel.sonnet + stats.costByModel.opus + stats.costByModel.gemini_flash
    : 0;
  const actualSavings = estimatedWithoutOptimization - (stats?.totalCostUSD || 0);

  const activeProvider = getActiveProvider();
  const preferred = getPreferredProvider();
  const savingsAnalysis = analyzeSavingsOpportunity();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-1">API Cost Optimizer</div>
            <h2 className="text-xl font-bold text-neutral-100">Maximize Savings, Minimize Burn</h2>
            <p className="text-sm text-neutral-500 mt-1">Target: {savingsConfig.targetSavingsPercent}% savings through smart routing and caching</p>
            {activeProvider && (
              <p className="text-xs text-neutral-500 mt-1 font-mono">
                Active: {activeProvider.provider === "google" ? "Google Gemini (Free tier)" : "Claude (Anthropic)"}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg transition-colors">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button onClick={refresh} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Savings Goal Dashboard */}
        <div className="bg-gradient-to-r from-emerald-950/50 to-blue-950/50 border border-emerald-800/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-emerald-400" />
            <div className="text-sm font-semibold text-emerald-400">Savings Goal: {savingsConfig.targetSavingsPercent}%</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-200">${savingsAnalysis.currentMonthlySpend.toFixed(2)}</div>
              <div className="text-xs text-neutral-500">Current Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">${savingsAnalysis.projectedMonthlySpend.toFixed(2)}</div>
              <div className="text-xs text-neutral-500">With Optimization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">${savingsAnalysis.potentialSavingsUSD.toFixed(2)}</div>
              <div className="text-xs text-neutral-500">Potential Savings</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
              <span>Budget Usage</span>
              <span>{Math.round((savingsAnalysis.currentMonthlySpend / savingsConfig.monthlyBudgetUSD) * 100)}% of ${savingsConfig.monthlyBudgetUSD}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  savingsAnalysis.currentMonthlySpend > savingsConfig.monthlyBudgetUSD ? 'bg-red-400' : 
                  savingsAnalysis.currentMonthlySpend > savingsConfig.monthlyBudgetUSD * 0.8 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min((savingsAnalysis.currentMonthlySpend / savingsConfig.monthlyBudgetUSD) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Recommendations */}
          {savingsAnalysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">How to Save {savingsAnalysis.potentialSavingsPercent}%</div>
              {savingsAnalysis.recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 flex-shrink-0">{i + 1}.</span>
                  <span className="text-neutral-300">{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-amber-400" />
              <div className="text-sm font-semibold text-neutral-200">Savings Configuration</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-2">Monthly Budget ($)</label>
                <input 
                  type="number" 
                  value={savingsConfig.monthlyBudgetUSD}
                  onChange={(e) => updateConfig({ monthlyBudgetUSD: parseInt(e.target.value) || 30 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-2">Target Savings (%)</label>
                <input 
                  type="number" 
                  value={savingsConfig.targetSavingsPercent}
                  onChange={(e) => updateConfig({ targetSavingsPercent: parseInt(e.target.value) || 85 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { key: 'autoDowngrade', label: 'Auto-downgrade models', desc: 'Switch to cheaper models near budget' },
                { key: 'aggressiveCaching', label: 'Aggressive caching', desc: '7-day cache for repetitive tasks' },
                { key: 'batchNonUrgent', label: 'Batch background tasks', desc: 'Queue and process off-peak' },
                { key: 'preferredFreeTier', label: 'Prefer Gemini free tier', desc: 'Use when available' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={savingsConfig[key as keyof SavingsConfig] as boolean}
                    onChange={(e) => updateConfig({ [key]: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm text-neutral-300">{label}</div>
                    <div className="text-xs text-neutral-600">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Batch Queue Status */}
        {savingsConfig.batchNonUrgent && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-blue-400" />
                <div className="text-sm font-semibold text-neutral-200">Background Task Queue</div>
              </div>
              <div className="flex gap-2">
                {queueStats.queued > 0 && (
                  <button 
                    onClick={handleProcessQueue}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/30 border border-blue-900/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    {isProcessing ? "Processing..." : `Process ${queueStats.queued}`}
                  </button>
                )}
                {queueStats.completed > 0 && (
                  <button 
                    onClick={handleClearCompleted}
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear {queueStats.completed}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Queued", value: queueStats.queued, color: "text-blue-400" },
                { label: "Processing", value: queueStats.processing, color: "text-amber-400" },
                { label: "Completed", value: queueStats.completed, color: "text-emerald-400" },
                { label: "Failed", value: queueStats.failed, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center bg-neutral-950 rounded-lg p-3">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-neutral-600">{label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-600 mt-3">
              Background tasks are queued and processed in batches to maximize cache hits and minimize API calls.
            </p>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Cost", value: formatCost(stats.totalCostUSD), icon: DollarSign, color: "text-amber-400" },
              { label: "Saved by Cache", value: formatCost(stats.savedByCache), icon: TrendingDown, color: "text-emerald-400" },
              { label: "Cache Rate", value: `${cacheRate}%`, icon: Zap, color: "text-blue-400" },
              { label: "Total Calls", value: stats.totalCalls, icon: Brain, color: "text-neutral-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <Icon className="w-4 h-4 text-neutral-700 mb-2" />
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Model usage breakdown */}
        {stats && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Usage by Model</div>
            <div className="space-y-3">
              {(["haiku", "sonnet", "opus", "gemini_flash"] as ModelTier[]).map(model => {
                const config = MODEL_CONFIG[model];
                const callCount = stats.callsByModel[model];
                const cost = stats.costByModel[model];
                const pct = stats.totalCalls > 0 ? (callCount / stats.totalCalls) * 100 : 0;
                return (
                  <div key={model}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                        <span className="text-xs text-neutral-600 font-mono">{callCount} calls</span>
                      </div>
                      <span className="text-xs font-mono text-neutral-500">{formatCost(cost)}</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${model === "haiku" ? "bg-emerald-400" : model === "sonnet" ? "bg-blue-400" : model === "opus" ? "bg-purple-400" : "bg-blue-300"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-700 mt-1">{config.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Routing rules */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Smart Routing Rules</div>
          <p className="text-xs text-neutral-600 mb-4">Every API call is automatically routed to the cheapest model that can handle it well.</p>
          <div className="space-y-2">
            {TASK_ROUTING_DISPLAY.map(({ task, model, savings }) => {
              const config = MODEL_CONFIG[model as ModelTier];
              return (
                <div key={task} className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0">
                  <span className="text-sm text-neutral-400 flex-1">{task}</span>
                  <span className={`text-xs font-mono font-semibold ${config.color}`}>{config.label.split(" ")[1]}</span>
                  {savings !== "0%" && (
                    <span className="text-xs font-mono text-emerald-400/70">saves {savings} vs Opus</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Caching explanation */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-3">Cache System</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "24-hour TTL", desc: "Same research topic or query returns cached result instantly — $0 cost" },
              { label: "100 entry max", desc: "Oldest entries auto-evicted to keep cache lean and relevant" },
              { label: "Task-aware keys", desc: "Cache keys include task type so similar prompts don't collide" },
              { label: "Transparent logging", desc: "Every cached hit is logged so you see exactly what you saved" },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <p className="text-sm font-semibold text-neutral-300 mb-1">{label}</p>
                <p className="text-xs text-neutral-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing reference */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Pricing Reference (per 1M tokens)</div>
          <div className="grid grid-cols-3 gap-3">
            {(["haiku", "sonnet", "opus", "gemini_flash"] as ModelTier[]).map(model => {
              const config = MODEL_CONFIG[model];
              return (
                <div key={model} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                  <p className={`text-sm font-bold ${config.color} mb-2`}>{config.label}</p>
                  <div className="space-y-1 text-xs font-mono text-neutral-500">
                    <div className="flex justify-between">
                      <span>Input</span><span className="text-neutral-300">{config.inputCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output</span><span className="text-neutral-300">{config.outputCost}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-neutral-700 mt-3 font-mono text-center">
            Typical session: ~$0.02–0.08 · Typical research report: ~$0.15–0.40 · Target monthly spend: $15–30
          </p>
        </div>

        {/* Recent calls */}
        {calls.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Recent API Calls</div>
            <div className="space-y-1">
              {calls.map(call => {
                const config = MODEL_CONFIG[call.model];
                return (
                  <div key={call.id} className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0">
                    <span className={`text-xs font-mono w-14 flex-shrink-0 ${config.color}`}>
                      {call.model.slice(0, 6)}
                    </span>
                    <span className="text-xs text-neutral-500 flex-1 truncate">{call.task}</span>
                    {call.cached
                      ? <span className="text-xs font-mono text-emerald-400 flex-shrink-0">cached</span>
                      : <span className="text-xs font-mono text-neutral-500 flex-shrink-0">{formatCost(call.costUSD)}</span>
                    }
                    <span className="text-xs font-mono text-neutral-700 flex-shrink-0">{formatTime(call.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {calls.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No API calls yet. Add a Claude or Google (Gemini) key in Settings to use Skills and track cost here.</p>
          </div>
        )}

      </div>
    </div>
  );
}

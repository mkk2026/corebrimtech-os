"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Users, DollarSign, Package, Trophy,
  Target, Shield, Copy, Check, ExternalLink, Star,
  BarChart2, Zap
} from "lucide-react";
import { getBrain, getTotalMetrics, type FounderBrain } from "@/lib/founder-brain";
import { getRevenueStats } from "@/lib/money";
import { getGrantStats } from "@/lib/grant-tracker";
import { getGoalStats } from "@/lib/goals";
import { getSessionStats } from "@/lib/session-brain";
import { getLibrary } from "@/lib/research-storage";

function formatMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function MetricTile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="border border-neutral-200 rounded-xl p-5 bg-white">
      <div className={`text-2xl font-black mb-1 ${color || "text-neutral-900"}`}>{value}</div>
      <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

// ── INVESTOR VIEW (light theme — designed to be shared) ───────────────────────

function InvestorReport({ brain }: { brain: FounderBrain }) {
  const metrics = getTotalMetrics();
  const revenue = getRevenueStats();
  const grants = getGrantStats();
  const goals = getGoalStats();
  const sessions = getSessionStats();
  const researchCount = getLibrary().length;

  const mainProduct = brain.products[0];
  const founder = brain.founders[0];
  const cofounder = brain.founders[1];

  return (
    <div className="bg-neutral-50 min-h-full font-sans" id="investor-report">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                <span className="text-amber-400 font-black text-xs">CBT</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-neutral-900">{brain.companyName}</h1>
                {brain.companyTagline && <p className="text-sm text-neutral-500">{brain.companyTagline}</p>}
              </div>
            </div>
            <p className="text-xs text-neutral-400 font-mono">{brain.location} · {new Date().toLocaleDateString([], { month: "long", year: "numeric" })}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-full px-3 py-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{brain.stage.replace("-", " ")}</span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">Traction Update</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">

        {/* Mission */}
        {brain.companyMission && (
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <p className="text-lg font-bold text-neutral-800 leading-relaxed italic">"{brain.companyMission}"</p>
          </div>
        )}

        {/* Core Metrics */}
        <div>
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Traction Metrics</h2>
          <div className="grid grid-cols-4 gap-3">
            <MetricTile label="Total Users" value={metrics.totalUsers.toLocaleString()} color="text-blue-600" />
            <MetricTile label="MRR" value={formatMoney(metrics.totalMRR)} sub="Monthly Recurring Revenue" color="text-emerald-600" />
            <MetricTile label="All-Time Revenue" value={formatMoney(revenue.allTime)} sub={`${revenue.entryCount} transactions`} color="text-neutral-900" />
            <MetricTile label="MoM Growth" value={`${revenue.growth > 0 ? "+" : ""}${revenue.growth}%`} color={revenue.growth >= 0 ? "text-emerald-600" : "text-red-600"} />
          </div>
        </div>

        {/* Products */}
        {brain.products.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Products</h2>
            <div className="space-y-3">
              {brain.products.map(p => (
                <div key={p.id} className="bg-white border border-neutral-200 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-neutral-900">{p.name}</h3>
                      <p className="text-sm text-neutral-500">{p.description}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      p.status === "live" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "beta" ? "bg-blue-100 text-blue-700" :
                      "bg-neutral-100 text-neutral-600"
                    }`}>{p.status}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Total Users", value: p.totalUsers.toLocaleString() },
                      { label: "Active Users", value: p.activeUsers.toLocaleString() },
                      { label: "MRR", value: formatMoney(p.mrr) },
                      { label: "Growth", value: `${p.mrrGrowth}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-neutral-50 rounded-lg p-3">
                        <div className="text-sm font-black text-neutral-800">{value}</div>
                        <div className="text-xs text-neutral-500 font-medium">{label}</div>
                      </div>
                    ))}
                  </div>
                  {p.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.techStack.map(t => (
                        <span key={t} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-mono">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Founders */}
        <div>
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Team</h2>
          <div className="grid grid-cols-2 gap-4">
            {[founder, cofounder].filter(Boolean).map(f => f && (
              <div key={f.id} className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                    <span className="text-amber-400 font-bold text-sm">
                      {f.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">{f.name}</p>
                    <p className="text-sm text-neutral-500">{f.role}</p>
                  </div>
                </div>
                {f.bio && <p className="text-sm text-neutral-600 leading-relaxed mb-3">{f.bio}</p>}
                {f.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {f.skills.slice(0, 5).map((s: string) => (
                      <span key={s} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Goals progress */}
        {goals.active > 0 && (
          <div>
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Current Objectives</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Active Goals", value: goals.active, color: "text-amber-600" },
                { label: "Avg Progress", value: `${goals.avgProgress}%`, color: "text-blue-600" },
                { label: "On Track", value: goals.onTrack, color: "text-emerald-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white border border-neutral-200 rounded-xl p-5">
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        <div>
          <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Execution Velocity</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Sessions / Week", value: sessions.sessionsThisWeek },
              { label: "Total Sessions", value: sessions.totalSessions },
              { label: "Research Reports", value: researchCount },
              { label: "Grants Pipeline", value: `$${(grants.potential / 1000).toFixed(0)}K` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-neutral-200 rounded-xl p-4">
                <div className="text-xl font-black text-neutral-900">{value}</div>
                <div className="text-xs font-medium text-neutral-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitors */}
        {brain.competitors.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Competitive Landscape</h2>
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4">
                {brain.competitors.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      c.threatLevel === "high" || c.threatLevel === "critical" ? "bg-red-400" :
                      c.threatLevel === "medium" ? "bg-amber-400" : "bg-neutral-400"
                    }`} />
                    <span className="text-sm font-medium text-neutral-700">{c.name}</span>
                    {c.weaknesses.length > 0 && (
                      <span className="text-xs text-neutral-400 truncate">— {c.weaknesses[0]}</span>
                    )}
                  </div>
                ))}
              </div>
              {brain.targetMarkets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 mb-2">Our moat: founder-market fit in markets competitors haven't touched</p>
                  <div className="flex flex-wrap gap-2">
                    {brain.targetMarkets.map(m => (
                      <span key={m} className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vision */}
        {brain.companyVision && (
          <div className="bg-neutral-900 rounded-xl p-6 text-center">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-3" />
            <p className="text-base text-neutral-200 leading-relaxed italic">"{brain.companyVision}"</p>
            <p className="text-xs text-neutral-500 font-mono mt-3">{brain.companyName} · {brain.location}</p>
          </div>
        )}

        <div className="text-center pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-400 font-mono">Generated by CORE BRIM TECH OS · {new Date().toLocaleDateString()}</p>
        </div>

      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function InvestorView() {
  const [brain, setBrain] = useState<FounderBrain | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBrain(getBrain());
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!brain || !brain.setupComplete) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <BarChart2 className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-neutral-300 mb-2">Complete Founder Brain First</h3>
          <p className="text-sm text-neutral-500">The Investor View generates from your Founder Brain data. Set it up first, then come back.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Controls */}
      <div className="border-b border-neutral-800 px-6 py-3 flex items-center gap-3 bg-neutral-950">
        <p className="text-xs text-neutral-500 flex-1 font-mono">This is what an investor or partner sees when you share your traction</p>
        <button onClick={handleCopy} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-lg transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
          Export PDF
        </button>
      </div>

      {/* Report */}
      <div className="flex-1 min-h-0 overflow-auto">
        <InvestorReport brain={brain} />
      </div>
    </div>
  );
}

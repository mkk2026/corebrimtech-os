"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, Plus, TrendingUp, Users, Target, Trash2,
  ChevronDown, ChevronUp, Check, ArrowRight, BarChart2, Sparkles, Building2
} from "lucide-react";
import {
  getClients, addClient, updateClient, deleteClient, getPipelineStats,
  getRevenue, addRevenue, deleteRevenue, getRevenueStats,
  type Client, type DealStatus, type RevenueEntry, type IncomeType
} from "@/lib/money";
import FounderBrainNudge from "@/components/FounderBrainNudge";
import ClientPipelineAI from "./ClientPipelineAI";
import InvestorDatabase from "./InvestorDatabase";

// ── CONFIG ────────────────────────────────────────────────────────────────────

const DEAL_STATUS: Record<DealStatus, { label: string; color: string; next?: DealStatus }> = {
  lead:        { label: "Lead",        color: "text-neutral-400 border-neutral-700 bg-neutral-800",      next: "contacted" },
  contacted:   { label: "Contacted",   color: "text-blue-400 border-blue-400/30 bg-blue-400/10",         next: "proposal" },
  proposal:    { label: "Proposal",    color: "text-amber-400 border-amber-400/30 bg-amber-400/10",      next: "negotiating" },
  negotiating: { label: "Negotiating", color: "text-purple-400 border-purple-400/30 bg-purple-400/10",   next: "won" },
  won:         { label: "Won ✓",       color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  lost:        { label: "Lost",        color: "text-red-400/60 border-red-400/20 bg-red-400/5" },
  on_hold:     { label: "On Hold",     color: "text-neutral-600 border-neutral-800 bg-neutral-900" },
};

const INCOME_TYPES: Record<IncomeType, { label: string; color: string; emoji: string }> = {
  hackathon:  { label: "Hackathon Prize", color: "text-amber-400",  emoji: "🏆" },
  freelance:  { label: "Freelance",       color: "text-blue-400",   emoji: "💼" },
  grant:      { label: "Grant",           color: "text-emerald-400",emoji: "🎁" },
  consulting: { label: "Consulting",      color: "text-purple-400", emoji: "🧠" },
  product:    { label: "Product/SaaS",    color: "text-cyan-400",   emoji: "📦" },
  other:      { label: "Other",           color: "text-neutral-400",emoji: "💰" },
};

function formatMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

// ── CLIENT PIPELINE ───────────────────────────────────────────────────────────

function AddClientForm({ onAdd }: { onAdd: () => void }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", service: "", value: "", source: "", status: "lead" as DealStatus, probability: 50, notes: "", nextAction: "" });

  function handleAdd() {
    if (!form.name.trim() || !form.service.trim()) return;
    addClient({
      name: form.name, company: form.company, email: form.email,
      service: form.service, value: Number(form.value) || 0, currency: "USD",
      source: form.source, status: form.status, probability: form.probability,
      notes: form.notes, nextAction: form.nextAction,
    });
    onAdd();
    setForm({ name: "", company: "", email: "", service: "", value: "", source: "", status: "lead", probability: 50, notes: "", nextAction: "" });
  }

  return (
    <div className="bg-neutral-900 border border-amber-400/20 rounded-lg p-5 space-y-4">
      <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">Add Deal</div>
      <div className="grid grid-cols-2 gap-4">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contact name *" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company (optional)" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        <input value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder="Service (e.g. Web dev) *" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="Deal value (USD)" type="number" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Source (LinkedIn, Referral...)" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
      </div>
      <input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))} placeholder="Next action (e.g. Send proposal by Friday)" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs text-neutral-600 block mb-1">Win probability: {form.probability}%</label>
          <input type="range" min={0} max={100} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))} className="w-full accent-amber-400" />
        </div>
        <button onClick={handleAdd} className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">Add Deal</button>
      </div>
    </div>
  );
}

function ClientCard({ client, onUpdate }: { client: Client; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const status = DEAL_STATUS[client.status];
  const nextStatus = status.next;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-neutral-200">{client.name}</span>
            {client.company && <span className="text-xs text-neutral-600">· {client.company}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-500">{client.service}</span>
            {client.value > 0 && <span className="text-xs font-mono text-emerald-400 font-bold">{formatMoney(client.value)}</span>}
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${status.color}`}>{status.label}</span>
            <span className="text-xs text-neutral-600">{client.probability}% win</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextStatus && (
            <button onClick={() => { updateClient(client.id, { status: nextStatus }); onUpdate(); }}
              className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-neutral-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
              Move to {DEAL_STATUS[nextStatus].label} <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-neutral-600 hover:text-neutral-300 transition-colors p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => { deleteClient(client.id); onUpdate(); }} className="text-neutral-700 hover:text-red-400 transition-colors p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-neutral-800 px-4 py-3 space-y-3">
          {client.nextAction && (
            <div className="flex gap-2 bg-amber-400/5 border border-amber-400/15 rounded-lg p-3">
              <Target className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-neutral-600 mb-0.5">Next Action</p>
                <p className="text-sm text-neutral-300">{client.nextAction}</p>
              </div>
            </div>
          )}
          {client.notes && <p className="text-xs text-neutral-500">{client.notes}</p>}
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(DEAL_STATUS) as DealStatus[]).map(s => (
              <button key={s} onClick={() => { updateClient(client.id, { status: s }); onUpdate(); }}
                className={`text-xs px-2.5 py-1 rounded border transition-all ${client.status === s ? DEAL_STATUS[s].color : "border-neutral-800 text-neutral-700 hover:text-neutral-400"}`}>
                {DEAL_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── REVENUE DASHBOARD ─────────────────────────────────────────────────────────

function AddRevenueForm({ onAdd }: { onAdd: () => void }) {
  const [form, setForm] = useState({ type: "freelance" as IncomeType, description: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });

  function handleAdd() {
    if (!form.description.trim() || !form.amount) return;
    addRevenue({ type: form.type, description: form.description, amount: Number(form.amount), currency: "USD", date: form.date, recurring: false, notes: form.notes });
    onAdd();
    setForm({ type: "freelance", description: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
  }

  return (
    <div className="bg-neutral-900 border border-emerald-400/20 rounded-lg p-5 space-y-4">
      <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Log Revenue</div>
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(INCOME_TYPES) as [IncomeType, { label: string; color: string; emoji: string }][]).map(([type, cfg]) => (
          <button key={type} onClick={() => setForm(f => ({ ...f, type }))}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${form.type === type ? `${cfg.color} border-current bg-current/10` : "border-neutral-800 text-neutral-600 hover:text-neutral-400"}`}>
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description *" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-400 transition-colors" />
        </div>
        <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (USD) *" type="number" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-400 transition-colors" />
      </div>
      <div className="flex gap-3">
        <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-400 transition-colors" />
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-400 transition-colors" />
        <button onClick={handleAdd} className="bg-emerald-400 hover:bg-emerald-300 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors flex-shrink-0">Log</button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function MoneyDashboard({ onNavigate }: { onNavigate?: (module: string) => void } = {}) {
  const [tab, setTab] = useState<"revenue" | "pipeline" | "ai" | "investors">("revenue");
  const [clients, setClients] = useState<Client[]>([]);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [revenueStats, setRevenueStats] = useState(getRevenueStats());
  const [pipelineStats, setPipelineStats] = useState(getPipelineStats());
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);

  useEffect(() => { refresh(); }, []);

  function refresh() {
    setClients(getClients());
    setRevenue(getRevenue());
    setRevenueStats(getRevenueStats());
    setPipelineStats(getPipelineStats());
  }

  if (tab === "ai") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-neutral-800 px-6 flex gap-0">
          {[
            { id: "revenue", label: "Revenue Dashboard", icon: DollarSign },
            { id: "pipeline", label: `Client Pipeline (${clients.length})`, icon: Users },
            { id: "ai", label: "AI Assistant", icon: Sparkles },
            { id: "investors", label: "Investors", icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-amber-400 text-amber-400" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-6">
          <ClientPipelineAI onBack={() => setTab("pipeline")} />
        </div>
      </div>
    );
  }

  if (tab === "investors") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-neutral-800 px-6 flex gap-0">
          {[
            { id: "revenue", label: "Revenue Dashboard", icon: DollarSign },
            { id: "pipeline", label: `Client Pipeline (${clients.length})`, icon: Users },
            { id: "ai", label: "AI Assistant", icon: Sparkles },
            { id: "investors", label: "Investors", icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-amber-400 text-amber-400" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-6">
          <InvestorDatabase onBack={() => setTab("revenue")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-0">
        {[
          { id: "revenue", label: "Revenue Dashboard", icon: DollarSign },
          { id: "pipeline", label: `Client Pipeline (${clients.length})`, icon: Users },
          { id: "ai", label: "AI Assistant", icon: Sparkles },
          { id: "investors", label: "Investors", icon: Building2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-amber-400 text-amber-400" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6 mb-6">
          <FounderBrainNudge onNavigate={onNavigate} />
        </div>
        {tab === "revenue" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Revenue stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "All Time", value: formatMoney(revenueStats.allTime), color: "text-neutral-100" },
                { label: "This Year", value: formatMoney(revenueStats.thisYear), color: "text-amber-400" },
                { label: "This Month", value: formatMoney(revenueStats.thisMonth), color: "text-emerald-400" },
                { label: "Growth", value: `${revenueStats.growth > 0 ? "+" : ""}${revenueStats.growth}%`, color: revenueStats.growth >= 0 ? "text-emerald-400" : "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* By type */}
            {revenueStats.allTime > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Revenue by Source</div>
                <div className="space-y-2">
                  {(Object.entries(revenueStats.byType) as [IncomeType, number][])
                    .filter(([, v]) => v > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, amount]) => {
                      const cfg = INCOME_TYPES[type];
                      const pct = revenueStats.allTime > 0 ? (amount / revenueStats.allTime) * 100 : 0;
                      return (
                        <div key={type}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-neutral-400">{cfg.emoji} {cfg.label}</span>
                            <span className="text-xs font-mono font-bold text-neutral-300">{formatMoney(amount)}</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${cfg.color.replace("text", "bg")}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* Add revenue */}
            <button onClick={() => setShowAddRevenue(!showAddRevenue)}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
              <Plus className="w-4 h-4" />
              Log Revenue Entry
            </button>
            {showAddRevenue && <AddRevenueForm onAdd={() => { refresh(); setShowAddRevenue(false); }} />}

            {/* Revenue log */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Revenue Log</div>
              {revenue.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600">No revenue logged yet.</p>
                  <p className="text-xs text-neutral-700 mt-1">Win a hackathon, land a client, receive a grant — log it here.</p>
                </div>
              ) : (
                revenue.map(entry => {
                  const cfg = INCOME_TYPES[entry.type];
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg group">
                      <span className="text-base">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-200 truncate">{entry.description}</p>
                        <div className="flex gap-2 text-xs text-neutral-600 font-mono mt-0.5">
                          <span>{cfg.label}</span>
                          <span>·</span>
                          <span>{entry.date}</span>
                          {entry.notes && <><span>·</span><span>{entry.notes}</span></>}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{formatMoney(entry.amount)}</span>
                      <button onClick={() => { deleteRevenue(entry.id); refresh(); }}
                        className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {tab === "pipeline" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Pipeline stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Active Deals", value: pipelineStats.activeDeals, color: "text-amber-400" },
                { label: "Pipeline Value", value: formatMoney(pipelineStats.pipelineValue), color: "text-blue-400" },
                { label: "Won Total", value: formatMoney(pipelineStats.wonValue), color: "text-emerald-400" },
                { label: "Win Rate", value: `${pipelineStats.conversionRate}%`, color: "text-purple-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowAddClient(!showAddClient)}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
              <Plus className="w-4 h-4" />
              Add Deal
            </button>
            {showAddClient && <AddClientForm onAdd={() => { refresh(); setShowAddClient(false); }} />}

            {/* Kanban-style by status */}
            {["lead", "contacted", "proposal", "negotiating", "won"].map(status => {
              const statusClients = clients.filter(c => c.status === status);
              if (statusClients.length === 0) return null;
              return (
                <div key={status}>
                  <div className={`text-xs font-mono uppercase tracking-widest mb-2 ${DEAL_STATUS[status as DealStatus].color.split(" ")[0]}`}>
                    {DEAL_STATUS[status as DealStatus].label} ({statusClients.length})
                  </div>
                  <div className="space-y-2">
                    {statusClients.map(c => (
                      <ClientCard key={c.id} client={c} onUpdate={refresh} />
                    ))}
                  </div>
                </div>
              );
            })}

            {clients.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
                <p className="text-sm text-neutral-600">No deals yet.</p>
                <p className="text-xs text-neutral-700 mt-1">Add a lead — every client starts as a conversation.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
// ═══════════════════════════════════════════════════════════════
// PORTFOLIO — Wins Logger
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { Plus, Trash2, Star, Trophy, DollarSign, Users, Package, Link, Edit3, Check, X, Download, Bell, BellOff, Play, Pause, BookOpen, ChevronDown, ChevronUp, Copy, RefreshCw } from "lucide-react";
import { getWins, addWin, updateWin, deleteWin, getWinStats, type Win, type WinType } from "@/lib/support";
import { getKBEntries, addKBEntry, updateKBEntry, deleteKBEntry, type KBEntry, type KBCategory } from "@/lib/support";
import { getSOPs, getSOP, logSOPUsed, type SOP } from "@/lib/support";
import { getNotifications, markAllRead, dismissNotification, getUnreadCount, generateSystemNotifications, clearAllNotifications, deduplicateNotifications, type Notification } from "@/lib/support";
import { getTemplates, addTemplate, deleteTemplate, useTemplate, fillTemplate, type EmailTemplate, type TemplateCategory } from "@/lib/support";
import { getScheduledJobs, toggleJob, initScheduler, type ScheduledJob } from "@/lib/support";
import { exportAllData, downloadJSON, exportCSV } from "@/lib/support";

const WIN_TYPES: Record<WinType, { label: string; emoji: string; color: string }> = {
  hackathon:   { label: "Hackathon",   emoji: "🏆", color: "text-amber-400" },
  grant:       { label: "Grant",       emoji: "💰", color: "text-emerald-400" },
  client:      { label: "Client",      emoji: "🤝", color: "text-blue-400" },
  product:     { label: "Product",     emoji: "📦", color: "text-purple-400" },
  media:       { label: "Media",       emoji: "📰", color: "text-pink-400" },
  partnership: { label: "Partnership", emoji: "🔗", color: "text-cyan-400" },
  award:       { label: "Award",       emoji: "⭐", color: "text-yellow-400" },
  milestone:   { label: "Milestone",   emoji: "🎯", color: "text-red-400" },
};

export function PortfolioWins() {
  const [wins, setWins] = useState<Win[]>([]);
  const [stats, setStats] = useState(getWinStats());
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "hackathon" as WinType, title: "", description: "", value: "", date: new Date().toISOString().split("T")[0], proof: "", tags: "", featured: false, whatWorked: "", lessonsLearned: "" });

  useEffect(() => { refresh(); }, []);
  function refresh() { setWins(getWins()); setStats(getWinStats()); }

  function handleAdd() {
    if (!form.title.trim()) return;
    addWin({ ...form, value: form.value ? Number(form.value) : undefined, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) });
    setForm({ type: "hackathon", title: "", description: "", value: "", date: new Date().toISOString().split("T")[0], proof: "", tags: "", featured: false, whatWorked: "", lessonsLearned: "" });
    setShowAdd(false); refresh();
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Portfolio</div>
          <h2 className="text-xl font-bold text-neutral-100">Your Wins. Your Proof.</h2>
          <p className="text-sm text-neutral-500 mt-1">Every win logged here feeds your Investor View and builds your track record.</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Wins",    value: stats.total,                      color: "text-neutral-300" },
            { label: "Value Won",     value: `$${stats.totalValue.toLocaleString()}`, color: "text-emerald-400" },
            { label: "Hackathons",    value: stats.hackathons,                 color: "text-amber-400" },
            { label: "Grants",        value: stats.grants,                     color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
            <Plus className="w-4 h-4" /> Log a Win
          </button>
        </div>

        {showAdd && (
          <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-5 space-y-4">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">New Win</div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(WIN_TYPES) as [WinType, typeof WIN_TYPES[WinType]][]).map(([type, cfg]) => (
                <button key={type} onClick={() => setForm(f => ({ ...f, type }))} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.type === type ? `${cfg.color} border-current bg-current/10` : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Win title *" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What happened? What was the impact?" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
            <div className="grid grid-cols-3 gap-3">
              <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} type="number" placeholder="Value ($)" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
              <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors" />
              <input value={form.proof} onChange={e => setForm(f => ({ ...f, proof: e.target.value }))} placeholder="Proof URL (optional)" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
            </div>
            <textarea value={form.whatWorked} onChange={e => setForm(f => ({ ...f, whatWorked: e.target.value }))} rows={2} placeholder="What worked? (feeds your Knowledge Base)" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
            <div className="flex gap-3">
              <button onClick={handleAdd} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-5 py-2.5 rounded-lg transition-colors">Log Win</button>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 text-sm px-4 py-2.5 hover:text-neutral-300 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {wins.length === 0 ? (
            <div className="text-center py-16"><Trophy className="w-10 h-10 text-neutral-800 mx-auto mb-3" /><p className="text-sm text-neutral-600">No wins logged yet. Every hackathon entry, grant applied, client closed — log it all.</p></div>
          ) : wins.map(win => {
            const cfg = WIN_TYPES[win.type];
            const isExpanded = expanded === win.id;
            return (
              <div key={win.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-5">
                  <span className="text-2xl flex-shrink-0">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-neutral-200">{win.title}</span>
                      {win.featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1">{win.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs font-mono">
                      <span className={cfg.color}>{cfg.label}</span>
                      <span className="text-neutral-600">{win.date}</span>
                      {win.value && <span className="text-emerald-400">${win.value.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {win.proof && <a href={win.proof} target="_blank" rel="noopener noreferrer" className="text-neutral-700 hover:text-amber-400 p-1 transition-colors"><Link className="w-3.5 h-3.5" /></a>}
                    <button onClick={() => { updateWin(win.id, { featured: !win.featured }); refresh(); }} className="text-neutral-700 hover:text-amber-400 p-1 transition-colors"><Star className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setExpanded(isExpanded ? null : win.id)} className="text-neutral-600 hover:text-neutral-300 p-1 transition-colors">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                    <button onClick={() => { deleteWin(win.id); refresh(); }} className="text-neutral-700 hover:text-red-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {isExpanded && win.whatWorked && (
                  <div className="border-t border-neutral-800 p-5">
                    <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-2">What Worked</p>
                    <p className="text-sm text-neutral-300 leading-relaxed">{win.whatWorked}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════

const KB_CATS: Record<KBCategory, { label: string; emoji: string }> = {
  hackathon:  { label: "Hackathon",   emoji: "🏆" },
  grant:      { label: "Grant",       emoji: "💰" },
  sales:      { label: "Sales",       emoji: "🤝" },
  product:    { label: "Product",     emoji: "📦" },
  operations: { label: "Operations",  emoji: "⚙️" },
  finance:    { label: "Finance",     emoji: "💵" },
  marketing:  { label: "Marketing",  emoji: "📣" },
  general:    { label: "General",     emoji: "📝" },
};

export function KnowledgeBase() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<KBCategory | "all">("all");
  const [form, setForm] = useState({ title: "", content: "", category: "general" as KBCategory, tags: "", source: "", pinned: false });
  const [editContent, setEditContent] = useState("");

  useEffect(() => { setEntries(getKBEntries()); }, []);
  function refresh() { setEntries(getKBEntries()); }

  function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) return;
    addKBEntry({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) });
    setForm({ title: "", content: "", category: "general", tags: "", source: "", pinned: false });
    setShowAdd(false); refresh();
  }

  const filtered = entries
    .filter(e => filterCat === "all" || e.category === filterCat)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Knowledge Base</div>
          <h2 className="text-xl font-bold text-neutral-100">What You've Learned. What Works.</h2>
          <p className="text-sm text-neutral-500 mt-1">Capture every insight. The system gets smarter as you use it.</p>
        </div>

        <div className="flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge base..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-medium bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("all")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterCat === "all" ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>All</button>
          {(Object.entries(KB_CATS) as [KBCategory, typeof KB_CATS[KBCategory]][]).map(([cat, cfg]) => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterCat === cat ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>

        {showAdd && (
          <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-5 space-y-4">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">New Entry</div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="What you know, what works, key insight... *" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
            <div className="grid grid-cols-3 gap-3">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as KBCategory }))} className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors">
                {(Object.entries(KB_CATS) as [KBCategory, typeof KB_CATS[KBCategory]][]).map(([cat, cfg]) => <option key={cat} value={cat}>{cfg.emoji} {cfg.label}</option>)}
              </select>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma separated)" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
              <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Source (optional)" className="bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-5 py-2.5 rounded-lg transition-colors">Save Entry</button>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 text-sm px-4 py-2.5 hover:text-neutral-300 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16"><BookOpen className="w-10 h-10 text-neutral-800 mx-auto mb-3" /><p className="text-sm text-neutral-600">No entries match. Add what you know — every insight compounds.</p></div>
          ) : filtered.map(entry => {
            const cat = KB_CATS[entry.category];
            const isEditing = editing === entry.id;
            return (
              <div key={entry.id} className={`bg-neutral-900 border rounded-xl p-5 ${entry.pinned ? "border-amber-400/20" : "border-neutral-800"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-neutral-200">{entry.title}</span>
                      {entry.pinned && <span className="text-xs font-mono text-amber-400">📌 pinned</span>}
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => { updateKBEntry(entry.id, { content: editContent }); setEditing(null); refresh(); }} className="text-xs bg-amber-400 hover:bg-amber-300 text-black font-bold px-3 py-1.5 rounded-lg transition-colors">Save</button>
                          <button onClick={() => setEditing(null)} className="text-xs text-neutral-500 px-3 py-1.5 hover:text-neutral-300 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    )}
                    {entry.source && <p className="text-xs text-neutral-700 font-mono mt-2">Source: {entry.source}</p>}
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.tags.map(t => <span key={t} className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-500 px-2 py-0.5 rounded font-mono">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { updateKBEntry(entry.id, { pinned: !entry.pinned }); refresh(); }} className="text-neutral-700 hover:text-amber-400 p-1 transition-colors"><Star className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setEditing(entry.id); setEditContent(entry.content); }} className="text-neutral-700 hover:text-neutral-300 p-1 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { deleteKBEntry(entry.id); refresh(); }} className="text-neutral-700 hover:text-red-400 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOPs & PLAYBOOKS
// ═══════════════════════════════════════════════════════════════

export function SOPsPlaybooks() {
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [activeSOPId, setActiveSOPId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => { setSOPs(getSOPs()); }, []);

  const activeSOP = activeSOPId ? getSOPs().find(s => s.id === activeSOPId) : null;

  function handleActivate(sop: SOP) {
    setActiveSOPId(sop.id);
    setCompletedSteps({});
    logSOPUsed(sop.id);
  }

  function toggleStep(stepId: string) {
    setCompletedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  }

  const SOP_CAT_EMOJI: Record<string, string> = { hackathon: "🏆", client: "🤝", grant: "💰", product: "📦", finance: "💵", marketing: "📣", hiring: "👥", operations: "⚙️" };

  if (activeSOP) {
    const totalChecks = activeSOP.steps.flatMap(s => s.checklist).length;
    const completedChecks = activeSOP.steps.flatMap(s => s.checklist).filter((_, i) => completedSteps[`check_${i}`]).length;
    const progress = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
    let checkIdx = 0;

    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveSOPId(null)} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">← Back</button>
            <div className="flex-1">
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-0.5">Running Playbook</div>
              <h2 className="text-xl font-bold text-neutral-100">{activeSOP.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-400">{progress}%</div>
              <div className="text-xs text-neutral-600 font-mono">complete</div>
            </div>
          </div>

          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="space-y-4">
            {activeSOP.steps.map((step, si) => {
              const allChecked = step.checklist.every((_, ci) => completedSteps[`check_${checkIdx + ci}`]);
              const startIdx = checkIdx;
              checkIdx += step.checklist.length;
              return (
                <div key={step.id} className={`bg-neutral-900 border rounded-xl p-5 ${allChecked ? "border-emerald-400/20" : "border-neutral-800"}`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${allChecked ? "bg-emerald-400/15 text-emerald-400" : "bg-neutral-800 text-neutral-500"}`}>{si + 1}</div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${allChecked ? "text-emerald-400" : "text-neutral-200"}`}>{step.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
                      {step.timeEstimate && <p className="text-xs font-mono text-neutral-700 mt-1">⏱ {step.timeEstimate}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {step.checklist.map((item, ci) => {
                      const key = `check_${startIdx + ci}`;
                      const checked = !!completedSteps[key];
                      return (
                        <button key={ci} onClick={() => toggleStep(key)} className="w-full flex items-center gap-3 text-left py-1">
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${checked ? "bg-emerald-400 border-emerald-400" : "border-neutral-600 hover:border-amber-400"}`}>
                            {checked && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className={`text-sm ${checked ? "line-through text-neutral-600" : "text-neutral-300"}`}>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                  {step.notes && <p className="text-xs text-amber-400/70 mt-3 italic">{step.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">SOPs & Playbooks</div>
          <h2 className="text-xl font-bold text-neutral-100">How We Do Things Here.</h2>
          <p className="text-sm text-neutral-500 mt-1">Step-by-step playbooks for every repeatable process. Click Run to follow along.</p>
        </div>
        <div className="space-y-4">
          {sops.length === 0 ? (
            <div className="text-center py-16"><BookOpen className="w-10 h-10 text-neutral-800 mx-auto mb-3" /><p className="text-sm text-neutral-600">No playbooks yet.</p></div>
          ) : sops.map(sop => (
            <div key={sop.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">{SOP_CAT_EMOJI[sop.category] || "📋"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-200">{sop.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{sop.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-neutral-600">
                  <span>⏱ {sop.estimatedTime}</span>
                  <span>{sop.steps.length} steps</span>
                  {sop.timesUsed > 0 && <span>Used {sop.timesUsed}x</span>}
                </div>
                <p className="text-xs text-neutral-700 mt-1">When to use: {sop.trigger}</p>
              </div>
              <button onClick={() => handleActivate(sop)} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors flex-shrink-0">
                <Play className="w-3 h-3" /> Run
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CENTER
// ═══════════════════════════════════════════════════════════════

const NOTIF_ICONS: Record<string, React.ElementType> = { deadline: Bell, opportunity: Star, approval: Check, win: Trophy, alert: Bell, reminder: Bell, system: Bell };
const NOTIF_COLORS: Record<string, string> = { urgent: "border-red-400/30 bg-red-400/5", high: "border-amber-400/30 bg-amber-400/5", medium: "border-neutral-700 bg-neutral-900", low: "border-neutral-800 bg-neutral-900" };

export function NotificationCenter() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    deduplicateNotifications();
    generateSystemNotifications();
    refresh();
  }, []);

  function refresh() {
    setNotifs(getNotifications(showAll));
    setUnread(getUnreadCount());
  }

  useEffect(() => { refresh(); }, [showAll]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Notifications</div>
            <h2 className="text-xl font-bold text-neutral-100">What Needs Your Attention</h2>
            <p className="text-sm text-neutral-500 mt-1">Deadlines, opportunities, approvals — all in one place.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { generateSystemNotifications(); refresh(); }} className="text-neutral-600 hover:text-neutral-300 p-2 transition-colors" title="Refresh notifications"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => { markAllRead(); refresh(); }} className="text-xs text-neutral-500 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg transition-colors">Mark all read</button>
            <button onClick={() => { if (confirm("Clear all notifications?")) { clearAllNotifications(); refresh(); } }} className="text-xs text-red-500 hover:text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-lg transition-colors">Clear all</button>
          </div>
        </div>

        {unread > 0 && (
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-400 font-medium">{unread} unread notification{unread !== 1 ? "s" : ""}</p>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="rounded" />
          Show read notifications
        </label>

        <div className="space-y-3">
          {notifs.length === 0 ? (
            <div className="text-center py-16"><Bell className="w-10 h-10 text-neutral-800 mx-auto mb-3" /><p className="text-sm text-neutral-600">You're all caught up. The system will alert you when something needs attention.</p></div>
          ) : notifs.map(notif => {
            const Icon = NOTIF_ICONS[notif.type] || Bell;
            return (
              <div key={notif.id} className={`border rounded-xl p-4 flex items-start gap-3 ${NOTIF_COLORS[notif.priority]} ${notif.read ? "opacity-60" : ""}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${notif.priority === "urgent" ? "text-red-400" : notif.priority === "high" ? "text-amber-400" : "text-neutral-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-200">{notif.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-mono text-neutral-700">{new Date(notif.createdAt).toLocaleString()}</span>
                    <span className={`text-xs font-mono uppercase ${notif.priority === "urgent" ? "text-red-400" : notif.priority === "high" ? "text-amber-400" : "text-neutral-600"}`}>{notif.priority}</span>
                  </div>
                </div>
                <button onClick={() => { dismissNotification(notif.id); refresh(); }} className="text-neutral-700 hover:text-neutral-400 p-1 flex-shrink-0 transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULER
// ═══════════════════════════════════════════════════════════════

export function SchedulerPanel() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);

  useEffect(() => { initScheduler(); setJobs(getScheduledJobs()); }, []);
  function refresh() { setJobs(getScheduledJobs()); }

  const SCHEDULE_LABELS: Record<string, string> = { daily_6am: "Daily at 6:00 AM", daily_7am: "Daily at 7:00 AM", weekly_monday: "Every Monday at 7:00 AM", weekly_sunday: "Every Sunday at 6:00 PM" };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Scheduler</div>
          <h2 className="text-xl font-bold text-neutral-100">What Runs. When It Runs.</h2>
          <p className="text-sm text-neutral-500 mt-1">Every scheduled job that runs automatically. Toggle on/off. See when each one fired last.</p>
        </div>

        <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-400 mb-1">How scheduling works</p>
          <p className="text-xs text-neutral-500">Scheduled jobs run only when the app is open. Keep this tab or the OS open for skills to run at their scheduled time. Background cron (e.g. with Vercel Cron) is not set up yet.</p>
        </div>

        <div className="space-y-3">
          {jobs.map(job => {
            const nextRunDate = new Date(job.nextRun);
            const isOverdue = nextRunDate < new Date();
            return (
              <div key={job.id} className={`bg-neutral-900 border rounded-xl p-5 flex items-center gap-4 ${!job.enabled ? "opacity-50" : "border-neutral-700"}`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${job.enabled ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-200">{job.skillName}</p>
                  <p className="text-xs font-mono text-neutral-500 mt-0.5">{SCHEDULE_LABELS[job.schedule] || job.schedule}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                    {job.lastRun && <span className="text-neutral-600">Last: {new Date(job.lastRun).toLocaleString()}</span>}
                    <span className={isOverdue && job.enabled ? "text-amber-400" : "text-neutral-600"}>
                      Next: {nextRunDate.toLocaleString()}
                    </span>
                    {job.runCount > 0 && <span className="text-neutral-700">{job.runCount} runs</span>}
                  </div>
                </div>
                <button onClick={() => { toggleJob(job.id); refresh(); }} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${job.enabled ? "border-neutral-700 text-neutral-500 hover:border-red-400/30 hover:text-red-400" : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"}`}>
                  {job.enabled ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Enable</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

const TEMPLATE_CATS: Record<TemplateCategory, string> = { proposal: "📄 Proposal", follow_up: "🔄 Follow-Up", invoice: "🧾 Invoice", grant: "💰 Grant", outreach: "📣 Outreach", onboarding: "🚀 Onboarding", partnership: "🤝 Partnership", general: "📝 General" };

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [filled, setFilled] = useState<{ subject: string; body: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState<TemplateCategory | "all">("all");
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);
  const [form, setForm] = useState({ name: "", category: "general" as TemplateCategory, subject: "", body: "" });

  useEffect(() => { setTemplates(getTemplates()); }, []);
  function refresh() { setTemplates(getTemplates()); }

  function handleSelect(tpl: EmailTemplate) {
    const t = useTemplate(tpl.id)!;
    setSelected(t);
    setVariables(Object.fromEntries(t.variables.map(v => [v, ""])));
    setFilled(null);
    refresh();
  }

  function handleFill() {
    if (!selected) return;
    setFilled(fillTemplate(selected, variables));
  }

  function handleCopy(field: "subject" | "body") {
    const text = filled?.[field] || "";
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = templates.filter(t => filterCat === "all" || t.category === filterCat);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Email Templates</div>
          <h2 className="text-xl font-bold text-neutral-100">Ready-to-Send. Every Situation.</h2>
          <p className="text-sm text-neutral-500 mt-1">Fill in the variables, copy, send. Never write from scratch again.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("all")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterCat === "all" ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>All</button>
          {(Object.entries(TEMPLATE_CATS) as [TemplateCategory, string][]).map(([cat, label]) => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filterCat === cat ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>{label}</button>
          ))}
        </div>

        {selected ? (
          <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-amber-400">{selected.name}</p>
              <button onClick={() => { setSelected(null); setFilled(null); }} className="text-neutral-600 hover:text-neutral-300 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            {selected.variables.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {selected.variables.map(v => (
                  <div key={v}>
                    <label className="text-xs text-neutral-500 block mb-1 font-mono">{`{{${v}}}`}</label>
                    <input value={variables[v] || ""} onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))} placeholder={v.replace(/_/g, " ")} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleFill} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-5 py-2.5 rounded-lg transition-colors">Fill Template</button>
            {filled && (
              <div className="space-y-3">
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-neutral-500 uppercase">Subject</span>
                    <button onClick={() => handleCopy("subject")} className="text-xs text-neutral-600 hover:text-amber-400 flex items-center gap-1 transition-colors"><Copy className="w-3 h-3" />{copied === "subject" ? "Copied!" : "Copy"}</button>
                  </div>
                  <p className="text-sm text-neutral-200">{filled.subject}</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-neutral-500 uppercase">Body</span>
                    <button onClick={() => handleCopy("body")} className="text-xs text-neutral-600 hover:text-amber-400 flex items-center gap-1 transition-colors"><Copy className="w-3 h-3" />{copied === "body" ? "Copied!" : "Copy"}</button>
                  </div>
                  <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">{filled.body}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(tpl => (
              <button key={tpl.id} onClick={() => handleSelect(tpl)} className="bg-neutral-900 border border-neutral-800 hover:border-amber-400/30 rounded-xl p-4 text-left transition-all group">
                <p className="text-sm font-bold text-neutral-200 group-hover:text-amber-400 transition-colors">{tpl.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{TEMPLATE_CATS[tpl.category]}</p>
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-neutral-700">
                  <span>{tpl.variables.length} variables</span>
                  {tpl.timesUsed > 0 && <span>Used {tpl.timesUsed}x</span>}
                  {tpl.isBuiltIn && <span>built-in</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DATA EXPORT
// ═══════════════════════════════════════════════════════════════

export function DataExport() {
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  function handleExportJSON() {
    setExporting(true);
    const bundle = exportAllData();
    downloadJSON(bundle);
    setLastExport(new Date().toLocaleString());
    setExporting(false);
  }

  function handleExportCSV(type: string) {
    const data = JSON.parse(localStorage.getItem(`cbt_os_${type}`) || "[]");
    if (Array.isArray(data) && data.length > 0) {
      exportCSV(data, `cbt-${type}-${new Date().toISOString().split("T")[0]}.csv`);
    }
  }

  const EXPORTS = [
    { key: "revenue", label: "Revenue Entries", emoji: "💰" },
    { key: "clients", label: "Client Pipeline", emoji: "🤝" },
    { key: "grants", label: "Grant Tracker", emoji: "🎯" },
    { key: "ideas", label: "Idea Library", emoji: "💡" },
    { key: "goals", label: "Goals & OKRs", emoji: "🏹" },
    { key: "wins", label: "Portfolio Wins", emoji: "🏆" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Data Export</div>
          <h2 className="text-xl font-bold text-neutral-100">Your Data. Always Yours.</h2>
          <p className="text-sm text-neutral-500 mt-1">Export everything as a backup, share with investors, or migrate to another system.</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <p className="text-sm font-bold text-neutral-200 mb-1">Full System Backup</p>
          <p className="text-xs text-neutral-500 mb-4">Exports every module — Founder Brain, clients, revenue, grants, ideas, goals, wins, knowledge base, SOPs, templates, and all skill runs. Single JSON file. Can be imported back.</p>
          {lastExport && <p className="text-xs text-neutral-700 font-mono mb-3">Last export: {lastExport}</p>}
          <button onClick={handleExportJSON} disabled={exporting} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-6 py-3 rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            Export Full Backup (JSON)
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <p className="text-sm font-bold text-neutral-200 mb-4">Export by Module (CSV)</p>
          <div className="grid grid-cols-2 gap-3">
            {EXPORTS.map(({ key, label, emoji }) => (
              <button key={key} onClick={() => handleExportCSV(key)} className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded-lg p-4 text-left transition-all group">
                <span className="text-xl">{emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-neutral-300 group-hover:text-neutral-100 transition-colors">{label}</p>
                  <p className="text-xs text-neutral-600 font-mono">CSV format</p>
                </div>
                <Download className="w-3.5 h-3.5 text-neutral-700 group-hover:text-amber-400 ml-auto transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Import Backup</p>
          <p className="text-xs text-neutral-500 mb-3">Restore from a previous CBT OS backup JSON file. This will overwrite current data.</p>
          <label className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-sm font-medium px-4 py-2.5 rounded-lg cursor-pointer transition-colors w-fit">
            <Download className="w-4 h-4 rotate-180" />
            Import Backup File
            <input type="file" accept=".json" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => {
                try {
                  const bundle = JSON.parse(ev.target?.result as string);
                  if (bundle.data) { Object.entries(bundle.data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); alert("Import successful! Refresh the page."); }
                } catch { alert("Invalid backup file."); }
              };
              reader.readAsText(file);
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}

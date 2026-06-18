"use client";

import { useState, useEffect } from "react";
import {
  User, Building2, Package, Trophy, Target, TrendingUp,
  Plus, Edit3, Save, ChevronRight, Check,
  Globe, Users, DollarSign, Shield,
  Star, X
} from "lucide-react";
import {
  getBrain, saveBrain, getDefaultBrain, getTotalMetrics,
  type FounderBrain, type Founder, type SaaSProduct,
  type Competitor, type CompanyMilestone
} from "@/lib/founder-brain";

// ── HELPERS ───────────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<FounderBrain["stage"], { label: string; color: string }> = {
  "pre-idea":       { label: "Pre-Idea",       color: "text-neutral-500" },
  "idea":           { label: "Idea Stage",      color: "text-neutral-400" },
  "mvp":            { label: "MVP",             color: "text-amber-400" },
  "early-traction": { label: "Early Traction",  color: "text-blue-400" },
  "growth":         { label: "Growth",          color: "text-emerald-400" },
  "scale":          { label: "Scaling",         color: "text-purple-400" },
};

const PRODUCT_STATUS: Record<SaaSProduct["status"], { label: string; color: string }> = {
  idea:     { label: "Idea",     color: "text-neutral-500 border-neutral-700" },
  building: { label: "Building", color: "text-amber-400 border-amber-400/30" },
  beta:     { label: "Beta",     color: "text-blue-400 border-blue-400/30" },
  live:     { label: "Live",     color: "text-emerald-400 border-emerald-400/30" },
  scaling:  { label: "Scaling",  color: "text-purple-400 border-purple-400/30" },
  paused:   { label: "Paused",   color: "text-neutral-600 border-neutral-800" },
};

const THREAT_COLOR: Record<Competitor["threatLevel"], string> = {
  low:      "text-neutral-500 bg-neutral-800 border-neutral-700",
  medium:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  high:     "text-red-400 bg-red-400/10 border-red-400/20",
  critical: "text-red-500 bg-red-500/15 border-red-500/30",
};

const MILESTONE_ICONS: Record<CompanyMilestone["type"], React.ElementType> = {
  founding:    Building2,
  product:     Package,
  revenue:     DollarSign,
  team:        Users,
  partnership: Globe,
  funding:     TrendingUp,
  award:       Trophy,
};

function Input({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
      />
    </div>
  );
}

function TagInput({ label, tags, onChange, placeholder }: {
  label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const val = input.trim();
    if (val && !tags.includes(val)) { onChange([...tags, val]); }
    setInput("");
  }
  return (
    <div>
      <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1.5 text-xs bg-neutral-800 border border-neutral-700 text-neutral-300 px-2.5 py-1 rounded-full">
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} className="text-neutral-600 hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "Type and press Enter"}
          className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
        />
        <button onClick={add} className="px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors">Add</button>
      </div>
    </div>
  );
}

// ── SETUP WIZARD ──────────────────────────────────────────────────────────────

function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [brain, setBrain] = useState<FounderBrain>(getDefaultBrain());

  const STEPS = [
    "Company Identity",
    "Your Profile",
    "Co-founder",
    "Products",
    "Competitors",
    "Milestones",
  ];

  function updateBrain(updates: Partial<FounderBrain>) {
    setBrain(prev => ({ ...prev, ...updates }));
  }

  function updateFounder(index: number, updates: Partial<Founder>) {
    const founders = [...brain.founders];
    founders[index] = { ...founders[index], ...updates };
    updateBrain({ founders });
  }

  function addFounder() {
    const newFounder: Founder = {
      id: `founder_${Date.now()}`,
      name: "", role: "", location: "", timezone: "", bio: "",
      skills: [], strengths: [], workStyle: "", email: "",
    };
    updateBrain({ founders: [...brain.founders, newFounder] });
  }

  function handleNext() {
    if (step === STEPS.length - 1) {
      const updatedBrain = { ...brain, setupComplete: true };
      saveBrain(updatedBrain);
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  }

  function handleSkip() {
    if (step === STEPS.length - 1) {
      const updatedBrain = { ...brain, setupComplete: true };
      saveBrain(updatedBrain);
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-xl mx-auto">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase">
              Setting Up Your Founder Brain
            </div>
            <span className="text-xs font-mono text-neutral-600">{step + 1}/{STEPS.length}</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-amber-400" : "bg-neutral-800"}`} />
            ))}
          </div>
          <div className="text-sm font-bold text-neutral-200 mt-3">{STEPS[step]}</div>
        </div>

        {/* Step content */}
        <div className="space-y-5">

          {step === 0 && (
            <>
              <Input label="Company Name" value={brain.companyName} onChange={v => updateBrain({ companyName: v })} placeholder="Acme Inc" />
              <Input label="Tagline" value={brain.companyTagline} onChange={v => updateBrain({ companyTagline: v })} placeholder="What you do in one line" />
              <Textarea label="Mission" value={brain.companyMission} onChange={v => updateBrain({ companyMission: v })} placeholder="Why does your company exist?" rows={2} />
              <Textarea label="Vision" value={brain.companyVision} onChange={v => updateBrain({ companyVision: v })} placeholder="The big dream. Where are you going in 10 years?" rows={3} />
              <Input label="Founded Date" value={brain.foundedDate} onChange={v => updateBrain({ foundedDate: v })} type="date" />
              <Input label="Headquarters" value={brain.location} onChange={v => updateBrain({ location: v })} placeholder="City, Country" />
              <div>
                <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">Company Stage</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(STAGE_CONFIG) as [FounderBrain["stage"], { label: string; color: string }][]).map(([s, { label, color }]) => (
                    <button key={s} onClick={() => updateBrain({ stage: s })}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all ${brain.stage === s ? `${color} bg-neutral-800 border-neutral-600` : "border-neutral-800 text-neutral-600 hover:text-neutral-400"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <TagInput label="Core Values" tags={brain.coreValues} onChange={v => updateBrain({ coreValues: v })} placeholder="e.g. Ship fast, Community first..." />
              <TagInput label="Target Markets" tags={brain.targetMarkets} onChange={v => updateBrain({ targetMarkets: v })} placeholder="e.g. SMBs, developers, US market..." />
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-neutral-500">Tell the brain about you — the founder.</p>
              {brain.founders.length === 0 && (
                <button onClick={addFounder} className="w-full border border-dashed border-neutral-700 rounded-lg py-4 text-sm text-amber-400 hover:border-amber-400/40 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your Profile
                </button>
              )}
              {brain.founders.slice(0, 1).map((f, i) => (
                <div key={f.id} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Full Name" value={f.name} onChange={v => updateFounder(i, { name: v })} placeholder="Your name" />
                    <Input label="Role" value={f.role} onChange={v => updateFounder(i, { role: v })} placeholder="CEO & Founder" />
                  </div>
                  <Input label="Email" value={f.email} onChange={v => updateFounder(i, { email: v })} placeholder="you@company.com" type="email" />
                  <Input label="Location" value={f.location} onChange={v => updateFounder(i, { location: v })} placeholder="City, Country" />
                  <Textarea label="Bio" value={f.bio} onChange={v => updateFounder(i, { bio: v })} placeholder="Who are you? What's your background?" rows={3} />
                  <TagInput label="Skills" tags={f.skills} onChange={v => updateFounder(i, { skills: v })} placeholder="e.g. React, Next.js, Python..." />
                  <TagInput label="Strengths" tags={f.strengths} onChange={v => updateFounder(i, { strengths: v })} placeholder="e.g. Product vision, Community building..." />
                  <Input label="Work Style" value={f.workStyle} onChange={v => updateFounder(i, { workStyle: v })} placeholder="e.g. Deep work mornings, ship fast iterate" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="GitHub" value={f.github || ""} onChange={v => updateFounder(i, { github: v })} placeholder="github.com/username" />
                    <Input label="LinkedIn" value={f.linkedin || ""} onChange={v => updateFounder(i, { linkedin: v })} placeholder="linkedin.com/in/..." />
                  </div>
                </div>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-neutral-500">Add your co-founder if you have one. Skip if solo.</p>
              {brain.founders.length < 2 && (
                <button onClick={addFounder} className="w-full border border-dashed border-neutral-700 rounded-lg py-4 text-sm text-amber-400 hover:border-amber-400/40 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Co-founder
                </button>
              )}
              {brain.founders.slice(1, 2).map((f, i) => (
                <div key={f.id} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Full Name" value={f.name} onChange={v => updateFounder(i + 1, { name: v })} placeholder="Co-founder name" />
                    <Input label="Role" value={f.role} onChange={v => updateFounder(i + 1, { role: v })} placeholder="CTO & Co-founder" />
                  </div>
                  <Input label="Email" value={f.email} onChange={v => updateFounder(i + 1, { email: v })} placeholder="cofounder@company.com" type="email" />
                  <Textarea label="Bio" value={f.bio} onChange={v => updateFounder(i + 1, { bio: v })} placeholder="Their background and what they bring" rows={3} />
                  <TagInput label="Skills" tags={f.skills} onChange={v => updateFounder(i + 1, { skills: v })} placeholder="Their technical/business skills" />
                  <Input label="Work Style" value={f.workStyle} onChange={v => updateFounder(i + 1, { workStyle: v })} placeholder="How they work best" />
                </div>
              ))}
            </>
          )}

          {step === 3 && (
            <ProductsSetup brain={brain} onUpdate={updateBrain} />
          )}

          {step === 4 && (
            <CompetitorsSetup brain={brain} onUpdate={updateBrain} />
          )}

          {step === 5 && (
            <MilestonesSetup brain={brain} onUpdate={updateBrain} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-800">
          <button
            onClick={() => step > 0 && setStep(s => s - 1)}
            disabled={step === 0}
            className="text-sm text-neutral-600 hover:text-neutral-400 disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>
          <div className="flex gap-3">
            <button onClick={handleSkip} className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors px-4 py-2">
              {step === STEPS.length - 1 ? "Finish" : "Skip"}
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              {step === STEPS.length - 1 ? (
                <><Check className="w-4 h-4" /> Activate Brain</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PRODUCTS SETUP ────────────────────────────────────────────────────────────

function ProductsSetup({ brain, onUpdate }: { brain: FounderBrain; onUpdate: (u: Partial<FounderBrain>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<SaaSProduct>>({
    name: "", description: "", status: "building", totalUsers: 0,
    activeUsers: 0, mrr: 0, mrrGrowth: 0, churnRate: 0,
    techStack: [], targetMarket: "", pricingModel: "Freemium", pricingTiers: [],
  });

  function handleAdd() {
    if (!form.name?.trim()) return;
    const product: SaaSProduct = {
      id: `prod_${Date.now()}`,
      name: form.name!, description: form.description || "",
      status: form.status as SaaSProduct["status"] || "building",
      totalUsers: form.totalUsers || 0, activeUsers: form.activeUsers || 0,
      mrr: form.mrr || 0, mrrGrowth: form.mrrGrowth || 0,
      churnRate: form.churnRate || 0, techStack: form.techStack || [],
      targetMarket: form.targetMarket || "", pricingModel: form.pricingModel || "Freemium",
      pricingTiers: form.pricingTiers || [], updatedAt: new Date().toISOString(),
    };
    onUpdate({ products: [...brain.products, product] });
    setShowForm(false);
    setForm({ name: "", description: "", status: "building", totalUsers: 0, activeUsers: 0, mrr: 0, mrrGrowth: 0, churnRate: 0, techStack: [], targetMarket: "", pricingModel: "Freemium", pricingTiers: [] });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">Add your SaaS products. The brain will track metrics and watch competitors for each.</p>
      {brain.products.map(p => (
        <div key={p.id} className="flex items-center gap-3 p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
          <Package className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-200">{p.name}</p>
            <p className="text-xs text-neutral-500">{p.totalUsers} users · ${p.mrr} MRR</p>
          </div>
          <span className={`text-xs border px-2 py-0.5 rounded font-mono ${PRODUCT_STATUS[p.status].color}`}>
            {PRODUCT_STATUS[p.status].label}
          </span>
        </div>
      ))}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full border border-dashed border-neutral-700 rounded-lg py-4 text-sm text-amber-400 hover:border-amber-400/40 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Product Name" value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="NextHire AI" />
            <div>
              <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SaaSProduct["status"] }))}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors">
                {Object.entries(PRODUCT_STATUS).map(([s, { label }]) => <option key={s} value={s}>{label}</option>)}
              </select>
            </div>
          </div>
          <Textarea label="Description" value={form.description || ""} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="What does it do?" rows={2} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Total Users" value={String(form.totalUsers || 0)} onChange={v => setForm(f => ({ ...f, totalUsers: Number(v) }))} type="number" />
            <Input label="Active Users" value={String(form.activeUsers || 0)} onChange={v => setForm(f => ({ ...f, activeUsers: Number(v) }))} type="number" />
            <Input label="MRR (USD)" value={String(form.mrr || 0)} onChange={v => setForm(f => ({ ...f, mrr: Number(v) }))} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Target Market" value={form.targetMarket || ""} onChange={v => setForm(f => ({ ...f, targetMarket: v }))} placeholder="West African developers" />
            <Input label="Pricing Model" value={form.pricingModel || ""} onChange={v => setForm(f => ({ ...f, pricingModel: v }))} placeholder="Freemium" />
          </div>
          <TagInput label="Tech Stack" tags={form.techStack || []} onChange={v => setForm(f => ({ ...f, techStack: v }))} placeholder="Next.js, Supabase, Claude..." />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors">Add Product</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-neutral-600 hover:text-neutral-400 px-4 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── COMPETITORS SETUP ─────────────────────────────────────────────────────────

function CompetitorsSetup({ brain, onUpdate }: { brain: FounderBrain; onUpdate: (u: Partial<FounderBrain>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Competitor>>({ name: "", url: "", description: "", threatLevel: "medium", strengths: [], weaknesses: [], notes: "" });

  function handleAdd() {
    if (!form.name?.trim()) return;
    const comp: Competitor = {
      id: `comp_${Date.now()}`,
      name: form.name!, url: form.url || "", description: form.description || "",
      threatLevel: form.threatLevel as Competitor["threatLevel"] || "medium",
      strengths: form.strengths || [], weaknesses: form.weaknesses || [], notes: form.notes || "",
    };
    onUpdate({ competitors: [...brain.competitors, comp] });
    setShowForm(false);
    setForm({ name: "", url: "", description: "", threatLevel: "medium", strengths: [], weaknesses: [], notes: "" });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">Add competitors. The system will track their moves and suggest counter-strategies.</p>
      {brain.competitors.map(c => (
        <div key={c.id} className="flex items-center gap-3 p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
          <Shield className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-200">{c.name}</p>
            <p className="text-xs text-neutral-500">{c.url}</p>
          </div>
          <span className={`text-xs border px-2 py-0.5 rounded font-mono capitalize ${THREAT_COLOR[c.threatLevel]}`}>
            {c.threatLevel}
          </span>
        </div>
      ))}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full border border-dashed border-neutral-700 rounded-lg py-4 text-sm text-amber-400 hover:border-amber-400/40 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Competitor
        </button>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Competitor name" />
            <Input label="Website" value={form.url || ""} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
          </div>
          <Textarea label="Description" value={form.description || ""} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="What do they do and who do they target?" rows={2} />
          <div>
            <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">Threat Level</label>
            <div className="flex gap-2">
              {(["low", "medium", "high", "critical"] as const).map(level => (
                <button key={level} onClick={() => setForm(f => ({ ...f, threatLevel: level }))}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all capitalize ${form.threatLevel === level ? THREAT_COLOR[level] : "border-neutral-800 text-neutral-600"}`}>
                  {level}
                </button>
              ))}
            </div>
          </div>
          <TagInput label="Their Strengths" tags={form.strengths || []} onChange={v => setForm(f => ({ ...f, strengths: v }))} placeholder="What are they good at?" />
          <TagInput label="Their Weaknesses" tags={form.weaknesses || []} onChange={v => setForm(f => ({ ...f, weaknesses: v }))} placeholder="Where are they vulnerable?" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors">Add Competitor</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-neutral-600 hover:text-neutral-400 px-4 py-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MILESTONES SETUP ──────────────────────────────────────────────────────────

function MilestonesSetup({ brain, onUpdate }: { brain: FounderBrain; onUpdate: (u: Partial<FounderBrain>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<CompanyMilestone>>({ title: "", description: "", date: "", type: "product", achieved: false });

  function handleAdd() {
    if (!form.title?.trim()) return;
    const ms: CompanyMilestone = {
      id: `ms_${Date.now()}`, title: form.title!, description: form.description || "",
      date: form.date || new Date().toISOString().split("T")[0],
      type: form.type as CompanyMilestone["type"] || "product",
      achieved: form.achieved || false,
    };
    onUpdate({ milestones: [...brain.milestones, ms] });
    setShowForm(false);
    setForm({ title: "", description: "", date: "", type: "product", achieved: false });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">Log past wins and set future targets. This is your company timeline.</p>
      {brain.milestones.map(m => {
        const Icon = MILESTONE_ICONS[m.type];
        return (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
            <Icon className={`w-4 h-4 flex-shrink-0 ${m.achieved ? "text-emerald-400" : "text-amber-400"}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-200">{m.title}</p>
              <p className="text-xs text-neutral-500">{m.date}</p>
            </div>
            {m.achieved && <Check className="w-4 h-4 text-emerald-400" />}
          </div>
        );
      })}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full border border-dashed border-neutral-700 rounded-lg py-4 text-sm text-amber-400 hover:border-amber-400/40 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4">
          <Input label="Milestone" value={form.title || ""} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="First 100 users" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" value={form.date || ""} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
            <div>
              <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CompanyMilestone["type"] }))}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors">
                {["founding", "product", "revenue", "team", "partnership", "funding", "award"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <Textarea label="Description" value={form.description || ""} onChange={v => setForm(f => ({ ...f, description: v }))} rows={2} placeholder="What happened? Why does it matter?" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.achieved || false} onChange={e => setForm(f => ({ ...f, achieved: e.target.checked }))}
              className="w-4 h-4 accent-amber-400" />
            <span className="text-sm text-neutral-300">Already achieved</span>
          </label>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors">Add Milestone</button>
            <button onClick={() => setShowForm(false)} className="text-sm text-neutral-600 hover:text-neutral-400 px-4 py-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

function Dashboard({ brain, onEdit }: { brain: FounderBrain; onEdit: () => void }) {
  const metrics = getTotalMetrics();
  const founder = brain.founders[0];
  const cofounder = brain.founders[1];
  const stageConfig = STAGE_CONFIG[brain.stage];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Company hero */}
        <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-neutral-100">{brain.companyName}</h2>
                <span className={`text-xs font-mono px-2 py-1 rounded border bg-neutral-800 ${stageConfig.color}`}>
                  {stageConfig.label}
                </span>
              </div>
              {brain.companyTagline && <p className="text-sm text-neutral-400">{brain.companyTagline}</p>}
              <p className="text-xs text-neutral-600 font-mono mt-1">{brain.location}</p>
            </div>
            <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg transition-colors">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>
          {brain.companyMission && (
            <p className="text-sm text-neutral-400 leading-relaxed border-l-2 border-amber-400/30 pl-3 italic">
              "{brain.companyMission}"
            </p>
          )}
          {brain.coreValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {brain.coreValues.map(v => (
                <span key={v} className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-400 px-2.5 py-1 rounded-full">{v}</span>
              ))}
            </div>
          )}
        </div>

        {/* Total metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: metrics.totalUsers.toLocaleString(), icon: Users, color: "text-blue-400" },
            { label: "Total MRR", value: `$${metrics.totalMRR.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
            { label: "Products", value: metrics.totalProducts, icon: Package, color: "text-amber-400" },
            { label: "Competitors", value: brain.competitors.length, icon: Shield, color: "text-red-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <Icon className="w-4 h-4 text-neutral-700 mb-2" />
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Founders */}
        <div className="grid grid-cols-2 gap-4">
          {[founder, cofounder].filter(Boolean).map((f) => f && (
            <div key={f.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-400">
                    {f.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-200">{f.name}</p>
                  <p className="text-xs text-neutral-500">{f.role}</p>
                </div>
              </div>
              {f.bio && <p className="text-xs text-neutral-500 leading-relaxed mb-3 line-clamp-2">{f.bio}</p>}
              {f.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {f.skills.slice(0, 4).map((s: string) => (
                    <span key={s} className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Products */}
        {brain.products.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Products</div>
            {brain.products.map(p => (
              <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-neutral-200">{p.name}</h3>
                      <span className={`text-xs border px-2 py-0.5 rounded font-mono ${PRODUCT_STATUS[p.status].color}`}>
                        {PRODUCT_STATUS[p.status].label}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-neutral-500">{p.description}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total Users", value: p.totalUsers.toLocaleString() },
                    { label: "Active Users", value: p.activeUsers.toLocaleString() },
                    { label: "MRR", value: `$${p.mrr}` },
                    { label: "MRR Growth", value: `${p.mrrGrowth > 0 ? "+" : ""}${p.mrrGrowth}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-neutral-800 rounded-lg p-2.5">
                      <div className="text-sm font-bold text-neutral-200">{value}</div>
                      <div className="text-xs text-neutral-600 font-mono">{label}</div>
                    </div>
                  ))}
                </div>
                {p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.techStack.map(t => (
                      <span key={t} className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded font-mono">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Competitors */}
        {brain.competitors.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Competitors on Radar</div>
            {brain.competitors.map(c => (
              <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-200">{c.name}</span>
                      <span className={`text-xs border px-2 py-0.5 rounded font-mono capitalize ${THREAT_COLOR[c.threatLevel]}`}>
                        {c.threatLevel} threat
                      </span>
                    </div>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-600 hover:text-amber-400 font-mono transition-colors">{c.url}</a>}
                  </div>
                </div>
                {c.description && <p className="text-xs text-neutral-500 mb-3">{c.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  {c.strengths.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Their strengths</p>
                      {c.strengths.map(s => <p key={s} className="text-xs text-neutral-400">• {s}</p>)}
                    </div>
                  )}
                  {c.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Their weaknesses</p>
                      {c.weaknesses.map(w => <p key={w} className="text-xs text-emerald-400/70">✓ {w}</p>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {brain.milestones.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Company Timeline</div>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-800" />
              <div className="space-y-4">
                {brain.milestones.map(m => {
                  const Icon = MILESTONE_ICONS[m.type];
                  return (
                    <div key={m.id} className="flex items-start gap-4 pl-2">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 z-10 ${m.achieved ? "bg-emerald-400/20 border-emerald-400/40" : "bg-neutral-900 border-neutral-700"}`}>
                        <Icon className={`w-3 h-3 ${m.achieved ? "text-emerald-400" : "text-neutral-600"}`} />
                      </div>
                      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-neutral-200">{m.title}</span>
                          <span className="text-xs font-mono text-neutral-600">{m.date}</span>
                        </div>
                        {m.description && <p className="text-xs text-neutral-500">{m.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Vision */}
        {brain.companyVision && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">The Vision</span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed italic">"{brain.companyVision}"</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function FounderBrainModule() {
  const [brain, setBrain] = useState<FounderBrain | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const existing = getBrain();
    setBrain(existing);
  }, []);

  function handleComplete() {
    setBrain(getBrain());
    setEditing(false);
  }

  if (!brain || !brain.setupComplete || editing) {
    return <SetupWizard onComplete={handleComplete} />;
  }

  return <Dashboard brain={brain} onEdit={() => setEditing(true)} />;
}

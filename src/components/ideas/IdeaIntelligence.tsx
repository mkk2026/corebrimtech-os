"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUp, Lightbulb, Filter, Star, ChevronDown, ChevronUp, Edit3, Check } from "lucide-react";
import {
  getIdeas, addIdea, updateIdea, deleteIdea, getIdeaStats, getTopIdeas,
  calculateScore, type Idea, type IdeaStatus, type IdeaCategory
} from "@/lib/idea-intelligence";

const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string }> = {
  captured:   { label: "Captured",   color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  evaluating: { label: "Evaluating", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  building:   { label: "Building",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  parked:     { label: "Parked",     color: "text-neutral-500 bg-neutral-800 border-neutral-700" },
  dropped:    { label: "Dropped",    color: "text-red-400/60 bg-red-400/5 border-red-400/10" },
};

const CATEGORY_CONFIG: Record<IdeaCategory, { label: string; emoji: string }> = {
  product:  { label: "Product",  emoji: "📦" },
  feature:  { label: "Feature",  emoji: "⚡" },
  business: { label: "Business", emoji: "💼" },
  research: { label: "Research", emoji: "🔍" },
  personal: { label: "Personal", emoji: "👤" },
  other:    { label: "Other",    emoji: "💡" },
};

function ScoreBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-neutral-500 w-4">{value}</span>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 7 ? "text-emerald-400 border-emerald-400/40" :
    score >= 5 ? "text-amber-400 border-amber-400/40" : "text-neutral-500 border-neutral-700";
  return (
    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${color}`}>
      <span className="text-sm font-bold">{score}</span>
    </div>
  );
}

function AddIdeaForm({ onAdd }: { onAdd: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("other");
  const [effort, setEffort] = useState(5);
  const [impact, setImpact] = useState(5);
  const [alignment, setAlignment] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const previewScore = calculateScore(effort, impact, alignment);

  function handleAdd() {
    if (!title.trim()) return;
    addIdea(title.trim(), { description, category, effort, impact, alignment });
    setTitle(""); setDescription(""); setEffort(5); setImpact(5); setAlignment(5);
    onAdd();
  }

  return (
    <div className="bg-neutral-900 border border-amber-400/20 rounded-lg p-5 space-y-4">
      <div className="text-xs font-mono text-amber-400 tracking-widest uppercase">Capture Idea</div>

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && !showAdvanced && handleAdd()}
        placeholder="What's the idea?"
        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
        autoFocus
      />

      <div className="flex gap-2">
        {(Object.entries(CATEGORY_CONFIG) as [IdeaCategory, { label: string; emoji: string }][]).map(([cat, { label, emoji }]) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-all ${
              category === cat
                ? "border-amber-400/40 text-amber-400 bg-amber-400/10"
                : "border-neutral-800 text-neutral-600 hover:text-neutral-400"
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Score this idea
        {!showAdvanced && (
          <span className="ml-1 font-mono text-neutral-600">preview: {previewScore}/10</span>
        )}
      </button>

      {showAdvanced && (
        <div className="space-y-4 bg-neutral-950 rounded-lg p-4 border border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-3">
              {[
                { label: "Effort required", value: effort, set: setEffort, hint: "1 = easy, 10 = massive", invert: true },
                { label: "Impact potential", value: impact, set: setImpact, hint: "1 = minimal, 10 = game-changing", invert: false },
                { label: "Goal alignment", value: alignment, set: setAlignment, hint: "1 = off-track, 10 = perfect fit", invert: false },
              ].map(({ label, value, set, hint }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-neutral-500">{label}</span>
                    <span className="text-xs font-mono text-neutral-400">{value}/10</span>
                  </div>
                  <input
                    type="range" min={1} max={10} value={value}
                    onChange={e => set(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <span className="text-xs text-neutral-700">{hint}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <ScoreCircle score={previewScore} />
              <div className="text-xs text-neutral-600 mt-1.5 font-mono">score</div>
            </div>
          </div>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Any details, context, or why this matters..."
            rows={2}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none"
          />
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!title.trim()}
        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add to Backlog
      </button>
    </div>
  );
}

function IdeaCard({ idea, onUpdate, onDelete }: {
  idea: Idea;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-neutral-900 border rounded-lg overflow-hidden transition-all ${
      idea.status === "dropped" ? "opacity-40 border-neutral-800" : "border-neutral-800 hover:border-neutral-700"
    }`}>
      <div className="flex items-center gap-3 p-4">
        <ScoreCircle score={idea.totalScore} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-neutral-100">{idea.title}</span>
            <span className="text-xs">{CATEGORY_CONFIG[idea.category].emoji}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded border font-mono ${STATUS_CONFIG[idea.status].color}`}>
              {STATUS_CONFIG[idea.status].label}
            </span>
            {idea.project && (
              <span className="text-xs text-neutral-600 font-mono">{idea.project}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-neutral-600 hover:text-neutral-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="p-1.5 text-neutral-700 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800 p-4 space-y-4">
          {idea.description && (
            <p className="text-sm text-neutral-400 leading-relaxed">{idea.description}</p>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-neutral-600 mb-1.5">Effort (lower = better)</div>
              <ScoreBar value={idea.effortScore} color="bg-red-400/60" />
            </div>
            <div>
              <div className="text-xs text-neutral-600 mb-1.5">Impact</div>
              <ScoreBar value={idea.impactScore} color="bg-emerald-400/70" />
            </div>
            <div>
              <div className="text-xs text-neutral-600 mb-1.5">Goal Alignment</div>
              <ScoreBar value={idea.alignmentScore} color="bg-amber-400/70" />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["captured", "evaluating", "building", "parked", "dropped"] as IdeaStatus[]).map(status => (
              <button
                key={status}
                onClick={() => { updateIdea(idea.id, { status }); onUpdate(); }}
                className={`text-xs px-3 py-1.5 rounded border transition-all ${
                  idea.status === status
                    ? STATUS_CONFIG[status].color
                    : "border-neutral-800 text-neutral-600 hover:text-neutral-400"
                }`}
              >
                {STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IdeaIntelligence() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState(getIdeaStats());
  const [filter, setFilter] = useState<IdeaStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { refresh(); }, []);

  function refresh() {
    setIdeas(getIdeas());
    setStats(getIdeaStats());
  }

  function handleDelete(id: string) {
    deleteIdea(id);
    refresh();
  }

  const filtered = filter === "all" ? ideas : ideas.filter(i => i.status === filter);
  const topIdea = getTopIdeas(1)[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "captured", "evaluating", "building", "parked"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${
                filter === f
                  ? "border-amber-400/40 text-amber-400 bg-amber-400/10"
                  : "border-neutral-800 text-neutral-600 hover:text-neutral-300"
              }`}
            >
              {f === "all" ? `All (${stats.total})` : f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Capture Idea
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Ideas", value: stats.total, color: "text-amber-400" },
              { label: "In Backlog", value: stats.captured, color: "text-amber-400" },
              { label: "Building", value: stats.building, color: "text-emerald-400" },
              { label: "Avg Score", value: stats.avgScore, color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Top idea spotlight */}
          {topIdea && !showAdd && (
            <div className="bg-neutral-900 border border-emerald-400/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Top Ranked Idea</span>
              </div>
              <p className="text-sm font-semibold text-neutral-100 mb-1">{topIdea.title}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">Score: <span className="text-emerald-400 font-bold">{topIdea.totalScore}/10</span></span>
                <span className="text-xs text-neutral-600">{CATEGORY_CONFIG[topIdea.category].emoji} {CATEGORY_CONFIG[topIdea.category].label}</span>
              </div>
            </div>
          )}

          {/* Add form */}
          {showAdd && <AddIdeaForm onAdd={() => { refresh(); setShowAdd(false); }} />}

          {/* Idea list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Lightbulb className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-500 mb-3">
                {filter === "all" ? "No ideas yet — start capturing!" : `No ideas with status "${filter}"`}
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                + Add your first idea
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(idea => (
                <IdeaCard key={idea.id} idea={idea} onUpdate={refresh} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

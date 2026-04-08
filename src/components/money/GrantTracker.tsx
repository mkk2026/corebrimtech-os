"use client";

import { useState, useEffect } from "react";
import { Trophy, ExternalLink, ChevronDown, ChevronUp, Plus, Star, DollarSign, Clock, Check, FileText } from "lucide-react";
import { getGrants, updateGrant, addGrant, getGrantStats, getApplications, type Grant, type GrantStatus } from "@/lib/grant-tracker";
import FounderBrainNudge from "@/components/FounderBrainNudge";
import GrantAutoApply from "./GrantAutoApply";

const STATUS_CONFIG: Record<GrantStatus, { label: string; color: string }> = {
  watching:  { label: "Watching",    color: "text-neutral-400 border-neutral-700 bg-neutral-800" },
  eligible:  { label: "Eligible ✓",  color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
  applying:  { label: "Applying",    color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  submitted: { label: "Submitted",   color: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
  won:       { label: "WON 🏆",      color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  rejected:  { label: "Rejected",    color: "text-red-400/60 border-red-400/20 bg-red-400/5" },
  missed:    { label: "Missed",      color: "text-neutral-600 border-neutral-800 bg-neutral-900" },
};

function FitBar({ score }: { score: number }) {
  const color = score >= 85 ? "bg-emerald-400" : score >= 65 ? "bg-amber-400" : "bg-neutral-600";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-neutral-500 w-8">{score}%</span>
    </div>
  );
}

function GrantCard({ grant, onUpdate }: { grant: Grant; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);

  function handleStatus(status: GrantStatus) {
    updateGrant(grant.id, {
      status,
      appliedAt: status === "applying" ? new Date().toISOString() : grant.appliedAt,
      resultAt: (status === "won" || status === "rejected") ? new Date().toISOString() : grant.resultAt,
    });
    onUpdate();
  }

  const statusCfg = STATUS_CONFIG[grant.status];

  return (
    <div className={`bg-neutral-900 border rounded-xl overflow-hidden transition-all ${
      grant.status === "won" ? "border-emerald-400/30" :
      grant.fitScore >= 85 ? "border-amber-400/20" : "border-neutral-800"
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-bold text-neutral-200">{grant.name}</h3>
              {grant.isBuiltIn && (
                <span className="text-xs bg-amber-400/10 border border-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">curated</span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mb-2">{grant.organization}</p>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold text-emerald-400">{grant.amount}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              {grant.deadline && (
                <span className="text-xs text-neutral-600 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {grant.deadline}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-neutral-600 mb-1">Fit Score</div>
              <div className="w-24">
                <FitBar score={grant.fitScore} />
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-neutral-600 hover:text-neutral-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800 p-5 space-y-4">
          <p className="text-sm text-neutral-400 leading-relaxed">{grant.description}</p>

          <div className="bg-amber-400/5 border border-amber-400/15 rounded-lg p-3">
            <div className="text-xs font-mono text-amber-400 mb-1.5">Why You Fit</div>
            <p className="text-xs text-neutral-400">{grant.fitReason}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {grant.eligibility.length > 0 && (
              <div>
                <div className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-2">Eligibility</div>
                {grant.eligibility.map(e => (
                  <p key={e} className="text-xs text-neutral-500 mb-1">• {e}</p>
                ))}
              </div>
            )}
            {grant.requirements.length > 0 && (
              <div>
                <div className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-2">Requirements</div>
                {grant.requirements.map(r => (
                  <p key={r} className="text-xs text-neutral-500 mb-1">• {r}</p>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {grant.notes && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
              <div className="text-xs font-mono text-neutral-600 mb-1">Notes</div>
              <p className="text-xs text-neutral-400">{grant.notes}</p>
            </div>
          )}

          {/* Status actions */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {(["watching", "eligible", "applying", "submitted", "won", "rejected", "missed"] as GrantStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    grant.status === s ? STATUS_CONFIG[s].color : "border-neutral-800 text-neutral-600 hover:text-neutral-400"
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            {grant.url && (
              <a href={grant.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Learn More
              </a>
            )}
            {grant.applicationUrl && grant.applicationUrl !== grant.url && (
              <a href={grant.applicationUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors ml-4">
                <ExternalLink className="w-3 h-3" />
                Apply Now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrantTracker({ onNavigate }: { onNavigate?: (module: string) => void } = {}) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [stats, setStats] = useState(getGrantStats());
  const [filter, setFilter] = useState<GrantStatus | "all" | "high_fit">("high_fit");
  const [showAutoApply, setShowAutoApply] = useState(false);
  const [activeApplications, setActiveApplications] = useState(0);

  useEffect(() => { refresh(); }, []);

  function refresh() {
    setGrants(getGrants());
    setStats(getGrantStats());
    setActiveApplications(getApplications().filter(a => a.status !== "submitted").length);
  }

  const filtered = grants.filter(g => {
    if (filter === "all") return true;
    if (filter === "high_fit") return g.fitScore >= 80;
    return g.status === filter;
  });

  if (showAutoApply) {
    return <GrantAutoApply onBack={() => { setShowAutoApply(false); refresh(); }} />;
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <FounderBrainNudge onNavigate={onNavigate} />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Grant Tracker</div>
            <h2 className="text-xl font-bold text-neutral-100">Free Money. Don't Miss It.</h2>
            <p className="text-sm text-neutral-500 mt-1">10 curated grants for African tech founders — ranked by how well they fit Core Brim Tech.</p>
          </div>
          <button
            onClick={() => setShowAutoApply(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            Auto-Apply
            {activeApplications > 0 && (
              <span className="bg-blue-400/30 text-blue-100 text-xs px-2 py-0.5 rounded-full">
                {activeApplications}
              </span>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total Grants", value: stats.total, color: "text-neutral-300" },
            { label: "Eligible",     value: stats.eligible, color: "text-blue-400" },
            { label: "Applying",     value: stats.applying, color: "text-amber-400" },
            { label: "Won",          value: stats.won, color: "text-emerald-400" },
            { label: "Potential",    value: `$${(stats.potential / 1000).toFixed(0)}K+`, color: "text-purple-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "high_fit", label: "🎯 Best Fit (80%+)" },
            { id: "all", label: "All Grants" },
            { id: "watching", label: "Watching" },
            { id: "eligible", label: "Eligible" },
            { id: "applying", label: "Applying" },
            { id: "submitted", label: "Submitted" },
            { id: "won", label: "Won" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id as typeof filter)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                filter === id
                  ? "border-amber-400/40 text-amber-400 bg-amber-400/10"
                  : "border-neutral-800 text-neutral-600 hover:text-neutral-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grant list */}
        <div className="space-y-4">
          {filtered.map(grant => (
            <GrantCard key={grant.id} grant={grant} onUpdate={refresh} />
          ))}
        </div>

      </div>
    </div>
  );
}

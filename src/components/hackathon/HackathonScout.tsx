"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radar, Play, Loader2, CheckCircle, ExternalLink,
  Trophy, Clock, Zap, TrendingUp, Star, ChevronDown,
  ChevronUp, ArrowRight, RefreshCw, AlertTriangle, X
} from "lucide-react";
import {
  getListings, updateListing, getScoutStats, runAutoScout,
  type HackathonListing
} from "@/lib/hackathon-scout";
import { getBrainSummary } from "@/lib/founder-brain";
import { getStoredAnthropicKey } from "@/lib/skill-engine";

const STATUS_COLORS: Record<HackathonListing["status"], string> = {
  new:       "text-amber-400 border-amber-400/30 bg-amber-400/10",
  saved:     "text-blue-400 border-blue-400/30 bg-blue-400/10",
  building:  "text-purple-400 border-purple-400/30 bg-purple-400/10",
  submitted: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  skipped:   "text-neutral-600 border-neutral-800 bg-neutral-900",
};

const DIFF_COLORS = {
  beginner:     "text-emerald-400",
  intermediate: "text-amber-400",
  advanced:     "text-red-400",
};

const PLATFORM_EMOJIS: Record<HackathonListing["platform"], string> = {
  devpost: "🖥",
  mlh:     "🏆",
  lablab:  "🤖",
  devfolio:"📐",
  other:   "🌐",
};

function formatMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function ScoutCard({ listing, onUpdate }: { listing: HackathonListing; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = useMemo(() => Math.ceil((new Date(listing.deadline).getTime() - Date.now()) / 86400000), [listing.deadline]);
  const urgent = daysLeft <= 7;

  function setStatus(status: HackathonListing["status"]) {
    updateListing(listing.id, { status });
    onUpdate();
  }

  return (
    <div className={`bg-neutral-900 border rounded-xl overflow-hidden transition-all ${
      listing.fitScore >= 90 ? "border-amber-400/30" :
      listing.fitScore >= 80 ? "border-neutral-700" : "border-neutral-800"
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Fit Score */}
          <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex flex-col items-center justify-center border ${
            listing.fitScore >= 90 ? "bg-amber-400/15 border-amber-400/30" :
            listing.fitScore >= 75 ? "bg-blue-400/10 border-blue-400/20" :
            "bg-neutral-800 border-neutral-700"
          }`}>
            <span className={`text-sm font-black ${
              listing.fitScore >= 90 ? "text-amber-400" :
              listing.fitScore >= 75 ? "text-blue-400" : "text-neutral-500"
            }`}>{listing.fitScore}</span>
            <span className="text-xs text-neutral-600 font-mono">fit</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-bold text-neutral-200 leading-snug">{listing.title}</h3>
              <span className={`text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0 ${STATUS_COLORS[listing.status]}`}>
                {listing.status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-2">{PLATFORM_EMOJIS[listing.platform]} {listing.organizer}</p>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold text-emerald-400">{listing.prizeDisplay}</span>
              <span className={`text-xs font-mono flex items-center gap-1 ${urgent ? "text-red-400" : "text-neutral-500"}`}>
                <Clock className="w-3 h-3" />
                {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
              </span>
              <span className={`text-xs font-mono ${DIFF_COLORS[listing.difficulty]}`}>
                {listing.difficulty}
              </span>
              <span className="text-xs font-mono text-neutral-600">
                ~{listing.estimatedHours}h · ${listing.roi}/hr expected
              </span>
              {listing.online && <span className="text-xs text-blue-400/70 font-mono">online</span>}
            </div>
          </div>

          <button onClick={() => setExpanded(!expanded)} className="text-neutral-600 hover:text-neutral-300 p-1 flex-shrink-0 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800 p-4 space-y-4">
          <div>
            <p className="text-xs text-neutral-600 mb-1 font-mono uppercase tracking-widest">Theme</p>
            <p className="text-sm text-neutral-300">{listing.theme}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {listing.tags.map(t => (
              <span key={t} className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-500 px-2 py-0.5 rounded font-mono">{t}</span>
            ))}
          </div>

          <div className="bg-amber-400/5 border border-amber-400/15 rounded-lg p-3">
            <p className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-2">Why You Should Enter</p>
            {listing.fitReasons.map((r, i) => (
              <p key={i} className="text-xs text-neutral-400 mb-1.5">✓ {r}</p>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <a href={listing.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
              <ExternalLink className="w-3 h-3" /> View Hackathon
            </a>
            <span className="text-neutral-700">·</span>
            {(["saved", "building", "submitted", "skipped"] as HackathonListing["status"][]).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`text-xs px-2.5 py-1 rounded border transition-all ${listing.status === s ? STATUS_COLORS[s] : "border-neutral-800 text-neutral-600 hover:text-neutral-400"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HackathonScout() {
  const [listings, setListings] = useState<HackathonListing[]>([]);
  const [stats, setStats] = useState(getScoutStats());
  const [scanning, setScanning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "high_fit" | HackathonListing["status"]>("high_fit");
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => { refresh(); }, []);

  function refresh() {
    setListings(getListings());
    setStats(getScoutStats());
  }

  async function handleScout() {
    if (scanning) return;
    setScanning(true);
    setScanLog([]);
    setListings([]);
    setRunError(null);
    const context = getBrainSummary();

    try {
      for await (const update of runAutoScout(context, getStoredAnthropicKey())) {
        if (update.type === "step") {
          setScanLog(prev => [...prev, update.message || ""]);
        } else if (update.type === "found" && update.listing) {
          setListings(prev => [...prev, update.listing!]);
        } else if (update.type === "done") {
          refresh();
          setScanLog([]);
        } else if (update.type === "error" && update.message) {
          setRunError(update.message);
          break;
        }
      }
    } finally {
      setScanning(false);
    }
  }

  const filtered = listings.filter(l => {
    if (filter === "high_fit") return l.fitScore >= 85;
    if (filter === "all") return true;
    return l.status === filter;
  });

  const totalPrizePotential = filtered.reduce((s, l) => s + l.prizeTotal, 0);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Run error */}
        {runError && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-200">Scout failed</p>
              <p className="text-xs text-neutral-400 mt-1">{runError}</p>
            </div>
            <button type="button" onClick={() => setRunError(null)} className="text-neutral-500 hover:text-neutral-300 p-1" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Hackathon Auto-Scout</div>
            <h2 className="text-xl font-bold text-neutral-100">Find Winnable Hackathons</h2>
            <p className="text-sm text-neutral-500 mt-1">Scans DevPost, MLH, Lablab.ai and Devfolio. Scores each one against your profile.</p>
          </div>
          <button onClick={handleScout} disabled={scanning}
            className={`flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg transition-colors ${
              scanning ? "bg-amber-400/20 border border-amber-400/30 text-amber-400" : "bg-amber-400 hover:bg-amber-300 text-black"
            }`}>
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            {scanning ? "Scanning..." : "Run Scout"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Found",      value: stats.total,              color: "text-neutral-300" },
            { label: "High Fit",   value: stats.highFit,            color: "text-amber-400" },
            { label: "Saved",      value: stats.saved,              color: "text-blue-400" },
            { label: "Submitted",  value: stats.submitted,          color: "text-purple-400" },
            { label: "Prize Pool", value: `$${(stats.totalPrizePotential / 1000).toFixed(0)}K`, color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Scan log */}
        {scanning && scanLog.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-2">Scout Running</div>
            {scanLog.map((log, i) => (
              <div key={i} className="flex items-center gap-2">
                {i === scanLog.length - 1
                  ? <Loader2 className="w-3 h-3 text-amber-400 animate-spin flex-shrink-0" />
                  : <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                }
                <span className={`text-xs ${i === scanLog.length - 1 ? "text-amber-400" : "text-neutral-600"}`}>{log}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "high_fit", label: "🎯 Best Fit (85%+)" },
              { id: "all", label: "All" },
              { id: "new", label: "New" },
              { id: "saved", label: "Saved" },
              { id: "building", label: "Building" },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setFilter(id as typeof filter)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter === id ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>
                {label}
              </button>
            ))}
          </div>
          {filtered.length > 0 && (
            <span className="text-xs font-mono text-neutral-600">
              {filtered.length} hackathons · ${(totalPrizePotential / 1000).toFixed(0)}K total prizes
            </span>
          )}
        </div>

        {/* Listings */}
        <div className="space-y-4">
          {filtered.length === 0 && !scanning ? (
            <div className="text-center py-16">
              <Radar className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-base font-bold text-neutral-400 mb-2">Ready to Scout</h3>
              <p className="text-sm text-neutral-600 mb-4 max-w-sm mx-auto">Hit "Run Scout" to scan all major hackathon platforms and find the ones worth entering.</p>
              <p className="text-xs text-neutral-700 font-mono">Uses your Founder Brain profile to score each hackathon's fit</p>
            </div>
          ) : (
            filtered.map(listing => (
              <ScoutCard key={listing.id} listing={listing} onUpdate={refresh} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

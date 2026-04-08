"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, CheckCircle, Circle, BookOpen, Trash2, ExternalLink, ChevronDown, ChevronUp, Zap, AlertTriangle, X } from "lucide-react";
import { runResearch, type ResearchReport, type ResearchStep } from "@/lib/research-engine";
import { saveReport, getLibrary, deleteReport, searchLibrary } from "@/lib/research-storage";
import { getStoredAnthropicKey } from "@/lib/skill-engine";

const CREDIBILITY_COLORS: Record<string, string> = {
  very_high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  high: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  low: "text-red-400 bg-red-400/10 border-red-400/30",
};

const CREDIBILITY_LABELS: Record<string, string> = {
  very_high: "Very High",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function StepIndicator({ step }: { step: ResearchStep }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {step.status === "done" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : step.status === "active" ? (
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          ) : (
            <Circle className="w-4 h-4 text-neutral-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${
            step.status === "done" ? "text-neutral-300" :
            step.status === "active" ? "text-amber-400" :
            "text-neutral-600"
          }`}>
            {step.label}
          </span>
          {step.detail && (
            <span className="text-xs text-neutral-500 ml-2">— {step.detail}</span>
          )}
        </div>
        {step.status === "done" && step.progress === 100 && (
          <span className="text-xs font-mono text-emerald-400">100%</span>
        )}
        {step.status === "active" && step.progress !== undefined && (
          <span className="text-xs font-mono text-amber-400">{Math.round(step.progress)}%</span>
        )}
      </div>
      {step.status === "active" && step.progress !== undefined && (
        <div className="ml-7 h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${step.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onDelete, onView }: {
  report: ResearchReport;
  onDelete: (id: string) => void;
  onView: (report: ResearchReport) => void;
}) {
  return (
    <div
      className="group bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all cursor-pointer"
      onClick={() => onView(report)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-neutral-200 line-clamp-2 leading-snug">
          {report.topic}
        </h3>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-neutral-600 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
        {report.summary.slice(0, 120)}...
      </p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
            {report.sources.length.toLocaleString()} sources
          </span>
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
            Depth {report.depth}
          </span>
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
            {report.keyFindings.length} findings
          </span>
        </div>
        <span className="text-xs text-neutral-600">
          {new Date(report.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function FullReport({ report, onBack }: { report: ResearchReport; onBack: () => void }) {
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-xs font-mono text-neutral-500 hover:text-amber-400 transition-colors"
        >
          ← Back to Engine
        </button>
      </div>

      <div>
        <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-2">Research Report</div>
        <h1 className="text-2xl font-bold text-neutral-100 leading-tight mb-1">{report.topic}</h1>
        <div className="flex gap-3 text-xs text-neutral-500 font-mono flex-wrap">
          <span>{report.sources.length.toLocaleString()} sources</span>
          <span>·</span>
          <span>Depth {report.depth}</span>
          <span>·</span>
          <span>{report.subQueries.length} sub-queries</span>
          <span>·</span>
          <span>{report.keyFindings.length} findings</span>
          <span>·</span>
          <span>{report.totalPagesRead} pages read</span>
          <span>·</span>
          <span>{new Date(report.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Sub-queries */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <div className="text-xs font-mono text-neutral-500 tracking-widest uppercase mb-3">Search Queries Used</div>
        <div className="flex flex-wrap gap-2">
          {report.subQueries.map((q, i) => (
            <span key={i} className="text-xs bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded border border-neutral-700">
              {q}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-3">Executive Summary</div>
        <p className="text-sm text-neutral-300 leading-7 whitespace-pre-line">{report.summary}</p>
      </div>

      {/* Key Findings */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-3">Key Findings</div>
        <div className="space-y-3">
          {report.keyFindings.map((finding, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-xs font-mono text-neutral-600 mt-0.5 flex-shrink-0 w-5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm text-neutral-300 leading-relaxed">{finding}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="text-xs font-mono text-blue-400 tracking-widest uppercase mb-3">
          Sources ({report.sources.length})
        </div>
        <div className="space-y-2">
          {report.sources.map((source, i) => (
            <div key={i} className="border border-neutral-800 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                onClick={() => setExpandedSource(expandedSource === i ? null : i)}
              >
                <span className={`text-xs px-2 py-0.5 rounded border font-mono flex-shrink-0 ${CREDIBILITY_COLORS[source.credibility]}`}>
                  {CREDIBILITY_LABELS[source.credibility]}
                </span>
                {source.isActive === true && (
                  <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 flex-shrink-0">Verified</span>
                )}
                {source.isActive === false && (
                  <span className="text-xs px-2 py-0.5 rounded border border-red-500/30 text-red-400 flex-shrink-0">Unreachable</span>
                )}
                <span className="text-sm text-neutral-300 flex-1 font-medium line-clamp-1 min-w-0">
                  {source.title}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-neutral-600 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {expandedSource === i
                    ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                    : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  }
                </div>
              </div>
              {expandedSource === i && (
                <div className="px-3 pb-3 pt-0 border-t border-neutral-800">
                  <p className="text-xs text-neutral-400 leading-relaxed mt-2">{source.snippet}</p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-amber-400 hover:underline mt-2 inline-block"
                  >
                    {source.url}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const RESEARCH_INTERRUPTED_KEY = "cbt_os_research_interrupted";

export default function ResearchEngine() {
  const [topic, setTopic] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [currentReport, setCurrentReport] = useState<ResearchReport | null>(null);
  const [viewingReport, setViewingReport] = useState<ResearchReport | null>(null);
  const [library, setLibrary] = useState<ResearchReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"engine" | "library">("engine");
  const [runError, setRunError] = useState<string | null>(null);
  const [interruptedTopic, setInterruptedTopic] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const runStateRef = useRef<{ isRunning: boolean; topic: string }>({ isRunning: false, topic: "" });

  runStateRef.current = { isRunning, topic: topic.trim() };

  useEffect(() => {
    setLibrary(getLibrary());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(RESEARCH_INTERRUPTED_KEY);
      if (raw) {
        const { topic: t } = JSON.parse(raw) as { topic?: string };
        if (t) setInterruptedTopic(t);
      }
    } catch {
      // ignore
    }
    sessionStorage.removeItem(RESEARCH_INTERRUPTED_KEY);
  }, []);

  useEffect(() => {
    return () => {
      const { isRunning: running, topic: t } = runStateRef.current;
      if (running && t && typeof window !== "undefined") {
        sessionStorage.setItem(RESEARCH_INTERRUPTED_KEY, JSON.stringify({ topic: t }));
      }
    };
  }, []);

  const filteredLibrary = searchQuery ? searchLibrary(searchQuery) : library;

  async function handleResearch() {
    if (!topic.trim() || isRunning) return;
    setIsRunning(true);
    setCurrentReport(null);
    setSteps([]);
    setRunError(null);

    try {
      for await (const update of runResearch(topic.trim(), getStoredAnthropicKey())) {
        if (update.type === "step_update" && update.step) {
          setSteps((prev) => {
            const existing = prev.findIndex((s) => s.step === update.step!.step);
            if (existing >= 0) {
              const next = [...prev];
              next[existing] = update.step!;
              return next;
            }
            return [...prev, update.step!];
          });
        } else if (update.type === "source_batch") {
          // Source batches stream in — we just let the step detail handle the count display
        } else if (update.type === "result" && update.report) {
          setCurrentReport(update.report);
          saveReport(update.report);
          setLibrary(getLibrary());
        } else if (update.type === "error" && update.error) {
          setRunError(update.error);
          break;
        }
      }
    } finally {
      setIsRunning(false);
    }
  }

  function handleDelete(id: string) {
    deleteReport(id);
    setLibrary(getLibrary());
  }

  if (viewingReport) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <FullReport report={viewingReport} onBack={() => setViewingReport(null)} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ── MAIN PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Tabs */}
        <div className="border-b border-neutral-800 px-6">
          <div className="flex gap-0">
            {[
              { id: "engine", label: "Research Engine", icon: Search },
              { id: "library", label: `Library (${library.length})`, icon: BookOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as "engine" | "library")}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-6">
          {activeTab === "engine" ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Interrupted banner */}
              {interruptedTopic && (
                <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200">
                      Your research on &ldquo;{interruptedTopic}&rdquo; was interrupted when you left this page. Check the <button type="button" onClick={() => setActiveTab("library")} className="text-amber-400 hover:underline">Library</button> for any completed reports, or start a new run.
                    </p>
                  </div>
                  <button type="button" onClick={() => setInterruptedTopic(null)} className="text-neutral-500 hover:text-neutral-300 p-1" aria-label="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Run error */}
              {runError && (
                <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-200">Research failed</p>
                    <p className="text-xs text-neutral-400 mt-1">{runError}</p>
                  </div>
                  <button type="button" onClick={() => setRunError(null)} className="text-neutral-500 hover:text-neutral-300 p-1" aria-label="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Hero */}
              {!isRunning && !currentReport && steps.length === 0 && !interruptedTopic && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 mb-4">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-100 mb-2">Deep Research Engine</h2>
                  <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
                    Enter any topic. The engine searches, reads full pages, finds gaps, and synthesizes a permanent research report.
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      ref={inputRef}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                      placeholder="What do you want to research deeply?"
                      disabled={isRunning}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleResearch}
                    disabled={isRunning || !topic.trim()}
                    className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm px-5 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {isRunning ? "Researching..." : "Research"}
                  </button>
                </div>
                <p className="text-xs text-neutral-600 font-mono mt-1.5 ml-1">
                  {isRunning ? "Running 5-level deep research..." : "Press Enter or click Research • Results saved to library"}
                </p>
              </div>

              {/* Steps */}
              {steps.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
                  <div className="text-xs font-mono text-neutral-500 tracking-widest uppercase mb-1">Research Progress</div>
                  {steps.map((step) => (
                    <StepIndicator key={step.step} step={step} />
                  ))}
                </div>
              )}

              {/* Result */}
              {currentReport && (
                <div className="bg-neutral-900 border border-emerald-400/20 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-emerald-400 tracking-widest uppercase">Research Complete</div>
                    <button
                      onClick={() => setViewingReport(currentReport)}
                      className="text-xs font-mono text-amber-400 hover:underline"
                    >
                      View Full Report →
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-neutral-100">{currentReport.topic}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3">
                    {currentReport.summary}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {currentReport.keyFindings.slice(0, 4).map((finding, i) => (
                      <div key={i} className="bg-neutral-800 rounded p-2.5">
                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{finding}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 text-xs text-neutral-500 font-mono">
                    <span>{currentReport.sources.length} sources</span>
                    <span>·</span>
                    <span>{currentReport.keyFindings.length} findings</span>
                    <span>·</span>
                    <span>Saved to library</span>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {!isRunning && !currentReport && (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-neutral-600 tracking-widest uppercase">Try these</div>
                  {[
                    "Remote tech job market for West African developers 2026",
                    "AI interview coaching tools competitive landscape",
                    "Freemium SaaS conversion rates emerging markets",
                    "YC application tips for African founders",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setTopic(suggestion); inputRef.current?.focus(); }}
                      className="w-full text-left text-sm text-neutral-500 hover:text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg px-4 py-2.5 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── LIBRARY TAB ── */
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your research library..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {filteredLibrary.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">
                    {searchQuery ? "No research found matching your query" : "Your research library is empty — run your first research above"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredLibrary.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onDelete={handleDelete}
                      onView={setViewingReport}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

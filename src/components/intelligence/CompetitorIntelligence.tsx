"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield, RefreshCw, ChevronDown, ChevronUp, AlertTriangle,
  TrendingUp, Zap, Clock, Target, Eye, Loader2, CheckCircle,
  ArrowRight, Star, X, Bell, Rocket, DollarSign, Users, Megaphone
} from "lucide-react";
import { getBrain, type Competitor } from "@/lib/founder-brain";
import {
  runCompetitorIntelligence, getLatestReport,
  getCompetitorAlerts, getAlertStats, acknowledgeAlert, simulateCompetitorAlert,
  type CompetitorReport, type IntelligenceStep, type CounterStrategy, type CompetitorAlert, type AlertType
} from "@/lib/competitor-intelligence";
import { getStoredAnthropicKey } from "@/lib/skill-engine";

const URGENCY_CONFIG = {
  immediate:   { label: "Do Now",      color: "text-red-400 bg-red-400/10 border-red-400/20" },
  this_week:   { label: "This Week",   color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  this_month:  { label: "This Month",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  long_term:   { label: "Long Term",   color: "text-neutral-500 bg-neutral-800 border-neutral-700" },
};

const IMPACT_COLOR = { low: "text-neutral-500", medium: "text-amber-400", high: "text-emerald-400" };
const THREAT_BORDER = {
  low:      "border-neutral-800",
  medium:   "border-amber-400/20",
  high:     "border-red-400/30",
  critical: "border-red-500/40",
};

function StrategyCard({ strategy }: { strategy: CounterStrategy }) {
  const urgency = URGENCY_CONFIG[strategy.urgency];
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-neutral-200 flex-1">{strategy.title}</h4>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0 ${urgency.color}`}>
          {urgency.label}
        </span>
      </div>
      <p className="text-xs text-neutral-400 leading-relaxed">{strategy.description}</p>
      <div className="flex gap-3 text-xs font-mono">
        <span>Effort: <span className={IMPACT_COLOR[strategy.effort]}>{strategy.effort}</span></span>
        <span>Impact: <span className={IMPACT_COLOR[strategy.impact]}>{strategy.impact}</span></span>
      </div>
    </div>
  );
}

function ReportView({ report }: { report: CompetitorReport }) {
  const [section, setSection] = useState<string | null>("strategies");

  const sections = [
    { id: "strategies", label: `Counter-Strategies (${report.counterStrategies.length})` },
    { id: "recent", label: "Recent Activity" },
    { id: "opportunities", label: `Opportunities (${report.opportunities.length})` },
    { id: "warnings", label: `Warnings (${report.warnings.length})` },
    { id: "swot", label: "SWOT Analysis" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">Intelligence Summary</span>
          <div className="flex gap-2 text-xs font-mono text-neutral-600">
            <span>{report.sourcesChecked} sources</span>
            <span>·</span>
            <span>{report.confidenceScore}% confidence</span>
            <span>·</span>
            <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed">{report.overallSummary}</p>
      </div>

      {/* Threat assessment */}
      <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-mono text-red-400 uppercase tracking-widest">Threat Assessment</span>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed">{report.threatAssessment}</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(section === s.id ? null : s.id)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              section === s.id
                ? "border-amber-400/40 text-amber-400 bg-amber-400/10"
                : "border-neutral-800 text-neutral-600 hover:text-neutral-400"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "strategies" && (
        <div className="space-y-3">
          {report.counterStrategies
            .sort((a, b) => {
              const order = { immediate: 0, this_week: 1, this_month: 2, long_term: 3 };
              return order[a.urgency] - order[b.urgency];
            })
            .map((s, i) => <StrategyCard key={i} strategy={s} />)}
        </div>
      )}

      {section === "recent" && (
        <div className="space-y-4">
          {[
            { label: "Product Releases", items: report.recentReleases, color: "text-blue-400" },
            { label: "Pricing Changes", items: report.pricingChanges, color: "text-red-400" },
            { label: "Team Changes", items: report.teamChanges, color: "text-purple-400" },
            { label: "Marketing Moves", items: report.marketingMoves, color: "text-amber-400" },
            { label: "Funding News", items: report.fundingNews, color: "text-emerald-400" },
          ].filter(g => g.items.length > 0).map(({ label, items, color }) => (
            <div key={label}>
              <div className={`text-xs font-mono ${color} uppercase tracking-widest mb-2`}>{label}</div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 py-2 border-b border-neutral-800 last:border-0">
                  <span className="text-xs font-mono text-neutral-700 mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-neutral-400">{item}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {section === "opportunities" && (
        <div className="space-y-2">
          {report.opportunities.map((opp, i) => (
            <div key={i} className="flex gap-3 p-3 bg-emerald-400/5 border border-emerald-400/15 rounded-lg">
              <Star className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-300">{opp}</p>
            </div>
          ))}
        </div>
      )}

      {section === "warnings" && (
        <div className="space-y-2">
          {report.warnings.map((w, i) => (
            <div key={i} className="flex gap-3 p-3 bg-amber-400/5 border border-amber-400/15 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-300">{w}</p>
            </div>
          ))}
        </div>
      )}

      {section === "swot" && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Their Strengths", items: report.currentStrengths, color: "text-red-400", bg: "bg-red-400/5 border-red-400/15" },
            { label: "Their Weaknesses (Our Opportunities)", items: report.currentWeaknesses, color: "text-emerald-400", bg: "bg-emerald-400/5 border-emerald-400/15" },
          ].map(({ label, items, color, bg }) => (
            <div key={label} className={`rounded-lg p-4 border ${bg}`}>
              <div className={`text-xs font-mono ${color} uppercase tracking-widest mb-3`}>{label}</div>
              {items.map((item, i) => (
                <p key={i} className="text-xs text-neutral-400 mb-2 leading-relaxed">• {item}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const COMPETITOR_INTEL_INTERRUPTED_KEY = "cbt_os_competitor_intel_interrupted";

const ALERT_TYPE_ICONS: Record<AlertType, typeof Rocket> = {
  feature_launch: Rocket,
  pricing_change: DollarSign,
  funding: TrendingUp,
  team_change: Users,
  marketing: Megaphone,
  threat_increase: AlertTriangle,
};

const ALERT_SEVERITY_COLORS = {
  low: "text-neutral-400 border-neutral-700",
  medium: "text-amber-400 border-amber-400/30",
  high: "text-red-400 border-red-400/30",
  critical: "text-red-500 border-red-500/40 bg-red-500/10",
};

export default function CompetitorIntelligence() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [steps, setSteps] = useState<IntelligenceStep[]>([]);
  const [reports, setReports] = useState<Record<string, CompetitorReport>>({});
  const [runError, setRunError] = useState<string | null>(null);
  const [interruptedName, setInterruptedName] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [alertStats, setAlertStats] = useState(getAlertStats());
  const [showAlerts, setShowAlerts] = useState(false);
  const runStateRef = useRef<{ running: string | null; competitorName: string }>({ running: null, competitorName: "" });

  runStateRef.current = { running, competitorName: running ? (competitors.find(c => c.id === running)?.name ?? "") : "" };

  useEffect(() => {
    const brain = getBrain();
    if (brain) {
      setCompetitors(brain.competitors);
      // Load existing reports
      const loaded: Record<string, CompetitorReport> = {};
      brain.competitors.forEach(c => {
        const r = getLatestReport(c.id);
        if (r) loaded[c.id] = r;
      });
      setReports(loaded);
    }
    refreshAlerts();
  }, []);

  function refreshAlerts() {
    setAlerts(getCompetitorAlerts(false));
    setAlertStats(getAlertStats());
  }

  function handleAcknowledgeAlert(alertId: string) {
    acknowledgeAlert(alertId);
    refreshAlerts();
  }

  function handleSimulateAlert() {
    if (competitors.length > 0) {
      const types: AlertType[] = ["feature_launch", "pricing_change", "funding", "team_change", "marketing", "threat_increase"];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomCompetitor = competitors[Math.floor(Math.random() * competitors.length)];
      simulateCompetitorAlert(randomCompetitor.name, randomType);
      refreshAlerts();
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(COMPETITOR_INTEL_INTERRUPTED_KEY);
      if (raw) {
        const { name } = JSON.parse(raw) as { name?: string };
        if (name) setInterruptedName(name);
      }
    } catch {
      // ignore
    }
    sessionStorage.removeItem(COMPETITOR_INTEL_INTERRUPTED_KEY);
  }, []);

  useEffect(() => {
    return () => {
      const { running: r, competitorName: name } = runStateRef.current;
      if (r && name && typeof window !== "undefined") {
        sessionStorage.setItem(COMPETITOR_INTEL_INTERRUPTED_KEY, JSON.stringify({ name }));
      }
    };
  }, []);

  async function handleRunIntelligence(competitor: Competitor) {
    if (running) return;
    setRunning(competitor.id);
    setActiveId(competitor.id);
    setSteps([]);
    setRunError(null);

    try {
      for await (const update of runCompetitorIntelligence(competitor, getStoredAnthropicKey())) {
        if (update.type === "step_update" && update.step) {
          setSteps(prev => {
            const idx = prev.findIndex(s => s.step === update.step!.step);
            if (idx >= 0) { const n = [...prev]; n[idx] = update.step!; return n; }
            return [...prev, update.step!];
          });
        } else if (update.type === "result" && update.report) {
          setReports(prev => ({ ...prev, [competitor.id]: update.report! }));
          setSteps([]);
        } else if (update.type === "error" && update.error) {
          setRunError(update.error);
          break;
        }
      }
    } finally {
      setRunning(null);
    }
  }

  if (competitors.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Shield className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-neutral-300 mb-2">No Competitors Added</h3>
          <p className="text-sm text-neutral-500 mb-4">Add competitors in Founder Brain first — then come back here to run deep intelligence on each one.</p>
          <div className="text-xs font-mono text-neutral-600">Founder Brain → Competitors tab</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-red-400 tracking-widest uppercase mb-1">Competitor Intelligence</div>
            <h2 className="text-xl font-bold text-neutral-100">Know Your Enemy</h2>
            <p className="text-sm text-neutral-500 mt-1">Deep research on what competitors are shipping, pricing, and planning — with counter-strategies.</p>
          </div>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="flex items-center gap-2 px-4 py-2 bg-red-950/30 border border-red-900/30 rounded-lg text-sm text-red-400 hover:bg-red-950/50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Alerts
            {alertStats.unacknowledged > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {alertStats.unacknowledged}
              </span>
            )}
          </button>
        </div>

        {/* Alerts Section */}
        {showAlerts && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {alertStats.bySeverity.critical > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                    {alertStats.bySeverity.critical} Critical
                  </span>
                )}
                {alertStats.bySeverity.high > 0 && (
                  <span className="text-xs bg-red-400/20 text-red-400 px-2 py-1 rounded">
                    {alertStats.bySeverity.high} High
                  </span>
                )}
                {alertStats.bySeverity.medium > 0 && (
                  <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded">
                    {alertStats.bySeverity.medium} Medium
                  </span>
                )}
              </div>
              <button
                onClick={handleSimulateAlert}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                + Simulate Alert
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-8 text-neutral-600 text-sm">
                No active alerts. Competitor monitoring is running.
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => {
                  const TypeIcon = ALERT_TYPE_ICONS[alert.type];
                  return (
                    <div
                      key={alert.id}
                      className={`bg-neutral-900 border rounded-lg p-4 ${ALERT_SEVERITY_COLORS[alert.severity]}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-200">{alert.title}</span>
                            <span className="text-xs text-neutral-500">{alert.competitorName}</span>
                          </div>
                          <p className="text-sm text-neutral-400 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-600">
                              {new Date(alert.detectedAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              Acknowledge
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Interrupted banner */}
        {interruptedName && (
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-200">
                Your intelligence run on &ldquo;{interruptedName}&rdquo; was interrupted when you left. Re-run when ready or check existing reports below.
              </p>
            </div>
            <button type="button" onClick={() => setInterruptedName(null)} className="text-neutral-500 hover:text-neutral-300 p-1" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Run error */}
        {runError && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-200">Intelligence run failed</p>
              <p className="text-xs text-neutral-400 mt-1">{runError}</p>
            </div>
            <button type="button" onClick={() => setRunError(null)} className="text-neutral-500 hover:text-neutral-300 p-1" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Competitor cards */}
        {competitors.map(competitor => {
          const report = reports[competitor.id];
          const isRunning = running === competitor.id;
          const isActive = activeId === competitor.id;

          return (
            <div key={competitor.id} className={`bg-neutral-900 border rounded-xl overflow-hidden transition-all ${THREAT_BORDER[competitor.threatLevel]}`}>
              {/* Header */}
              <div className="flex items-center gap-4 p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-neutral-100">{competitor.name}</h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border capitalize ${
                      competitor.threatLevel === "critical" ? "text-red-500 bg-red-500/10 border-red-500/30" :
                      competitor.threatLevel === "high" ? "text-red-400 bg-red-400/10 border-red-400/20" :
                      competitor.threatLevel === "medium" ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                      "text-neutral-500 bg-neutral-800 border-neutral-700"
                    }`}>{competitor.threatLevel} threat</span>
                  </div>
                  <a href={competitor.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-neutral-600 hover:text-amber-400 transition-colors">
                    {competitor.url}
                  </a>
                  {report && (
                    <p className="text-xs text-neutral-600 mt-1">
                      Last run: {new Date(report.generatedAt).toLocaleDateString()} · {report.sourcesChecked} sources · {report.confidenceScore}% confidence
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRunIntelligence(competitor)}
                  disabled={!!running}
                  className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg border transition-all flex-shrink-0 ${
                    isRunning
                      ? "border-amber-400/30 text-amber-400 bg-amber-400/10"
                      : "border-neutral-700 text-neutral-400 hover:border-amber-400/40 hover:text-amber-400 bg-neutral-800"
                  } disabled:opacity-50`}
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  {isRunning ? "Running..." : report ? "Re-run" : "Run Intel"}
                </button>
              </div>

              {/* Steps while running */}
              {isRunning && steps.length > 0 && (
                <div className="border-t border-neutral-800 px-5 py-4 space-y-2.5">
                  {steps.map(step => (
                    <div key={step.step} className="flex items-center gap-3">
                      {step.status === "done"
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : step.status === "active"
                        ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                        : <div className="w-4 h-4 rounded-full border border-neutral-700 flex-shrink-0" />
                      }
                      <span className={`text-sm ${step.status === "active" ? "text-amber-400" : step.status === "done" ? "text-neutral-400" : "text-neutral-700"}`}>
                        {step.label}
                      </span>
                      {step.detail && <span className="text-xs text-neutral-600">— {step.detail}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Report */}
              {!isRunning && report && isActive && (
                <div className="border-t border-neutral-800 px-5 py-5">
                  <ReportView report={report} />
                </div>
              )}

              {/* Show report toggle if not active */}
              {!isRunning && report && !isActive && (
                <button
                  onClick={() => setActiveId(competitor.id)}
                  className="w-full border-t border-neutral-800 px-5 py-3 text-xs text-neutral-600 hover:text-neutral-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Intelligence Report
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {/* No report yet */}
              {!isRunning && !report && (
                <div className="border-t border-neutral-800 px-5 py-4">
                  <p className="text-xs text-neutral-700 text-center">
                    No intelligence gathered yet — click "Run Intel" to start deep research
                  </p>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

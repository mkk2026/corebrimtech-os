"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, ChevronLeft, Trash2, CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getDecisions,
  getDecisionStats,
  getDecisionPatterns,
  addDecision,
  updateDecision,
  deleteDecision,
  type Decision,
  type DecisionCategory,
  type DecisionImpact,
  type DecisionStatus,
} from "@/lib/decision-journal";

interface DecisionJournalProps {
  onBack?: () => void;
}

const CATEGORY_COLORS: Record<DecisionCategory, string> = {
  product: "text-purple-400",
  hiring: "text-blue-400",
  funding: "text-emerald-400",
  marketing: "text-pink-400",
  sales: "text-amber-400",
  strategy: "text-red-400",
  operations: "text-neutral-400",
  personal: "text-cyan-400",
};

const IMPACT_COLORS: Record<DecisionImpact, string> = {
  low: "text-neutral-500",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-500",
};

const STATUS_ICONS: Record<DecisionStatus, typeof CheckCircle> = {
  pending: AlertCircle,
  implemented: CheckCircle,
  reversed: XCircle,
  cancelled: XCircle,
};

export default function DecisionJournal({ onBack }: DecisionJournalProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState(getDecisionStats());
  const [patterns, setPatterns] = useState(getDecisionPatterns());
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<DecisionCategory | "all">("all");
  const [newDecision, setNewDecision] = useState({
    title: "",
    description: "",
    category: "strategy" as DecisionCategory,
    impact: "medium" as DecisionImpact,
    expectedOutcome: "",
    context: "",
    alternatives: "",
    stakeholders: "",
  });

  function refresh() {
    setDecisions(getDecisions());
    setStats(getDecisionStats());
    setPatterns(getDecisionPatterns());
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAdd() {
    if (!newDecision.title) return;
    
    addDecision({
      ...newDecision,
      alternatives: newDecision.alternatives.split(",").map(s => s.trim()).filter(Boolean),
      stakeholders: newDecision.stakeholders.split(",").map(s => s.trim()).filter(Boolean),
      wouldRepeat: null,
    });
    
    refresh();
    setIsCreating(false);
    setNewDecision({
      title: "",
      description: "",
      category: "strategy",
      impact: "medium",
      expectedOutcome: "",
      context: "",
      alternatives: "",
      stakeholders: "",
    });
  }

  function handleReview(decisionId: string, wouldRepeat: boolean) {
    updateDecision(decisionId, {
      wouldRepeat,
      reviewedAt: new Date().toISOString(),
    });
    refresh();
  }

  function handleStatusChange(decisionId: string, status: DecisionStatus) {
    updateDecision(decisionId, { status });
    refresh();
  }

  const filteredDecisions = filter === "all" 
    ? decisions 
    : decisions.filter(d => d.category === filter);

  // Detail view
  if (selectedDecision) {
    const StatusIcon = STATUS_ICONS[selectedDecision.status];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedDecision(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-neutral-100">Decision</h2>
              <p className="text-sm text-neutral-500">{new Date(selectedDecision.decidedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { deleteDecision(selectedDecision.id); refresh(); setSelectedDecision(null); }} className="text-red-400">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${CATEGORY_COLORS[selectedDecision.category]}`}>{selectedDecision.category}</span>
              <span className="text-neutral-600">•</span>
              <span className={`text-sm ${IMPACT_COLORS[selectedDecision.impact]}`}>{selectedDecision.impact} impact</span>
              <span className="text-neutral-600">•</span>
              <StatusIcon className={`w-4 h-4 ${selectedDecision.status === "implemented" ? "text-emerald-400" : selectedDecision.status === "pending" ? "text-amber-400" : "text-red-400"}`} />
            </div>

            <h3 className="text-lg font-bold text-neutral-200">{selectedDecision.title}</h3>
            <p className="text-sm text-neutral-300">{selectedDecision.description}</p>

            <Separator className="bg-neutral-800" />

            <div>
              <div className="text-xs text-neutral-500 mb-1">Expected Outcome</div>
              <p className="text-sm text-neutral-300">{selectedDecision.expectedOutcome}</p>
            </div>

            {selectedDecision.actualOutcome && (
              <div>
                <div className="text-xs text-neutral-500 mb-1">Actual Outcome</div>
                <p className="text-sm text-neutral-300">{selectedDecision.actualOutcome}</p>
              </div>
            )}

            {selectedDecision.lessonsLearned && (
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-3">
                <div className="text-xs text-amber-400 mb-1">Lessons Learned</div>
                <p className="text-sm text-amber-400/80">{selectedDecision.lessonsLearned}</p>
              </div>
            )}

            {selectedDecision.wouldRepeat !== null && (
              <div className={`rounded-lg p-3 ${selectedDecision.wouldRepeat ? "bg-emerald-950/20 border border-emerald-900/30" : "bg-red-950/20 border border-red-900/30"}`}>
                <div className={`text-sm ${selectedDecision.wouldRepeat ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedDecision.wouldRepeat ? "Would make this decision again" : "Would not repeat this decision"}
                </div>
              </div>
            )}

            <Separator className="bg-neutral-800" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Context</div>
                <p className="text-neutral-300">{selectedDecision.context}</p>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Stakeholders</div>
                <p className="text-neutral-300">{selectedDecision.stakeholders.join(", ") || "None"}</p>
              </div>
            </div>

            {selectedDecision.alternatives.length > 0 && (
              <div>
                <div className="text-xs text-neutral-500 mb-1">Alternatives Considered</div>
                <ul className="text-sm text-neutral-300 space-y-1">
                  {selectedDecision.alternatives.map((alt, i) => (
                    <li key={i}>• {alt}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedDecision.status === "implemented" && selectedDecision.wouldRepeat === null && (
              <div className="flex gap-2">
                <Button onClick={() => handleReview(selectedDecision.id, true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Would Repeat
                </Button>
                <Button onClick={() => handleReview(selectedDecision.id, false)} variant="outline" className="flex-1 border-red-900/30 text-red-400 hover:bg-red-950/20">
                  <XCircle className="w-4 h-4 mr-2" />
                  Wouldn't Repeat
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              {selectedDecision.status === "pending" && (
                <Button onClick={() => handleStatusChange(selectedDecision.id, "implemented")} className="flex-1">
                  Mark Implemented
                </Button>
              )}
              {selectedDecision.status !== "reversed" && selectedDecision.status !== "cancelled" && (
                <Button onClick={() => handleStatusChange(selectedDecision.id, "reversed")} variant="outline" className="border-red-900/30">
                  Reverse Decision
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create view
  if (isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">New Decision</h2>
            <p className="text-sm text-neutral-500">Document a key decision</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-5 space-y-4">
            <Input
              value={newDecision.title}
              onChange={e => setNewDecision({ ...newDecision, title: e.target.value })}
              placeholder="Decision title..."
              className="bg-neutral-950 border-neutral-800"
            />
            
            <textarea
              value={newDecision.description}
              onChange={e => setNewDecision({ ...newDecision, description: e.target.value })}
              placeholder="Describe the decision..."
              className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 placeholder:text-neutral-600 resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={newDecision.category}
                onChange={e => setNewDecision({ ...newDecision, category: e.target.value as DecisionCategory })}
                className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-200"
              >
                <option value="product">Product</option>
                <option value="hiring">Hiring</option>
                <option value="funding">Funding</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="strategy">Strategy</option>
                <option value="operations">Operations</option>
                <option value="personal">Personal</option>
              </select>
              
              <select
                value={newDecision.impact}
                onChange={e => setNewDecision({ ...newDecision, impact: e.target.value as DecisionImpact })}
                className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-neutral-200"
              >
                <option value="low">Low Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="high">High Impact</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <Input
              value={newDecision.expectedOutcome}
              onChange={e => setNewDecision({ ...newDecision, expectedOutcome: e.target.value })}
              placeholder="Expected outcome..."
              className="bg-neutral-950 border-neutral-800"
            />

            <Input
              value={newDecision.context}
              onChange={e => setNewDecision({ ...newDecision, context: e.target.value })}
              placeholder="Context (what was happening at the time)..."
              className="bg-neutral-950 border-neutral-800"
            />

            <Input
              value={newDecision.alternatives}
              onChange={e => setNewDecision({ ...newDecision, alternatives: e.target.value })}
              placeholder="Alternatives considered (comma-separated)..."
              className="bg-neutral-950 border-neutral-800"
            />

            <Input
              value={newDecision.stakeholders}
              onChange={e => setNewDecision({ ...newDecision, stakeholders: e.target.value })}
              placeholder="Stakeholders involved (comma-separated)..."
              className="bg-neutral-950 border-neutral-800"
            />

            <Button onClick={handleAdd} disabled={!newDecision.title} className="w-full bg-blue-600 hover:bg-blue-500">
              <Plus className="w-4 h-4 mr-2" />
              Log Decision
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Decision Journal</h2>
            <p className="text-sm text-neutral-500">Track decisions and learn from outcomes</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-500">
          <Plus className="w-4 h-4 mr-2" />
          Log Decision
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-neutral-300">{stats.total}</div>
          <div className="text-xs text-neutral-600">Total Decisions</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{stats.repeatRate}%</div>
          <div className="text-xs text-neutral-600">Repeat Rate</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{stats.pendingReview}</div>
          <div className="text-xs text-neutral-600">Need Review</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-400">{stats.highImpactPending}</div>
          <div className="text-xs text-neutral-600">Critical Pending</div>
        </div>
      </div>

      {/* Patterns */}
      {patterns.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Decision Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patterns.slice(0, 3).map(p => (
                <div key={p.category} className="flex items-center justify-between">
                  <span className={`text-sm ${CATEGORY_COLORS[p.category]}`}>{p.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${p.repeatRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-8">{p.repeatRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            filter === "all" ? "border-blue-400/40 text-blue-400 bg-blue-400/10" : "border-neutral-800 text-neutral-600"
          }`}
        >
          All
        </button>
        {(Object.keys(CATEGORY_COLORS) as DecisionCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${
              filter === cat ? "border-blue-400/40 text-blue-400 bg-blue-400/10" : "border-neutral-800 text-neutral-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Decisions List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-3 pr-4">
          {filteredDecisions.length === 0 ? (
            <div className="text-center py-12 text-neutral-600">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No decisions logged yet</p>
            </div>
          ) : (
            filteredDecisions.map(decision => {
              const StatusIcon = STATUS_ICONS[decision.status];
              return (
                <Card
                  key={decision.id}
                  className={`bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors ${
                    decision.impact === "critical" ? "border-l-2 border-l-red-500" : ""
                  }`}
                  onClick={() => setSelectedDecision(decision)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`w-5 h-5 mt-0.5 ${
                        decision.status === "implemented" ? "text-emerald-400" : 
                        decision.status === "pending" ? "text-amber-400" : "text-red-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-neutral-200 truncate">{decision.title}</span>
                          <span className={`text-xs ${IMPACT_COLORS[decision.impact]}`}>{decision.impact}</span>
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{decision.description}</p>
                        <div className="flex items-center gap-3 text-xs text-neutral-600">
                          <span className={CATEGORY_COLORS[decision.category]}>{decision.category}</span>
                          <span>•</span>
                          <span>{new Date(decision.decidedAt).toLocaleDateString()}</span>
                          {decision.wouldRepeat !== null && (
                            <>
                              <span>•</span>
                              <span className={decision.wouldRepeat ? "text-emerald-400" : "text-red-400"}>
                                {decision.wouldRepeat ? "Would repeat" : "Wouldn't repeat"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

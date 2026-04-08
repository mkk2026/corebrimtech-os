"use client";

import { useState, useEffect } from "react";
import { Scan, TrendingUp, MessageSquare, Target, Lightbulb, AlertCircle, ChevronLeft, Filter, Plus, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getMarketGaps,
  getMarketGapStats,
  initializeMarketGaps,
  getHighOpportunityGaps,
  updateMarketGap,
  deleteMarketGap,
  type MarketGap,
  type GapCategory,
  type GapUrgency,
} from "@/lib/market-gap-scanner";

interface MarketGapScannerProps {
  onBack?: () => void;
}

const CATEGORY_ICONS: Record<GapCategory, typeof Lightbulb> = {
  feature_request: Lightbulb,
  pain_point: AlertCircle,
  unmet_need: Target,
  competitor_weakness: TrendingUp,
  trend: TrendingUp,
};

const CATEGORY_LABELS: Record<GapCategory, string> = {
  feature_request: "Feature Request",
  pain_point: "Pain Point",
  unmet_need: "Unmet Need",
  competitor_weakness: "Competitor Weakness",
  trend: "Trend",
};

const URGENCY_COLORS: Record<GapUrgency, string> = {
  emerging: "text-blue-400",
  growing: "text-amber-400",
  mature: "text-emerald-400",
  saturated: "text-neutral-500",
};

const SOURCE_ICONS: Record<MarketGap["source"], string> = {
  twitter: "🐦",
  reddit: "📱",
  hackernews: "🟠",
  linkedin: "💼",
  producthunt: "🚀",
  manual: "✏️",
};

export default function MarketGapScanner({ onBack }: MarketGapScannerProps) {
  const [gaps, setGaps] = useState<MarketGap[]>([]);
  const [stats, setStats] = useState(getMarketGapStats());
  const [selectedGap, setSelectedGap] = useState<MarketGap | null>(null);
  const [filter, setFilter] = useState<GapCategory | "all">("all");
  const [showRelatedOnly, setShowRelatedOnly] = useState(false);
  const [highOpportunities, setHighOpportunities] = useState<MarketGap[]>([]);

  useEffect(() => {
    initializeMarketGaps();
    refresh();
  }, []);

  function refresh() {
    setGaps(getMarketGaps(showRelatedOnly));
    setStats(getMarketGapStats());
    setHighOpportunities(getHighOpportunityGaps());
  }

  function handleMarkAsActioned(gapId: string) {
    updateMarketGap(gapId, { actionTaken: "Reviewed and prioritized" });
    refresh();
  }

  function handleDelete(gapId: string) {
    if (confirm("Delete this market gap?")) {
      deleteMarketGap(gapId);
      refresh();
      setSelectedGap(null);
    }
  }

  const filteredGaps = gaps.filter(g => filter === "all" || g.category === filter);

  // Detail view
  if (selectedGap) {
    const CategoryIcon = CATEGORY_ICONS[selectedGap.category];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedGap(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Market Gap</h2>
            <p className="text-sm text-neutral-500">{CATEGORY_LABELS[selectedGap.category]}</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center ${
                selectedGap.fitScore >= 80 ? "text-emerald-400" :
                selectedGap.fitScore >= 60 ? "text-amber-400" : "text-neutral-400"
              }`}>
                <CategoryIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-2xl font-bold ${
                    selectedGap.fitScore >= 80 ? "text-emerald-400" :
                    selectedGap.fitScore >= 60 ? "text-amber-400" : "text-neutral-400"
                  }`}>
                    {selectedGap.fitScore}%
                  </span>
                  <span className="text-sm text-neutral-500">fit for Core Brim Tech</span>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs ${URGENCY_COLORS[selectedGap.urgency]}`}>
                    {selectedGap.urgency}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {SOURCE_ICONS[selectedGap.source]} {selectedGap.source}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-neutral-200">{selectedGap.title}</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">{selectedGap.description}</p>

            <div className="bg-neutral-950 rounded-lg p-3">
              <div className="text-xs text-neutral-500 mb-2">Evidence</div>
              <ul className="space-y-2">
                {selectedGap.evidence.map((item, i) => (
                  <li key={i} className="text-sm text-neutral-400 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-neutral-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedGap.keywords.map(keyword => (
                <span key={keyword} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded">
                  {keyword}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-950 rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-1">Discussion Volume</div>
                <div className="text-lg font-bold text-neutral-300">{selectedGap.volume}/100</div>
                <div className="h-2 bg-neutral-800 rounded-full mt-2">
                  <div 
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${selectedGap.volume}%` }}
                  />
                </div>
              </div>
              <div className="bg-neutral-950 rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-1">Sentiment</div>
                <div className={`text-lg font-bold capitalize ${
                  selectedGap.sentiment === "frustrated" ? "text-red-400" :
                  selectedGap.sentiment === "hopeful" ? "text-emerald-400" : "text-neutral-400"
                }`}>
                  {selectedGap.sentiment}
                </div>
              </div>
            </div>

            {selectedGap.actionTaken ? (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
                <div className="text-xs text-emerald-400 mb-1">Action Taken</div>
                <p className="text-sm text-emerald-400/80">{selectedGap.actionTaken}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleMarkAsActioned(selectedGap.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Reviewed
                </Button>
                <Button 
                  onClick={() => handleDelete(selectedGap.id)}
                  variant="ghost"
                  className="text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
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
            <h2 className="text-xl font-bold text-neutral-100">Market Gap Scanner</h2>
            <p className="text-sm text-neutral-500">Find opportunities from real user pain points</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Gaps", value: stats.total, color: "text-neutral-300" },
          { label: "Related to You", value: stats.relatedToProduct, color: "text-blue-400" },
          { label: "High Fit", value: stats.highFit, color: "text-emerald-400" },
          { label: "Pain Points", value: stats.byCategory.pain_point, color: "text-red-400" },
          { label: "Opportunities", value: stats.byCategory.unmet_need, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-neutral-600">{label}</div>
          </div>
        ))}
      </div>

      {/* High Opportunity Gaps */}
      {highOpportunities.length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-950/30 to-blue-950/30 border-emerald-900/30">
          <CardHeader>
            <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
              <Scan className="w-4 h-4" />
              High Opportunity Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {highOpportunities.slice(0, 3).map(gap => (
              <div
                key={gap.id}
                onClick={() => setSelectedGap(gap)}
                className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-lg cursor-pointer hover:bg-neutral-950 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-200 truncate">{gap.title}</div>
                  <div className="text-xs text-neutral-500">{CATEGORY_LABELS[gap.category]} · {gap.urgency}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-lg font-bold text-emerald-400">{gap.fitScore}%</div>
                </div>
              </div>
            ))}
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
        {(Object.keys(CATEGORY_LABELS) as GapCategory[]).map(cat => {
          const Icon = CATEGORY_ICONS[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                filter === cat ? "border-blue-400/40 text-blue-400 bg-blue-400/10" : "border-neutral-800 text-neutral-600"
              }`}
            >
              <Icon className="w-3 h-3" />
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
        <button
          onClick={() => { setShowRelatedOnly(!showRelatedOnly); refresh(); }}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            showRelatedOnly ? "border-emerald-400/40 text-emerald-400 bg-emerald-400/10" : "border-neutral-800 text-neutral-600"
          }`}
        >
          Related to Product
        </button>
      </div>

      {/* Gap List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-3 pr-4">
          {filteredGaps.length === 0 ? (
            <div className="text-center py-12 text-neutral-600">
              <Scan className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No gaps found. Try adjusting filters.</p>
            </div>
          ) : (
            filteredGaps.map(gap => {
              const CategoryIcon = CATEGORY_ICONS[gap.category];
              return (
                <Card
                  key={gap.id}
                  className={`bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors ${
                    gap.actionTaken ? "opacity-60" : ""
                  }`}
                  onClick={() => setSelectedGap(gap)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <CategoryIcon className={`w-5 h-5 ${
                          gap.fitScore >= 80 ? "text-emerald-400" :
                          gap.fitScore >= 60 ? "text-amber-400" : "text-neutral-400"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-neutral-200 truncate">{gap.title}</span>
                          {gap.actionTaken && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{gap.description}</p>
                        <div className="flex items-center gap-3 text-xs text-neutral-600">
                          <span>{SOURCE_ICONS[gap.source]} {gap.source}</span>
                          <span className={URGENCY_COLORS[gap.urgency]}>{gap.urgency}</span>
                          <span>Vol: {gap.volume}/100</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xl font-bold ${
                          gap.fitScore >= 80 ? "text-emerald-400" :
                          gap.fitScore >= 60 ? "text-amber-400" : "text-neutral-500"
                        }`}>
                          {gap.fitScore}%
                        </div>
                        <div className="text-xs text-neutral-600">fit</div>
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

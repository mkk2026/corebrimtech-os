"use client";

import { useState, useEffect } from "react";
import { Building2, ExternalLink, Target, DollarSign, MapPin, ChevronLeft, Filter, Star, Globe, Mail, Rocket, Leaf, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getInvestors, 
  getInvestorStats, 
  getTopOpportunities,
  type Investor, 
  type InvestorType,
} from "@/lib/investor-db";
import { getBrain } from "@/lib/founder-brain";

interface InvestorDatabaseProps {
  onBack?: () => void;
}

const TYPE_ICONS: Record<InvestorType, typeof Building2> = {
  vc: Building2,
  angel: Star,
  accelerator: Rocket,
  grant: DollarSign,
  impact: Leaf,
  corporate: Briefcase,
};

const TYPE_LABELS: Record<InvestorType, string> = {
  vc: "Venture Capital",
  angel: "Angel Investor",
  accelerator: "Accelerator",
  grant: "Grant / Non-Dilutive",
  impact: "Impact Investor",
  corporate: "Corporate VC",
};

export default function InvestorDatabase({ onBack }: InvestorDatabaseProps) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [stats, setStats] = useState(getInvestorStats());
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [filter, setFilter] = useState<InvestorType | "all">("all");
  const [showHighFitOnly, setShowHighFitOnly] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    const brain = getBrain();
    const profile = brain ? {
      stage: brain.stage?.toLowerCase().includes("seed") ? "seed" : 
             brain.stage?.toLowerCase().includes("pre") ? "pre-seed" : "seed",
      sector: undefined,
      location: brain.location,
      hasRevenue: (brain.products[0]?.mrr || 0) > 0,
    } : undefined;
    
    setInvestors(getInvestors(profile));
    setStats(getInvestorStats());
  }

  const filtered = investors.filter(inv => {
    if (filter !== "all" && inv.type !== filter) return false;
    if (showHighFitOnly && inv.fitScore < 70) return false;
    return true;
  });

  const topOpportunities = getTopOpportunities();

  // Detail view
  if (selectedInvestor) {
    const TypeIcon = TYPE_ICONS[selectedInvestor.type];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedInvestor(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">{selectedInvestor.name}</h2>
            <p className="text-sm text-neutral-500">{TYPE_LABELS[selectedInvestor.type]}</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-950 flex items-center justify-center flex-shrink-0">
                <TypeIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-2xl font-bold ${
                    selectedInvestor.fitScore >= 80 ? "text-emerald-400" :
                    selectedInvestor.fitScore >= 60 ? "text-amber-400" : "text-neutral-400"
                  }`}>
                    {selectedInvestor.fitScore}%
                  </span>
                  <span className="text-sm text-neutral-500">fit for Core Brim Tech</span>
                </div>
                <p className="text-sm text-neutral-400">{selectedInvestor.fitReason}</p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">{selectedInvestor.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-950 rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-1">Stages</div>
                <div className="text-sm text-neutral-300 capitalize">
                  {selectedInvestor.stages.join(" · ")}
                </div>
              </div>
              <div className="bg-neutral-950 rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-1">Check Size</div>
                <div className="text-sm text-neutral-300">
                  {selectedInvestor.checkSizes.join(" · ")}
                </div>
              </div>
            </div>

            <div className="bg-neutral-950 rounded-lg p-3">
              <div className="text-xs text-neutral-500 mb-2">Sectors</div>
              <div className="flex flex-wrap gap-2">
                {selectedInvestor.sectors.map(sector => (
                  <span key={sector} className="text-xs bg-neutral-900 text-neutral-400 px-2 py-1 rounded">
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-neutral-950 rounded-lg p-3">
              <div className="text-xs text-neutral-500 mb-1">Investment Thesis</div>
              <p className="text-sm text-neutral-300">{selectedInvestor.thesis}</p>
            </div>

            {selectedInvestor.notableInvestments.length > 0 && (
              <div className="bg-neutral-950 rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-2">Notable Investments</div>
                <div className="flex flex-wrap gap-2">
                  {selectedInvestor.notableInvestments.map(inv => (
                    <span key={inv} className="text-xs text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded">
                      {inv}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedInvestor.requirements.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-3">
                <div className="text-xs text-amber-400 mb-2">Requirements</div>
                <ul className="text-sm text-amber-400/80 space-y-1">
                  {selectedInvestor.requirements.map((req, i) => (
                    <li key={i}>• {req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {selectedInvestor.applicationUrl && (
                <a 
                  href={selectedInvestor.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-500">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                </a>
              )}
              {selectedInvestor.contactEmail && (
                <a 
                  href={`mailto:${selectedInvestor.contactEmail}`}
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-neutral-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </a>
              )}
            </div>
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
            <h2 className="text-xl font-bold text-neutral-100">Investor Database</h2>
            <p className="text-sm text-neutral-500">{stats.total} investors for African startups</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "VCs", value: stats.byType.vc, color: "text-blue-400" },
          { label: "Accelerators", value: stats.byType.accelerator, color: "text-purple-400" },
          { label: "Grants", value: stats.byType.grant, color: "text-emerald-400" },
          { label: "Impact", value: stats.byType.impact, color: "text-amber-400" },
          { label: "Open Now", value: stats.openForApplications, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-neutral-600">{label}</div>
          </div>
        ))}
      </div>

      {/* Top Opportunities */}
      {topOpportunities.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-950/50 to-emerald-950/50 border-blue-900/30">
          <CardHeader>
            <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Top Opportunities for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topOpportunities.slice(0, 3).map(inv => (
              <div 
                key={inv.id}
                onClick={() => setSelectedInvestor(inv)}
                className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-lg cursor-pointer hover:bg-neutral-950 transition-colors"
              >
                <div>
                  <div className="font-medium text-neutral-200">{inv.name}</div>
                  <div className="text-xs text-neutral-500">{TYPE_LABELS[inv.type]}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">{inv.fitScore}%</div>
                  <div className="text-xs text-neutral-600">fit</div>
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
        {(Object.keys(TYPE_ICONS) as InvestorType[]).map(type => {
          const Icon = TYPE_ICONS[type];
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                filter === type ? "border-blue-400/40 text-blue-400 bg-blue-400/10" : "border-neutral-800 text-neutral-600"
              }`}
            >
              <Icon className="w-3 h-3" />
              {TYPE_LABELS[type]}
            </button>
          );
        })}
        <button
          onClick={() => setShowHighFitOnly(!showHighFitOnly)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            showHighFitOnly ? "border-emerald-400/40 text-emerald-400 bg-emerald-400/10" : "border-neutral-800 text-neutral-600"
          }`}
        >
          High Fit Only (70%+)
        </button>
      </div>

      {/* Investor List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-3 pr-4">
          {filtered.map(investor => {
            const TypeIcon = TYPE_ICONS[investor.type];
            return (
              <Card 
                key={investor.id}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                onClick={() => setSelectedInvestor(investor)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-200">{investor.name}</span>
                        {investor.openForApplications && (
                          <span className="text-xs bg-emerald-950/30 text-emerald-400 px-2 py-0.5 rounded">
                            Open
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{investor.description}</p>
                      <div className="flex items-center gap-3 text-xs text-neutral-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {investor.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {investor.checkSizes[0]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xl font-bold ${
                        investor.fitScore >= 80 ? "text-emerald-400" :
                        investor.fitScore >= 60 ? "text-amber-400" : "text-neutral-500"
                      }`}>
                        {investor.fitScore}%
                      </div>
                      <div className="text-xs text-neutral-600">fit</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

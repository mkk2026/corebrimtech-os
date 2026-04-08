"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Plus, Trash2, DollarSign, AlertCircle, ChevronRight, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDeals,
  getPipelineStats,
  addDeal,
  updateDeal,
  deleteDeal,
  moveDealStage,
  getDealsNeedingAttention,
  initializeSampleDeals,
  STAGE_CONFIG,
  type Deal,
  type DealStage,
} from "@/lib/deal-pipeline";

const STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];

export default function DealPipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState(getPipelineStats());
  const [needsAttention, setNeedsAttention] = useState<Deal[]>([]);
  const [selectedStage, setSelectedStage] = useState<DealStage | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDeal, setNewDeal] = useState({ company: "", contactName: "", value: "", stage: "lead" as DealStage });

  useEffect(() => {
    initializeSampleDeals();
    refresh();
  }, []);

  function refresh() {
    setDeals(getDeals());
    setStats(getPipelineStats());
    setNeedsAttention(getDealsNeedingAttention());
  }

  function handleAdd() {
    if (!newDeal.company || !newDeal.contactName) return;
    addDeal({
      company: newDeal.company,
      contactName: newDeal.contactName,
      value: Number(newDeal.value) || 0,
      stage: newDeal.stage,
      source: "outbound",
      probability: STAGE_CONFIG[newDeal.stage].probability,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "",
      tags: [],
    });
    refresh();
    setIsAdding(false);
    setNewDeal({ company: "", contactName: "", value: "", stage: "lead" });
  }

  function handleMoveDeal(dealId: string, newStage: DealStage) {
    moveDealStage(dealId, newStage);
    refresh();
  }

  const filteredDeals = selectedStage ? deals.filter(d => d.stage === selectedStage) : deals;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-neutral-100">Deal Pipeline</h2>
        <p className="text-sm text-neutral-500">Track leads from first contact to closed deal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-neutral-300">{stats.totalDeals}</div>
          <div className="text-xs text-neutral-600">Active Deals</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">${(stats.totalValue / 1000).toFixed(0)}k</div>
          <div className="text-xs text-neutral-600">Pipeline Value</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.winRate}%</div>
          <div className="text-xs text-neutral-600">Win Rate</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{stats.avgDealSize > 0 ? `$${(stats.avgDealSize / 1000).toFixed(0)}k` : "-"}</div>
          <div className="text-xs text-neutral-600">Avg Deal</div>
        </div>
      </div>

      {/* Attention Needed */}
      {needsAttention.length > 0 && (
        <Card className="bg-red-950/20 border-red-900/30">
          <CardHeader>
            <CardTitle className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Needs Attention ({needsAttention.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {needsAttention.slice(0, 3).map(deal => (
              <div key={deal.id} className="flex items-center justify-between p-2 bg-neutral-950/50 rounded">
                <span className="text-sm text-neutral-300">{deal.company}</span>
                <span className="text-xs text-neutral-500">No contact for 7+ days</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pipeline Stages */}
      <div className="grid grid-cols-6 gap-2">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
          const isSelected = selectedStage === stage;
          
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(isSelected ? null : stage)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected 
                  ? "border-blue-400/40 bg-blue-400/10" 
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className={`text-xs ${STAGE_CONFIG[stage].color} mb-1`}>{STAGE_CONFIG[stage].label}</div>
              <div className="text-lg font-bold text-neutral-200">{stageDeals.length}</div>
              <div className="text-xs text-neutral-600">${(stageValue / 1000).toFixed(0)}k</div>
            </button>
          );
        })}
      </div>

      {/* Add Deal */}
      {isAdding ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Company name"
              value={newDeal.company}
              onChange={e => setNewDeal({ ...newDeal, company: e.target.value })}
              className="bg-neutral-950 border-neutral-800"
            />
            <Input
              placeholder="Contact name"
              value={newDeal.contactName}
              onChange={e => setNewDeal({ ...newDeal, contactName: e.target.value })}
              className="bg-neutral-950 border-neutral-800"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Deal value"
                value={newDeal.value}
                onChange={e => setNewDeal({ ...newDeal, value: e.target.value })}
                className="bg-neutral-950 border-neutral-800"
              />
              <select
                value={newDeal.stage}
                onChange={e => setNewDeal({ ...newDeal, stage: e.target.value as DealStage })}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 text-sm text-neutral-200"
              >
                {STAGES.filter(s => s !== "closed_won" && s !== "closed_lost").map(stage => (
                  <option key={stage} value={stage}>{STAGE_CONFIG[stage].label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1 bg-blue-600">Add Deal</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      )}

      {/* Deals List */}
      <div className="space-y-2">
        {filteredDeals.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost").map(deal => (
          <Card key={deal.id} className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-200">{deal.company}</span>
                    <span className={`text-xs ${STAGE_CONFIG[deal.stage].color}`}>{STAGE_CONFIG[deal.stage].label}</span>
                  </div>
                  <div className="text-sm text-neutral-500">{deal.contactName}</div>
                  <div className="text-xs text-neutral-600 mt-1">${deal.value.toLocaleString()} • {deal.probability}% probability</div>
                </div>
                <div className="flex gap-1">
                  {deal.stage !== "negotiation" && (
                    <Button size="sm" variant="ghost" onClick={() => handleMoveDeal(deal.id, STAGES[STAGES.indexOf(deal.stage) + 1] as DealStage)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { deleteDeal(deal.id); refresh(); }} className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs border-emerald-900/30 text-emerald-400" onClick={() => handleMoveDeal(deal.id, "closed_won")}>
                  Won
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-red-900/30 text-red-400" onClick={() => handleMoveDeal(deal.id, "closed_lost")}>
                  Lost
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

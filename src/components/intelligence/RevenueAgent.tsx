"use client";

import { useState, useEffect } from "react";
import { Bot, Play, Pause, Settings, Plus, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Target, Zap, Search, Mail, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getAgentConfig,
  updateAgentConfig,
  getAgentTasks,
  getOpportunities,
  getAgentStats,
  runRevenueAgent,
  toggleAgent,
  simulateOpportunityScan,
  simulateLeadQualification,
  type AgentTask,
  type Opportunity,
} from "@/lib/revenue-agent";

const TASK_ICONS: Record<AgentTask["type"], typeof Search> = {
  scan_opportunities: Search,
  qualify_lead: Target,
  draft_outreach: Mail,
  follow_up: Clock,
  generate_proposal: FileText,
};

const TASK_LABELS: Record<AgentTask["type"], string> = {
  scan_opportunities: "Scanning for opportunities",
  qualify_lead: "Qualifying lead",
  draft_outreach: "Drafting outreach",
  follow_up: "Following up",
  generate_proposal: "Generating proposal",
};

export default function RevenueAgent() {
  const [config, setConfig] = useState(getAgentConfig());
  const [stats, setStats] = useState(getAgentStats());
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  function refresh() {
    setConfig(getAgentConfig());
    setStats(getAgentStats());
    setTasks(getAgentTasks());
    setOpportunities(getOpportunities());
  }

  async function handleToggle() {
    const newState = toggleAgent();
    refresh();
    if (newState) {
      setIsRunning(true);
      await runRevenueAgent();
      setIsRunning(false);
      refresh();
    }
  }

  async function handleScan() {
    setIsRunning(true);
    simulateOpportunityScan();
    await new Promise(r => setTimeout(r, 1500));
    setIsRunning(false);
    refresh();
  }

  function handleQualify(oppId: string) {
    simulateLeadQualification(oppId);
    refresh();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-100">Revenue Agent</h2>
          <p className="text-sm text-neutral-500">24/7 AI working for you</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleToggle}
            className={config.enabled ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"}
          >
            {config.enabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {config.enabled ? "Pause Agent" : "Start Agent"}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${config.enabled ? "border-emerald-500/30 bg-emerald-950/10" : "border-neutral-800"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.enabled ? "bg-emerald-500/20" : "bg-neutral-800"}`}>
                <Bot className={`w-6 h-6 ${config.enabled ? "text-emerald-400" : "text-neutral-500"}`} />
              </div>
              <div>
                <div className="font-medium text-neutral-200">
                  {config.enabled ? "Agent is running" : "Agent is paused"}
                </div>
                <div className="text-sm text-neutral-500">
                  {config.enabled 
                    ? `Completed ${stats.completedToday} tasks today` 
                    : "Start the agent to begin automation"}
                </div>
              </div>
            </div>
            {config.enabled && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm text-emerald-400">Live</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.totalOpportunities}</div>
          <div className="text-xs text-neutral-600">Opportunities</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">${(stats.potentialValue / 1000).toFixed(0)}k</div>
          <div className="text-xs text-neutral-600">Pipeline</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{stats.avgFitScore}</div>
          <div className="text-xs text-neutral-600">Avg Fit</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{stats.pendingTasks}</div>
          <div className="text-xs text-neutral-600">Pending</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button onClick={handleScan} disabled={isRunning} variant="outline" className="flex-1 border-neutral-700">
          <Search className="w-4 h-4 mr-2" />
          {isRunning ? "Scanning..." : "Scan Now"}
        </Button>
        <Button onClick={() => {}} variant="outline" className="flex-1 border-neutral-700">
          <Zap className="w-4 h-4 mr-2" />
          Run All Tasks
        </Button>
      </div>

      {/* Settings */}
      {showSettings && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Agent Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Auto-qualify leads</span>
              <button
                onClick={() => { updateAgentConfig({ autoQualify: !config.autoQualify }); refresh(); }}
                className={`w-12 h-6 rounded-full transition-colors ${config.autoQualify ? "bg-emerald-500" : "bg-neutral-700"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.autoQualify ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Auto-draft outreach</span>
              <button
                onClick={() => { updateAgentConfig({ autoDraft: !config.autoDraft }); refresh(); }}
                className={`w-12 h-6 rounded-full transition-colors ${config.autoDraft ? "bg-emerald-500" : "bg-neutral-700"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.autoDraft ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Auto-follow up</span>
              <button
                onClick={() => { updateAgentConfig({ autoFollowUp: !config.autoFollowUp }); refresh(); }}
                className={`w-12 h-6 rounded-full transition-colors ${config.autoFollowUp ? "bg-emerald-500" : "bg-neutral-700"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.autoFollowUp ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            <div>
              <span className="text-sm text-neutral-300">Min deal value: ${config.minDealValue}</span>
              <input 
                type="range" 
                min="1000" 
                max="100000" 
                step="1000"
                value={config.minDealValue}
                onChange={e => { updateAgentConfig({ minDealValue: Number(e.target.value) }); refresh(); }}
                className="w-full mt-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Tasks */}
      {tasks.filter(t => t.status === "running" || t.status === "pending").length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.filter(t => t.status === "running" || t.status === "pending").slice(0, 5).map(task => {
              const Icon = TASK_ICONS[task.type];
              return (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-neutral-950 rounded">
                  <Icon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-neutral-300 flex-1">{TASK_LABELS[task.type]}</span>
                  <span className={`text-xs ${task.status === "running" ? "text-amber-400" : "text-neutral-500"}`}>
                    {task.status === "running" ? "Running..." : "Queued"}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-neutral-400">Discovered Opportunities</CardTitle>
          <span className="text-xs text-neutral-500">{opportunities.length} total</span>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {opportunities.length === 0 ? (
                <div className="text-center py-8 text-neutral-600">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No opportunities yet</p>
                  <p className="text-xs">Start the agent or click Scan Now</p>
                </div>
              ) : (
                opportunities.map(opp => (
                  <div key={opp.id} className={`p-3 rounded-lg border ${
                    opp.status === "new" ? "border-blue-900/30 bg-blue-950/10" :
                    opp.status === "qualified" ? "border-emerald-900/30 bg-emerald-950/10" :
                    "border-neutral-800"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-200">{opp.title}</span>
                          <span className={`text-xs ${
                            opp.fitScore >= 80 ? "text-emerald-400" :
                            opp.fitScore >= 60 ? "text-amber-400" : "text-neutral-500"
                          }`}>
                            {opp.fitScore}% fit
                          </span>
                        </div>
                        <div className="text-sm text-neutral-500">{opp.company || opp.source}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600">
                          <span>${opp.estimatedValue.toLocaleString()}</span>
                          <span className={`capitalize ${
                            opp.urgency === "high" ? "text-red-400" :
                            opp.urgency === "medium" ? "text-amber-400" : "text-neutral-500"
                          }`}>
                            {opp.urgency} urgency
                          </span>
                        </div>
                      </div>
                      {opp.status === "new" && (
                        <Button size="sm" onClick={() => handleQualify(opp.id)}>
                          Qualify
                        </Button>
                      )}
                      {opp.status === "qualified" && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

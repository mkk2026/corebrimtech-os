"use client";

import { useState, useEffect } from "react";
import { Bot, Plus, Send, UserPlus, MessageSquare, Target, TrendingUp, Clock, Check, X, ChevronLeft, Sparkles, Copy, Trash2, RefreshCw, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getOutreachLeads,
  getOutreachStats,
  addOutreachLead,
  updateOutreachLead,
  deleteOutreachLead,
  convertLeadToClient,
  generateOutreachMessage,
  analyzeLeadFit,
  getLeadsReadyForAction,
  scheduleOutreachBatch,
  markMessagesAsSent,
  type OutreachLead,
  type OutreachStatus,
  type OutreachSource,
} from "@/lib/autonomous-outreach";

interface AutonomousOutreachProps {
  onBack?: () => void;
}

const STATUS_COLORS: Record<OutreachStatus, string> = {
  discovered: "text-neutral-400",
  qualified: "text-blue-400",
  message_drafted: "text-amber-400",
  sent: "text-purple-400",
  responded: "text-emerald-400",
  converted: "text-emerald-400",
  rejected: "text-red-400",
};

const STATUS_LABELS: Record<OutreachStatus, string> = {
  discovered: "Discovered",
  qualified: "Qualified",
  message_drafted: "Drafted",
  sent: "Sent",
  responded: "Responded",
  converted: "Converted",
  rejected: "Rejected",
};

const SOURCE_ICONS: Record<OutreachSource, string> = {
  linkedin: "💼",
  twitter: "🐦",
  reddit: "📱",
  hackernews: "🟠",
  manual: "✏️",
  ai_discovered: "🤖",
};

export default function AutonomousOutreach({ onBack }: AutonomousOutreachProps) {
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [stats, setStats] = useState(getOutreachStats());
  const [selectedLead, setSelectedLead] = useState<OutreachLead | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [filter, setFilter] = useState<OutreachStatus | "all">("all");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [readyForAction, setReadyForAction] = useState<OutreachLead[]>([]);
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    company: "",
    context: "",
    source: "manual" as OutreachSource,
  });

  useEffect(() => {
    refresh();
    const saved = localStorage.getItem("cbt_os_anthropic_key");
    if (saved) setApiKey(saved);
  }, []);

  function refresh() {
    setLeads(getOutreachLeads());
    setStats(getOutreachStats());
    setReadyForAction(getLeadsReadyForAction());
  }

  async function handleAddLead() {
    if (!newLeadForm.name.trim() || !newLeadForm.context.trim()) return;
    
    setLoading("analyzing");
    
    // AI analyzes the lead
    const analysis = await analyzeLeadFit(
      newLeadForm.name,
      newLeadForm.context,
      newLeadForm.source,
      apiKey
    );
    
    addOutreachLead({
      name: newLeadForm.name,
      company: newLeadForm.company,
      source: newLeadForm.source,
      context: newLeadForm.context,
      painPoints: analysis.painPoints,
      fitScore: analysis.fitScore,
      status: analysis.fitScore >= 60 ? "qualified" : "discovered",
      messageTone: (analysis.recommendedApproach as "casual" | "professional" | "warm") || "professional",
      contactMethod: "email",
    });
    
    setLoading(null);
    setShowAddLead(false);
    setNewLeadForm({ name: "", company: "", context: "", source: "manual" });
    refresh();
  }

  async function handleGenerateMessage(lead: OutreachLead) {
    setLoading(`msg_${lead.id}`);
    
    const message = await generateOutreachMessage(lead, apiKey);
    
    updateOutreachLead(lead.id, { 
      message,
      status: "message_drafted",
    });
    
    setLoading(null);
    refresh();
    setSelectedLead(null);
  }

  function handleConvertToClient(leadId: string) {
    const client = convertLeadToClient(leadId);
    if (client) {
      refresh();
      setSelectedLead(null);
    }
  }

  function handleMarkSent(leadId: string) {
    markMessagesAsSent([leadId]);
    refresh();
    setSelectedLead(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const filteredLeads = leads.filter(l => filter === "all" || l.status === filter);

  // Detail view
  if (selectedLead) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">{selectedLead.name}</h2>
            <p className="text-sm text-neutral-500">
              {selectedLead.company || "No company"} · {SOURCE_ICONS[selectedLead.source]} {selectedLead.source}
            </p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${
                selectedLead.fitScore >= 80 ? "text-emerald-400" :
                selectedLead.fitScore >= 60 ? "text-amber-400" : "text-neutral-400"
              }`}>
                {selectedLead.fitScore}%
              </div>
              <div>
                <div className="text-sm text-neutral-500">Fit Score</div>
                <div className={`text-sm ${STATUS_COLORS[selectedLead.status]}`}>
                  {STATUS_LABELS[selectedLead.status]}
                </div>
              </div>
            </div>

            <div className="bg-neutral-950 rounded-lg p-3">
              <div className="text-xs text-neutral-500 mb-1">Context</div>
              <p className="text-sm text-neutral-300">{selectedLead.context}</p>
            </div>

            <div className="bg-neutral-950 rounded-lg p-3">
              <div className="text-xs text-neutral-500 mb-2">Likely Pain Points</div>
              <div className="flex flex-wrap gap-2">
                {selectedLead.painPoints.map((point, i) => (
                  <span key={i} className="text-xs bg-neutral-900 text-neutral-400 px-2 py-1 rounded">
                    {point}
                  </span>
                ))}
              </div>
            </div>

            {selectedLead.message && (
              <div className="bg-neutral-950 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-neutral-500">Drafted Message</div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedLead.message!)} className="h-6 text-neutral-500">
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans">
                  {selectedLead.message}
                </pre>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {selectedLead.status === "discovered" || selectedLead.status === "qualified" ? (
                <Button 
                  onClick={() => handleGenerateMessage(selectedLead)}
                  disabled={loading === `msg_${selectedLead.id}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-500"
                >
                  {loading === `msg_${selectedLead.id}` ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Message</>
                  )}
                </Button>
              ) : selectedLead.status === "message_drafted" ? (
                <>
                  <Button onClick={() => handleMarkSent(selectedLead.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                    <Send className="w-4 h-4 mr-2" /> Mark as Sent
                  </Button>
                  <Button onClick={() => handleConvertToClient(selectedLead.id)} variant="outline" className="border-blue-600 text-blue-400">
                    <UserPlus className="w-4 h-4 mr-2" /> Convert to Client
                  </Button>
                </>
              ) : selectedLead.status === "responded" ? (
                <Button onClick={() => handleConvertToClient(selectedLead.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                  <Check className="w-4 h-4 mr-2" /> Convert to Client
                </Button>
              ) : null}
              
              <Button onClick={() => { deleteOutreachLead(selectedLead.id); refresh(); setSelectedLead(null); }} variant="ghost" className="text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main list view
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
            <h2 className="text-xl font-bold text-neutral-100">Autonomous Outreach</h2>
            <p className="text-sm text-neutral-500">AI-powered lead generation and outreach</p>
          </div>
        </div>
        <Button onClick={() => setShowAddLead(true)} className="bg-blue-600 hover:bg-blue-500">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Leads", value: stats.totalLeads, color: "text-neutral-300" },
          { label: "This Week", value: stats.thisWeek, color: "text-blue-400" },
          { label: "Messages Sent", value: stats.byStatus.sent + stats.byStatus.responded + stats.byStatus.converted, color: "text-purple-400" },
          { label: "Response Rate", value: `${stats.responseRate}%`, color: "text-emerald-400" },
          { label: "Converted", value: stats.byStatus.converted, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-neutral-600">{label}</div>
          </div>
        ))}
      </div>

      {/* Ready for action */}
      {readyForAction.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-950/30 to-blue-950/30 border-amber-900/30">
          <CardHeader>
            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Ready for Action ({readyForAction.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {readyForAction.slice(0, 3).map(lead => (
              <div 
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-lg cursor-pointer hover:bg-neutral-950 transition-colors"
              >
                <div>
                  <div className="font-medium text-neutral-200">{lead.name}</div>
                  <div className="text-xs text-neutral-500">
                    {lead.status === "message_drafted" ? "Message ready to send" : "Follow-up needed"}
                  </div>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-500">
                  {lead.status === "message_drafted" ? "Send" : "Follow Up"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add lead form */}
      {showAddLead && (
        <Card className="bg-neutral-900 border-blue-900/30">
          <CardHeader>
            <CardTitle className="text-sm text-blue-400">Add New Lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              value={newLeadForm.name}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
              placeholder="Name *"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
            />
            <input
              value={newLeadForm.company}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
              placeholder="Company"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
            />
            <textarea
              value={newLeadForm.context}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, context: e.target.value })}
              placeholder="How did you find them? What are they working on? *"
              className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 resize-none"
            />
            <select
              value={newLeadForm.source}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value as OutreachSource })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
            >
              <option value="manual">Manual Entry</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter/X</option>
              <option value="reddit">Reddit</option>
              <option value="hackernews">Hacker News</option>
            </select>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddLead}
                disabled={loading === "analyzing" || !newLeadForm.name || !newLeadForm.context}
                className="flex-1 bg-blue-600 hover:bg-blue-500"
              >
                {loading === "analyzing" ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> AI Analyze & Add</>
                )}
              </Button>
              <Button onClick={() => setShowAddLead(false)} variant="ghost" className="text-neutral-500">
                Cancel
              </Button>
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
          All ({stats.totalLeads})
        </button>
        {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filter === status ? "border-blue-400/40 text-blue-400 bg-blue-400/10" : "border-neutral-800 text-neutral-600"
            }`}
          >
            {STATUS_LABELS[status]} ({stats.byStatus[status]})
          </button>
        ))}
      </div>

      {/* Lead list */}
      <ScrollArea className="h-[calc(100vh-450px)]">
        <div className="space-y-3 pr-4">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-neutral-600">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No leads yet. Add your first lead to start.</p>
            </div>
          ) : (
            filteredLeads.map(lead => (
              <Card 
                key={lead.id}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                onClick={() => setSelectedLead(lead)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-lg">
                        {SOURCE_ICONS[lead.source]}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-200">{lead.name}</div>
                        <div className="text-xs text-neutral-500">
                          {lead.company || "No company"} · {new Date(lead.discoveredAt).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-neutral-600 mt-1 line-clamp-1">{lead.context}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        lead.fitScore >= 80 ? "text-emerald-400" :
                        lead.fitScore >= 60 ? "text-amber-400" : "text-neutral-500"
                      }`}>
                        {lead.fitScore}%
                      </div>
                      <div className={`text-xs ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

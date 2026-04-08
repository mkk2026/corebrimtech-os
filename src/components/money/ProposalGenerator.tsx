"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Copy, Check, Send, ChevronRight, Trash2, CheckCircle, XCircle, Clock, Eye, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getProposals,
  getProposalStats,
  createProposal,
  updateProposal,
  moveProposalStatus,
  deleteProposal,
  generateProposalContent,
  STATUS_CONFIG,
  type Proposal,
  type ProposalType,
} from "@/lib/proposal-generator";

const TYPE_OPTIONS: { type: ProposalType; label: string }[] = [
  { type: "fixed", label: "Fixed Project" },
  { type: "retainer", label: "Monthly Retainer" },
  { type: "hourly", label: "Hourly Consulting" },
];

export default function ProposalGenerator() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState(getProposalStats());
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newProposal, setNewProposal] = useState({
    clientName: "",
    clientCompany: "",
    projectName: "",
    type: "fixed" as ProposalType,
    value: "",
    discoveryNotes: "",
  });

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setProposals(getProposals());
    setStats(getProposalStats());
  }

  function handleCreate() {
    if (!newProposal.clientName || !newProposal.projectName) return;
    
    const sections = generateProposalContent(
      newProposal.type,
      newProposal.clientName,
      newProposal.projectName,
      newProposal.discoveryNotes,
      Number(newProposal.value) || 0
    );
    
    createProposal({
      clientName: newProposal.clientName,
      clientCompany: newProposal.clientCompany || undefined,
      projectName: newProposal.projectName,
      type: newProposal.type,
      value: Number(newProposal.value) || 0,
      currency: "USD",
      sections,
      timeline: "4-6 weeks",
      deliverables: ["Discovery report", "Implementation", "Documentation", "Training"],
      terms: "Payment terms: 50% upfront, 50% on delivery",
      nextSteps: "Schedule kickoff meeting upon acceptance",
    });
    
    refresh();
    setIsCreating(false);
    setNewProposal({ clientName: "", clientCompany: "", projectName: "", type: "fixed", value: "", discoveryNotes: "" });
  }

  function handleCopy() {
    if (!selectedProposal) return;
    const text = selectedProposal.sections.map(s => `${s.title}\n${s.content}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStatusChange(status: Proposal["status"]) {
    if (!selectedProposal) return;
    moveProposalStatus(selectedProposal.id, status);
    refresh();
    setSelectedProposal({ ...selectedProposal, status });
  }

  // Detail view
  if (selectedProposal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedProposal(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-neutral-100">{selectedProposal.projectName}</h2>
              <p className="text-sm text-neutral-500">For {selectedProposal.clientName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" className="border-neutral-700">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { deleteProposal(selectedProposal.id); refresh(); setSelectedProposal(null); }} className="text-red-400">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
          <span className={`text-sm font-medium ${STATUS_CONFIG[selectedProposal.status].color}`}>
            {STATUS_CONFIG[selectedProposal.status].label}
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-sm text-neutral-400">${selectedProposal.value.toLocaleString()}</span>
          <div className="flex-1"></div>
          <div className="flex gap-2">
            {selectedProposal.status === "draft" && (
              <Button size="sm" onClick={() => handleStatusChange("sent")}>
                <Send className="w-4 h-4 mr-2" />
                Mark Sent
              </Button>
            )}
            {selectedProposal.status === "sent" && (
              <>
                <Button size="sm" variant="outline" className="border-emerald-900/30 text-emerald-400" onClick={() => handleStatusChange("accepted")}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accepted
                </Button>
                <Button size="sm" variant="outline" className="border-red-900/30 text-red-400" onClick={() => handleStatusChange("rejected")}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejected
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Sections */}
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4 pr-4">
            {selectedProposal.sections.map((section, idx) => (
              <Card key={idx} className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-sm text-neutral-400">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Create view
  if (isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">New Proposal</h2>
            <p className="text-sm text-neutral-500">Generate AI-powered proposal</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-5 space-y-4">
            <Input
              placeholder="Client name"
              value={newProposal.clientName}
              onChange={e => setNewProposal({ ...newProposal, clientName: e.target.value })}
              className="bg-neutral-950 border-neutral-800"
            />
            <Input
              placeholder="Client company (optional)"
              value={newProposal.clientCompany}
              onChange={e => setNewProposal({ ...newProposal, clientCompany: e.target.value })}
              className="bg-neutral-950 border-neutral-800"
            />
            <Input
              placeholder="Project name"
              value={newProposal.projectName}
              onChange={e => setNewProposal({ ...newProposal, projectName: e.target.value })}
              className="bg-neutral-950 border-neutral-800"
            />
            
            <div className="flex gap-3">
              {TYPE_OPTIONS.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setNewProposal({ ...newProposal, type })}
                  className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                    newProposal.type === type 
                      ? "border-blue-400/40 bg-blue-400/10 text-blue-400" 
                      : "border-neutral-800 text-neutral-500"
                  }`}
                >
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>

            <Input
              type="number"
              placeholder="Proposal value ($)"
              value={newProposal.value}
              onChange={e => setNewProposal({ ...newProposal, value: e.target.value })}
              className="bg-neutral-950 border-neutral-800"
            />

            <textarea
              value={newProposal.discoveryNotes}
              onChange={e => setNewProposal({ ...newProposal, discoveryNotes: e.target.value })}
              placeholder="Discovery notes (what you learned about their needs)..."
              className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 placeholder:text-neutral-600 resize-none"
            />

            <Button onClick={handleCreate} disabled={!newProposal.clientName || !newProposal.projectName} className="w-full bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Generate Proposal
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
        <div>
          <h2 className="text-xl font-bold text-neutral-100">Proposal Generator</h2>
          <p className="text-sm text-neutral-500">AI-powered client proposals</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          New Proposal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-neutral-300">{stats.total}</div>
          <div className="text-xs text-neutral-600">Total</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.draft + stats.sent + stats.viewed + stats.negotiating}</div>
          <div className="text-xs text-neutral-600">Active</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{stats.accepted}</div>
          <div className="text-xs text-neutral-600">Won</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">${(stats.totalValue / 1000).toFixed(0)}k</div>
          <div className="text-xs text-neutral-600">Won Value</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{stats.winRate}%</div>
          <div className="text-xs text-neutral-600">Win Rate</div>
        </div>
      </div>

      {/* Pending Value */}
      {stats.pendingValue > 0 && (
        <Card className="bg-amber-950/20 border-amber-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-amber-400">Pipeline Value</div>
              <div className="text-2xl font-bold text-amber-400">${stats.pendingValue.toLocaleString()}</div>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </CardContent>
        </Card>
      )}

      {/* Proposals List */}
      <div className="space-y-2">
        {proposals.map(proposal => (
          <Card
            key={proposal.id}
            className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
            onClick={() => setSelectedProposal(proposal)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-neutral-200">{proposal.projectName}</span>
                    <span className={`text-xs ${STATUS_CONFIG[proposal.status].color}`}>
                      {STATUS_CONFIG[proposal.status].label}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-500">{proposal.clientName} {proposal.clientCompany && `• ${proposal.clientCompany}`}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-600">
                    <span className="capitalize">{proposal.type}</span>
                    <span>•</span>
                    <span>${proposal.value.toLocaleString()}</span>
                    <span>•</span>
                    <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

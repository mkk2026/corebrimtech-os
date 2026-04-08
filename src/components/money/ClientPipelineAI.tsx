"use client";

import { useState, useEffect } from "react";
import { User, Sparkles, FileText, Send, MessageSquare, Target, TrendingUp, AlertTriangle, Check, ChevronLeft, Loader2, Copy, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getClients, updateClient, type Client, type DealStatus } from "@/lib/money";
import { 
  qualifyLead, 
  generateProposal, 
  generateFollowUp,
  generateDiscoveryQuestions,
  type LeadQualification,
  type GeneratedProposal,
  type FollowUpMessage,
} from "@/lib/client-ai";

interface ClientPipelineAIProps {
  clientId?: string;
  onBack?: () => void;
}

const STATUS_COLORS: Record<DealStatus, string> = {
  lead: "text-neutral-400",
  contacted: "text-blue-400",
  proposal: "text-amber-400",
  negotiating: "text-purple-400",
  won: "text-emerald-400",
  lost: "text-red-400",
  on_hold: "text-neutral-600",
};

export default function ClientPipelineAI({ clientId, onBack }: ClientPipelineAIProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [qualification, setQualification] = useState<LeadQualification | null>(null);
  const [proposal, setProposal] = useState<GeneratedProposal | null>(null);
  const [followUp, setFollowUp] = useState<FollowUpMessage | null>(null);
  const [discoveryQuestions, setDiscoveryQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<"qualify" | "propose" | "followup" | "discover">("qualify");
  const [proposalInput, setProposalInput] = useState({
    description: "",
    deliverables: "",
    timelineWeeks: 4,
    price: 2000,
  });

  useEffect(() => {
    refresh();
    const saved = localStorage.getItem("cbt_os_anthropic_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) setSelectedClient(client);
    }
  }, [clientId, clients]);

  function refresh() {
    setClients(getClients().filter(c => c.status !== "lost"));
  }

  async function handleQualify(client: Client) {
    setSelectedClient(client);
    setLoading("qualify");
    const result = await qualifyLead(client, apiKey);
    setQualification(result);
    setLoading(null);
  }

  async function handleGenerateProposal() {
    if (!selectedClient) return;
    setLoading("proposal");
    
    const result = await generateProposal(
      selectedClient,
      {
        description: proposalInput.description,
        deliverables: proposalInput.deliverables.split("\n").filter(d => d.trim()),
        timelineWeeks: proposalInput.timelineWeeks,
        price: proposalInput.price,
      },
      apiKey
    );
    
    setProposal(result);
    setLoading(null);
    
    // Update client status
    updateClient(selectedClient.id, { status: "proposal" });
    refresh();
  }

  async function handleGenerateFollowUp() {
    if (!selectedClient) return;
    setLoading("followup");
    
    const daysSince = Math.floor(
      (Date.now() - new Date(selectedClient.updatedAt).getTime()) / 86400000
    );
    
    const result = await generateFollowUp(
      selectedClient,
      { daysSinceLastContact: daysSince },
      apiKey
    );
    
    setFollowUp(result);
    setLoading(null);
  }

  async function handleGenerateQuestions() {
    if (!selectedClient) return;
    setLoading("discover");
    
    const questions = await generateDiscoveryQuestions(selectedClient, apiKey);
    setDiscoveryQuestions(questions);
    setLoading(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  // List view
  if (!selectedClient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Client Pipeline AI</h2>
            <p className="text-sm text-neutral-500">AI-powered lead qualification and proposal generation</p>
          </div>
        </div>

        <div className="grid gap-3">
          {clients.map(client => (
            <Card key={client.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer" onClick={() => handleQualify(client)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-neutral-200">{client.name}</div>
                      <div className="text-xs text-neutral-500">
                        {client.company || "No company"} · {client.service}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${STATUS_COLORS[client.status]}`}>
                      {client.status}
                    </span>
                    {client.value > 0 && (
                      <span className="text-sm font-mono text-emerald-400">
                        ${client.value.toLocaleString()}
                      </span>
                    )}
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Analyze
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Detail view with AI tools
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedClient(null); setQualification(null); }} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">{selectedClient.name}</h2>
            <p className="text-sm text-neutral-500">{selectedClient.company || "No company"} · {selectedClient.service}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-800 pb-2">
        {[
          { id: "qualify", label: "Qualify", icon: Target },
          { id: "propose", label: "Proposal", icon: FileText },
          { id: "followup", label: "Follow-up", icon: Send },
          { id: "discover", label: "Discovery", icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === id 
                ? "bg-blue-950/50 text-blue-400" 
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Qualify Tab */}
      {activeTab === "qualify" && (
        <div className="space-y-4">
          {!qualification ? (
            <div className="text-center py-12">
              <Button 
                onClick={() => handleQualify(selectedClient)}
                disabled={loading === "qualify"}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {loading === "qualify" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> AI Qualify Lead</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-4 text-center">
                    <div className={`text-3xl font-bold ${
                      qualification.score >= 70 ? "text-emerald-400" : 
                      qualification.score >= 40 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {qualification.score}%
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">Qualification Score</div>
                  </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-4 text-center">
                    <div className={`text-3xl font-bold capitalize ${
                      qualification.tier === "hot" ? "text-red-400" :
                      qualification.tier === "warm" ? "text-amber-400" : "text-blue-400"
                    }`}>
                      {qualification.tier}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">Lead Tier</div>
                  </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">
                      {qualification.estimatedCloseProbability}%
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">Close Probability</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-sm text-neutral-300">Positive Signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {qualification.reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {reason}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {qualification.redFlags.length > 0 && (
                <Card className="bg-neutral-900 border-red-900/30">
                  <CardHeader>
                    <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Red Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {qualification.redFlags.map((flag, i) => (
                      <div key={i} className="text-sm text-red-400/80">• {flag}</div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-sm text-neutral-300">Recommended Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-400">{qualification.recommendedApproach}</p>
                </CardContent>
              </Card>

              {qualification.suggestedValue !== selectedClient.value && (
                <div className="bg-amber-950/30 border border-amber-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Suggested Value: ${qualification.suggestedValue.toLocaleString()}
                  </div>
                  <p className="text-xs text-amber-400/70 mt-1">
                    Current: ${selectedClient.value.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Proposal Tab */}
      {activeTab === "propose" && (
        <div className="space-y-4">
          {!proposal ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm text-neutral-400">Project Description</label>
                <textarea
                  value={proposalInput.description}
                  onChange={(e) => setProposalInput({ ...proposalInput, description: e.target.value })}
                  placeholder="Describe the project scope..."
                  className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm text-neutral-400">Deliverables (one per line)</label>
                <textarea
                  value={proposalInput.deliverables}
                  onChange={(e) => setProposalInput({ ...proposalInput, deliverables: e.target.value })}
                  placeholder="- Website design&#10;- API integration&#10;- Documentation"
                  className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm text-neutral-400">Timeline (weeks)</label>
                  <input
                    type="number"
                    value={proposalInput.timelineWeeks}
                    onChange={(e) => setProposalInput({ ...proposalInput, timelineWeeks: parseInt(e.target.value) || 4 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm text-neutral-400">Price (USD)</label>
                  <input
                    type="number"
                    value={proposalInput.price}
                    onChange={(e) => setProposalInput({ ...proposalInput, price: parseInt(e.target.value) || 2000 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>
              <Button 
                onClick={handleGenerateProposal}
                disabled={loading === "proposal" || !proposalInput.description}
                className="w-full bg-blue-600 hover:bg-blue-500"
              >
                {loading === "proposal" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-2" /> Generate Proposal</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(proposal.fullText)} className="border-neutral-700">
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
              </div>
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-4">
                  <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans">
                    {proposal.fullText}
                  </pre>
                </CardContent>
              </Card>
              <Button onClick={() => setProposal(null)} variant="outline" className="border-neutral-700">
                Generate New Proposal
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Follow-up Tab */}
      {activeTab === "followup" && (
        <div className="space-y-4">
          {!followUp ? (
            <div className="text-center py-12">
              <Button 
                onClick={handleGenerateFollowUp}
                disabled={loading === "followup"}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {loading === "followup" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Generate Follow-up</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-sm text-neutral-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Subject
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-200">{followUp.subject}</p>
                </CardContent>
              </Card>
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-neutral-300">Email Body</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(followUp.body)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans">
                    {followUp.body}
                  </pre>
                </CardContent>
              </Card>
              <div className="text-xs text-neutral-500">
                Tone: {followUp.tone} · {followUp.suggestedSendTime}
              </div>
              <Button onClick={() => setFollowUp(null)} variant="outline" className="border-neutral-700">
                Generate New Follow-up
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Discovery Tab */}
      {activeTab === "discover" && (
        <div className="space-y-4">
          {discoveryQuestions.length === 0 ? (
            <div className="text-center py-12">
              <Button 
                onClick={handleGenerateQuestions}
                disabled={loading === "discover"}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {loading === "discover" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><MessageSquare className="w-4 h-4 mr-2" /> Generate Discovery Questions</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-sm text-neutral-300">Discovery Call Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {discoveryQuestions.map((question, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-neutral-950 rounded-lg">
                      <span className="text-blue-400 font-mono text-sm">{i + 1}.</span>
                      <p className="text-sm text-neutral-300">{question}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Button onClick={() => setDiscoveryQuestions([])} variant="outline" className="border-neutral-700">
                Generate New Questions
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

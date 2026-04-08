"use client";

import { useState, useEffect } from "react";
import { Mail, Copy, Check, Sparkles, Filter, Trash2, ChevronRight, Send, Lightbulb, MessageSquare, Target, UserPlus, ThumbsUp, XCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getEmailTemplates,
  getGeneratedEmails,
  generateEmail,
  copyEmailToClipboard,
  markEmailAsUsed,
  deleteGeneratedEmail,
  type EmailTemplate,
  type GeneratedEmail,
  type EmailGoal,
  type EmailTone,
} from "@/lib/email-templates";

interface EmailTemplatesProps {
  onBack?: () => void;
}

const GOAL_ICONS: Record<EmailGoal, typeof Mail> = {
  get_meeting: Target,
  follow_up: MessageSquare,
  pitch: Sparkles,
  introduction: UserPlus,
  thank_you: ThumbsUp,
  breakup: XCircle,
};

const GOAL_LABELS: Record<EmailGoal, string> = {
  get_meeting: "Get Meeting",
  follow_up: "Follow Up",
  pitch: "Pitch",
  introduction: "Introduction",
  thank_you: "Thank You",
  breakup: "Breakup",
};

const TONE_COLORS: Record<EmailTone, string> = {
  professional: "text-blue-400",
  casual: "text-green-400",
  warm: "text-amber-400",
  urgent: "text-red-400",
  formal: "text-purple-400",
};

export default function EmailTemplates({ onBack }: EmailTemplatesProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<GeneratedEmail | null>(null);
  const [filterGoal, setFilterGoal] = useState<EmailGoal | "all">("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [recipient, setRecipient] = useState({ name: "", company: "" });

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setTemplates(getEmailTemplates());
    setGeneratedEmails(getGeneratedEmails());
  }

  function handleSelectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template);
    // Initialize variables with empty strings
    const initialVars: Record<string, string> = {};
    template.variables.forEach(v => {
      initialVars[v] = "";
    });
    setVariables(initialVars);
    setIsGenerating(true);
  }

  function handleGenerate() {
    if (!selectedTemplate) return;
    
    const email = generateEmail(
      selectedTemplate.id,
      variables,
      recipient.name || "Recipient",
      recipient.company || undefined
    );
    
    refreshData();
    setSelectedEmail(email);
    setIsGenerating(false);
    setSelectedTemplate(null);
  }

  function handleCopy(email: GeneratedEmail) {
    copyEmailToClipboard(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    markEmailAsUsed(email.id);
    refreshData();
  }

  function handleDelete(id: string) {
    if (confirm("Delete this email?")) {
      deleteGeneratedEmail(id);
      refreshData();
      if (selectedEmail?.id === id) setSelectedEmail(null);
    }
  }

  const filteredTemplates = filterGoal === "all" 
    ? templates 
    : templates.filter(t => t.goal === filterGoal);

  // Email detail view
  if (selectedEmail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-neutral-100">Generated Email</h2>
              <p className="text-sm text-neutral-500">To: {selectedEmail.recipientName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleCopy(selectedEmail)} className="bg-blue-600 hover:bg-blue-500">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedEmail.id)} className="text-red-400">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-200 font-medium">{selectedEmail.subject}</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Body</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-neutral-300 text-sm leading-relaxed font-mono">
              {selectedEmail.body}
            </div>
          </CardContent>
        </Card>

        {selectedEmail.usedAt && (
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Check className="w-4 h-4" />
              Used on {new Date(selectedEmail.usedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generate view
  if (isGenerating && selectedTemplate) {
    const GoalIcon = GOAL_ICONS[selectedTemplate.goal];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsGenerating(false)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">{selectedTemplate.name}</h2>
            <p className="text-sm text-neutral-500">{selectedTemplate.useCase}</p>
          </div>
        </div>

        {/* Tips */}
        <Card className="bg-amber-950/20 border-amber-900/30">
          <CardHeader>
            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Tips for this email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedTemplate.tips.map((tip, i) => (
                <li key={i} className="text-sm text-amber-400/80 flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recipient Info */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Recipient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Name</label>
                <Input
                  value={recipient.name}
                  onChange={e => setRecipient({ ...recipient, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="bg-neutral-950 border-neutral-800"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Company</label>
                <Input
                  value={recipient.company}
                  onChange={e => setRecipient({ ...recipient, company: e.target.value })}
                  placeholder="e.g., Acme Inc"
                  className="bg-neutral-950 border-neutral-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Template Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedTemplate.variables.map(variable => (
              <div key={variable}>
                <label className="text-xs text-neutral-500 mb-1 block capitalize">
                  {variable.replace(/_/g, " ")}
                </label>
                <Input
                  value={variables[variable] || ""}
                  onChange={e => setVariables({ ...variables, [variable]: e.target.value })}
                  placeholder={`Enter ${variable.replace(/_/g, " ")}...`}
                  className="bg-neutral-950 border-neutral-800"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={!recipient.name}
          className="w-full bg-blue-600 hover:bg-blue-500"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Email
        </Button>
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
              <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Email Templates</h2>
            <p className="text-sm text-neutral-500">Context-aware email generation</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterGoal("all")}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            filterGoal === "all" ? "border-blue-400/40 text-blue-400 bg-blue-400/10" : "border-neutral-800 text-neutral-600"
          }`}
        >
          All
        </button>
        {(Object.keys(GOAL_LABELS) as EmailGoal[]).map(goal => {
          const Icon = GOAL_ICONS[goal];
          return (
            <button
              key={goal}
              onClick={() => setFilterGoal(goal)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                filterGoal === goal ? "border-blue-400/40 text-blue-400 bg-blue-400/10" : "border-neutral-800 text-neutral-600"
              }`}
            >
              <Icon className="w-3 h-3" />
              {GOAL_LABELS[goal]}
            </button>
          );
        })}
      </div>

      {/* Templates */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Templates</h3>
        <div className="grid grid-cols-1 gap-3">
          {filteredTemplates.map(template => {
            const GoalIcon = GOAL_ICONS[template.goal];
            return (
              <Card
                key={template.id}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      <GoalIcon className={`w-5 h-5 ${TONE_COLORS[template.tone]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-200">{template.name}</span>
                        <span className={`text-xs capitalize ${TONE_COLORS[template.tone]}`}>
                          {template.tone}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">{template.useCase}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-neutral-600">{template.variables.length} variables</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator className="bg-neutral-800" />

      {/* Generated History */}
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-3">Recent Emails</h3>
        {generatedEmails.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No emails generated yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {generatedEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer hover:border-neutral-700 transition-colors ${
                    email.usedAt ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-300 truncate">{email.subject}</span>
                      {email.usedAt && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="text-xs text-neutral-500">
                      To: {email.recipientName} · {new Date(email.generatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => { e.stopPropagation(); handleCopy(email); }}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

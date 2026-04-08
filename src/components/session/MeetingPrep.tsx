"use client";

import { useState, useEffect } from "react";
import { Briefcase, Users, Building2, Clock, FileText, MessageSquare, CheckCircle, Plus, Trash2, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getMeetingBriefs,
  generateMeetingBrief,
  deleteMeetingBrief,
  createBriefFromTemplate,
  MEETING_TEMPLATES,
  type MeetingBrief,
  type MeetingTemplateType,
} from "@/lib/meeting-prep";

interface MeetingPrepProps {
  onBack?: () => void;
}

const TEMPLATE_OPTIONS: { type: MeetingTemplateType; label: string; icon: typeof Briefcase }[] = [
  { type: "investor_pitch", label: "Investor Pitch", icon: Briefcase },
  { type: "sales_call", label: "Sales Discovery", icon: MessageSquare },
  { type: "partnership", label: "Partnership", icon: Users },
  { type: "hiring", label: "Candidate Interview", icon: Users },
];

export default function MeetingPrep({ onBack }: MeetingPrepProps) {
  const [briefs, setBriefs] = useState<MeetingBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<MeetingBrief | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    attendees: "",
    company: "",
    agenda: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<MeetingTemplateType | null>(null);

  useEffect(() => {
    refreshBriefs();
  }, []);

  function refreshBriefs() {
    setBriefs(getMeetingBriefs());
  }

  async function handleCreateBrief() {
    if (!newMeeting.title || !newMeeting.attendees) return;
    
    const attendeeNames = newMeeting.attendees.split(",").map(n => n.trim()).filter(Boolean);
    
    if (selectedTemplate) {
      createBriefFromTemplate(selectedTemplate, attendeeNames, newMeeting.company || undefined);
    } else {
      await generateMeetingBrief(
        newMeeting.title,
        attendeeNames,
        newMeeting.company || undefined,
        newMeeting.agenda || undefined
      );
    }
    
    refreshBriefs();
    setIsCreating(false);
    setNewMeeting({ title: "", attendees: "", company: "", agenda: "" });
    setSelectedTemplate(null);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this brief?")) {
      deleteMeetingBrief(id);
      refreshBriefs();
      if (selectedBrief?.id === id) setSelectedBrief(null);
    }
  }

  // Detail view
  if (selectedBrief) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedBrief(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-neutral-100">Meeting Brief</h2>
              <p className="text-sm text-neutral-500">{selectedBrief.meetingTitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedBrief.id)} className="text-red-400">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{selectedBrief.attendees.length}</div>
            <div className="text-xs text-neutral-600">Attendees</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{selectedBrief.suggestedQuestions.length}</div>
            <div className="text-xs text-neutral-600">Questions</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{selectedBrief.objectionHandlers.length}</div>
            <div className="text-xs text-neutral-600">Objections</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-400">{selectedBrief.nextSteps?.length || 0}</div>
            <div className="text-xs text-neutral-600">Next Steps</div>
          </div>
        </div>

        {/* Attendees */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Attendees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedBrief.attendees.map((attendee, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-neutral-950 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold">{attendee.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-neutral-200">{attendee.name}</div>
                  {attendee.title && (
                    <div className="text-sm text-neutral-500">{attendee.title}</div>
                  )}
                  {attendee.talkingPoints && attendee.talkingPoints.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-neutral-600 mb-1">Talking Points:</div>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        {attendee.talkingPoints.map((point, j) => (
                          <li key={j} className="flex items-start gap-1.5">
                            <span className="text-blue-400">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Company Info */}
        {selectedBrief.company && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {selectedBrief.company.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedBrief.company.industry && (
                  <div><span className="text-neutral-500">Industry:</span> <span className="text-neutral-300">{selectedBrief.company.industry}</span></div>
                )}
                {selectedBrief.company.size && (
                  <div><span className="text-neutral-500">Size:</span> <span className="text-neutral-300">{selectedBrief.company.size}</span></div>
                )}
              </div>
              {selectedBrief.company.opportunities && selectedBrief.company.opportunities.length > 0 && (
                <div>
                  <div className="text-xs text-emerald-400 mb-2">Opportunities</div>
                  <ul className="space-y-1">
                    {selectedBrief.company.opportunities.map((opp, i) => (
                      <li key={i} className="text-sm text-neutral-400 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Goals */}
        {selectedBrief.goals && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Meeting Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedBrief.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="text-emerald-400 font-bold">{i + 1}.</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Suggested Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedBrief.suggestedQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-300 p-2 bg-neutral-950 rounded">
                  <span className="text-blue-400 font-mono">Q{i + 1}</span>
                  {q}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Objection Handlers */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Objection Handlers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedBrief.objectionHandlers.map((handler, i) => (
                <li key={i} className="text-sm text-neutral-300 p-2 bg-neutral-950 rounded">
                  {handler}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {selectedBrief.nextSteps && selectedBrief.nextSteps.length > 0 && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Suggested Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {selectedBrief.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="text-purple-400">→</span>
                    {step}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
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
            <h2 className="text-xl font-bold text-neutral-100">New Meeting Brief</h2>
            <p className="text-sm text-neutral-500">Auto-generate prep notes</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm text-neutral-500 mb-2 block">Meeting Title</label>
              <Input
                value={newMeeting.title}
                onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                placeholder="e.g., Seed Round Pitch with Acme Ventures"
                className="bg-neutral-950 border-neutral-800"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-500 mb-2 block">Attendees (comma-separated)</label>
              <Input
                value={newMeeting.attendees}
                onChange={e => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                placeholder="e.g., John Smith, Jane Doe"
                className="bg-neutral-950 border-neutral-800"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-500 mb-2 block">Company (optional)</label>
              <Input
                value={newMeeting.company}
                onChange={e => setNewMeeting({ ...newMeeting, company: e.target.value })}
                placeholder="e.g., Acme Ventures"
                className="bg-neutral-950 border-neutral-800"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-500 mb-2 block">Agenda (optional)</label>
              <Input
                value={newMeeting.agenda}
                onChange={e => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                placeholder="e.g., Partnership discussion"
                className="bg-neutral-950 border-neutral-800"
              />
            </div>

            <Separator className="bg-neutral-800" />

            <div>
              <label className="text-sm text-neutral-500 mb-3 block">Or use a template</label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_OPTIONS.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTemplate(selectedTemplate === type ? null : type)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      selectedTemplate === type
                        ? "border-blue-400/40 bg-blue-400/10 text-blue-400"
                        : "border-neutral-800 hover:border-neutral-700 text-neutral-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateBrief}
              disabled={!newMeeting.title || !newMeeting.attendees}
              className="w-full bg-blue-600 hover:bg-blue-500"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Brief
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
              <ChevronRight className="w-5 h-5 text-neutral-400 rotate-180" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Meeting Prep</h2>
            <p className="text-sm text-neutral-500">Auto-research before every call</p>
          </div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-500">
          <Plus className="w-4 h-4 mr-2" />
          New Brief
        </Button>
      </div>

      {briefs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-neutral-300 mb-2">No Meeting Briefs</h3>
          <p className="text-sm text-neutral-500 mb-4">Create a brief before your next important meeting</p>
          <Button onClick={() => setIsCreating(true)} variant="outline" className="border-neutral-700">
            Create First Brief
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3 pr-4">
            {briefs.map(brief => (
              <Card
                key={brief.id}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                onClick={() => setSelectedBrief(brief)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-200 mb-1">{brief.meetingTitle}</h3>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {brief.attendees.length} attendees
                        </span>
                        {brief.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {brief.company.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(brief.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

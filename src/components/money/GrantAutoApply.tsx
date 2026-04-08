"use client";

import { useState, useEffect } from "react";
import { FileText, Sparkles, Check, Edit3, Play, Save, Trash2, Loader2, ChevronLeft, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getGrants, 
  getApplications, 
  createApplication, 
  updateApplicationSection, 
  submitApplication,
  deleteApplication,
  type Grant,
  type GrantApplication,
  type ApplicationSection,
} from "@/lib/grant-tracker";
import { 
  generateSectionContent, 
  generateFullApplication,
  generateVideoScript,
  improveSection,
  calculateCompleteness,
} from "@/lib/grant-writer";

interface GrantAutoApplyProps {
  grantId?: string;
  onBack?: () => void;
}

export default function GrantAutoApply({ grantId, onBack }: GrantAutoApplyProps) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [activeApp, setActiveApp] = useState<GrantApplication | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    refresh();
    // Load API key from localStorage
    const saved = localStorage.getItem("cbt_os_anthropic_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (grantId) {
      const grant = grants.find(g => g.id === grantId);
      if (grant) setSelectedGrant(grant);
    }
  }, [grantId, grants]);

  function refresh() {
    setGrants(getGrants().filter(g => g.status !== "won" && g.status !== "rejected"));
    setApplications(getApplications());
  }

  function startApplication(grant: Grant) {
    const app = createApplication(grant.id);
    if (app) {
      refresh();
      setActiveApp(app);
      setSelectedGrant(null);
    }
  }

  function openApplication(app: GrantApplication) {
    setActiveApp(app);
    const grant = grants.find(g => g.id === app.grantId);
    if (grant) setSelectedGrant(grant);
  }

  async function generateSection(section: ApplicationSection) {
    if (!activeApp || !selectedGrant) return;
    
    setGenerating(section.id);
    
    // Update status to generating
    updateApplicationSection(activeApp.id, section.id, { status: "generating" });
    refresh();
    
    const result = await generateSectionContent(section, selectedGrant, apiKey);
    
    // Update with generated content
    updateApplicationSection(activeApp.id, section.id, {
      aiDraft: result.content,
      status: "drafted",
    });
    
    setGenerating(null);
    refresh();
  }

  async function generateAllSections() {
    if (!activeApp || !selectedGrant) return;
    
    setGeneratingAll(true);
    const pendingSections = activeApp.sections.filter(s => !s.aiDraft && !s.userEdit);
    
    for (let i = 0; i < pendingSections.length; i++) {
      const section = pendingSections[i];
      updateApplicationSection(activeApp.id, section.id, { status: "generating" });
      refresh();
      
      const result = await generateSectionContent(section, selectedGrant, apiKey);
      
      updateApplicationSection(activeApp.id, section.id, {
        aiDraft: result.content,
        status: "drafted",
      });
      refresh();
      
      // Delay between sections
      if (i < pendingSections.length - 1) {
        await new Promise(r => setTimeout(r, 800));
      }
    }
    
    setGeneratingAll(false);
  }

  function startEditing(section: ApplicationSection) {
    setEditingSection(section.id);
    setEditContent(section.userEdit || section.aiDraft || "");
  }

  function saveEdit(sectionId: string) {
    if (!activeApp) return;
    
    updateApplicationSection(activeApp.id, sectionId, {
      userEdit: editContent,
      status: "final",
    });
    
    setEditingSection(null);
    setEditContent("");
    refresh();
  }

  function handleSubmit() {
    if (!activeApp) return;
    
    const completeness = calculateCompleteness(activeApp.sections);
    if (completeness.score < 80) {
      if (!confirm(`Application is ${completeness.score}% complete. Submit anyway?`)) {
        return;
      }
    }
    
    submitApplication(activeApp.id);
    refresh();
    setActiveApp(null);
    setSelectedGrant(null);
  }

  function handleDelete(appId: string) {
    if (confirm("Delete this application draft?")) {
      deleteApplication(appId);
      refresh();
      if (activeApp?.id === appId) {
        setActiveApp(null);
      }
    }
  }

  const completeness = activeApp ? calculateCompleteness(activeApp.sections) : null;

  // List view
  if (!activeApp) {
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
              <h2 className="text-xl font-bold text-neutral-100">Grant Auto-Apply</h2>
              <p className="text-sm text-neutral-500">AI-powered grant application generator</p>
            </div>
          </div>
        </div>

        {/* Active Applications */}
        {applications.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">In Progress</h3>
            <div className="grid gap-3">
              {applications.filter(a => a.status !== "submitted").map(app => {
                const grant = grants.find(g => g.id === app.grantId);
                const complete = calculateCompleteness(app.sections);
                return (
                  <Card key={app.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer" onClick={() => openApplication(app)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-950 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-200">{app.grantName}</div>
                            <div className="text-xs text-neutral-500">Started {new Date(app.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium text-neutral-300">{complete.score}%</div>
                            <div className="text-xs text-neutral-600">{complete.completed}/{complete.total} sections</div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Start New Application */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">Start New Application</h3>
          <div className="grid gap-3">
            {grants.filter(g => !applications.some(a => a.grantId === g.id && a.status !== "submitted")).map(grant => (
              <Card key={grant.id} className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-200">{grant.name}</div>
                        <div className="text-xs text-neutral-500">{grant.organization} • {grant.amount}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => startApplication(grant)} className="bg-blue-600 hover:bg-blue-500">
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Application editor view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveApp(null); setSelectedGrant(null); }} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">{activeApp.grantName}</h2>
            <p className="text-sm text-neutral-500">
              {completeness?.completed}/{completeness?.total} sections • {completeness?.score}% complete
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!generatingAll && completeness && completeness.score < 100 && (
            <Button variant="outline" onClick={generateAllSections} disabled={generatingAll} className="border-neutral-700 text-neutral-300">
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Generate All
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={!completeness || completeness.score < 50} className="bg-emerald-600 hover:bg-emerald-500">
            <Check className="w-4 h-4 mr-2" />
            Submit Application
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${completeness?.score || 0}%` }}
        />
      </div>

      {/* API Key warning */}
      {!apiKey && (
        <div className="bg-amber-950/30 border border-amber-900/30 rounded-lg p-3 text-sm text-amber-400">
          Add your Anthropic API key in Settings to enable AI generation.
        </div>
      )}

      {/* Sections */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-4 pr-4">
          {activeApp.sections.map((section, idx) => (
            <Card key={section.id} className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-500">
                      {idx + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base text-neutral-200">{section.title}</CardTitle>
                      <p className="text-xs text-neutral-500">{section.wordLimit} words max</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.status === "final" && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Final
                      </span>
                    )}
                    {section.status === "drafted" && (
                      <span className="text-xs text-blue-400">Drafted</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-neutral-500">{section.prompt}</p>
                
                {editingSection === section.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-40 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="Write your response..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(section.id)} className="bg-blue-600 hover:bg-blue-500">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)} className="text-neutral-500">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(section.aiDraft || section.userEdit) ? (
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-300 whitespace-pre-wrap">
                        {section.userEdit || section.aiDraft}
                      </div>
                    ) : (
                      <div className="bg-neutral-950/50 border border-dashed border-neutral-800 rounded-lg p-8 text-center">
                        <p className="text-sm text-neutral-600">No content yet</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {!section.aiDraft && !section.userEdit && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => generateSection(section)}
                          disabled={generating === section.id || !apiKey}
                          className="border-blue-900/50 text-blue-400 hover:bg-blue-950/30"
                        >
                          {generating === section.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1" />
                              Generate with AI
                            </>
                          )}
                        </Button>
                      )}
                      {(section.aiDraft || section.userEdit) && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => startEditing(section)}
                          className="border-neutral-700 text-neutral-400"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          {section.userEdit ? "Edit" : "Review & Edit"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

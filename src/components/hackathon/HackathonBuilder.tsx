"use client";

import { useState, useEffect, useRef } from "react";
import {
  Code2, Plus, ExternalLink, Loader2, CheckCircle, Circle,
  FileCode, BookOpen, Download, Eye, Trophy, Clock, Zap,
  ChevronDown, ChevronUp, Copy, Check, AlertTriangle, X
} from "lucide-react";
import {
  runHackathonBuilder, getProjects, updateProjectStatus,
  type HackathonProject, type BuildStep, type ProjectFile
} from "@/lib/hackathon-builder";
import { getBrainSummary } from "@/lib/founder-brain";
import { getStoredAnthropicKey } from "@/lib/skill-engine";

const STATUS_CONFIG: Record<HackathonProject["status"], { label: string; color: string }> = {
  planning:  { label: "Planning",   color: "text-neutral-400 border-neutral-700" },
  building:  { label: "Building",   color: "text-amber-400 border-amber-400/30" },
  review:    { label: "Ready for Review", color: "text-blue-400 border-blue-400/30" },
  submitted: { label: "Submitted",  color: "text-purple-400 border-purple-400/30" },
  won:       { label: "WON 🏆",     color: "text-emerald-400 border-emerald-400/30" },
  lost:      { label: "Completed",  color: "text-neutral-600 border-neutral-800" },
};

function FileViewer({ files }: { files: ProjectFile[] }) {
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);

  const LANG_COLORS: Record<string, string> = {
    typescript: "text-blue-400",
    javascript: "text-yellow-400",
    markdown: "text-neutral-400",
    bash: "text-emerald-400",
    python: "text-amber-400",
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
      {/* File tabs */}
      <div className="flex overflow-x-auto border-b border-neutral-800 bg-neutral-900">
        {files.map((f, i) => (
          <button key={i} onClick={() => setActiveFile(i)}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-mono flex-shrink-0 border-b-2 transition-all ${
              activeFile === i
                ? "border-amber-400 text-amber-400 bg-neutral-950"
                : "border-transparent text-neutral-600 hover:text-neutral-400"
            }`}>
            <FileCode className="w-3 h-3" />
            {f.path.split("/").pop()}
          </button>
        ))}
      </div>

      {/* File header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/50">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${LANG_COLORS[files[activeFile].language] || "text-neutral-400"}`}>
            {files[activeFile].language}
          </span>
          <span className="text-xs text-neutral-700">·</span>
          <span className="text-xs text-neutral-600">{files[activeFile].path}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* File content */}
      <div className="overflow-auto max-h-96">
        <pre className="text-xs text-neutral-300 p-4 font-mono leading-relaxed whitespace-pre-wrap">
          {files[activeFile].content}
        </pre>
      </div>
    </div>
  );
}

function ProjectCard({ project, onView }: { project: HackathonProject; onView: () => void }) {
  const status = STATUS_CONFIG[project.status];
  return (
    <div className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg p-4 transition-all cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-neutral-200 mb-1">{project.plan.name}</h3>
          <p className="text-xs text-neutral-500 line-clamp-1">{project.plan.tagline}</p>
        </div>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ml-3 flex-shrink-0 ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="flex gap-3 text-xs font-mono text-neutral-600">
        <span>{project.files.length} files</span>
        <span>·</span>
        <span>{project.brief.title.slice(0, 30)}...</span>
        <span>·</span>
        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function ProjectDetail({ project, onBack, onRefresh }: {
  project: HackathonProject;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [showFiles, setShowFiles] = useState(true);

  function handleStatusChange(status: HackathonProject["status"]) {
    updateProjectStatus(project.id, status);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-xs font-mono text-neutral-500 hover:text-amber-400 transition-colors">← Back</button>
      </div>

      {/* Hero */}
      <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-2">Hackathon Project</div>
            <h2 className="text-2xl font-black text-neutral-100 mb-1">{project.plan.name}</h2>
            <p className="text-sm text-neutral-400">{project.plan.tagline}</p>
          </div>
          <span className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${STATUS_CONFIG[project.status].color}`}>
            {STATUS_CONFIG[project.status].label}
          </span>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed border-l-2 border-amber-400/30 pl-3 mt-4">
          <strong className="text-amber-400">Winning Angle:</strong> {project.plan.winningAngle}
        </p>
      </div>

      {/* Project plan */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Problem</div>
          <p className="text-sm text-neutral-400 leading-relaxed">{project.plan.problemStatement}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Solution</div>
          <p className="text-sm text-neutral-400 leading-relaxed">{project.plan.solution}</p>
        </div>
      </div>

      {/* MVP Scope */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">MVP Scope (Build This)</div>
        <div className="space-y-2">
          {project.plan.mvpScope.map((item, i) => (
            <div key={i} className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Judging alignment */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-3">Judging Criteria Alignment</div>
        <div className="space-y-3">
          {Object.entries(project.plan.judgingAlignment).map(([criterion, response]) => (
            <div key={criterion} className="border-b border-neutral-800 pb-3 last:border-0 last:pb-0">
              <p className="text-xs font-bold text-neutral-400 mb-1">{criterion}</p>
              <p className="text-xs text-neutral-500 leading-relaxed">{response}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Tech Stack</div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(project.plan.techStack).filter(([, v]) => v.length > 0).map(([layer, techs]) => (
            <div key={layer}>
              <p className="text-xs text-neutral-600 capitalize mb-1.5">{layer}</p>
              <div className="flex flex-wrap gap-1.5">
                {techs.map(t => (
                  <span key={t} className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-400 px-2 py-0.5 rounded font-mono">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Files */}
      <div>
        <button onClick={() => setShowFiles(!showFiles)}
          className="flex items-center gap-2 text-sm font-bold text-neutral-300 hover:text-neutral-100 transition-colors mb-3">
          <FileCode className="w-4 h-4 text-amber-400" />
          Source Files ({project.files.length})
          {showFiles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showFiles && <FileViewer files={project.files} />}
      </div>

      {/* Actions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Update Status</div>
        <div className="flex flex-wrap gap-2">
          {(["review", "building", "submitted", "won", "lost"] as HackathonProject["status"][]).map(s => (
            <button key={s} onClick={() => handleStatusChange(s)}
              className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                project.status === s ? STATUS_CONFIG[s].color : "border-neutral-800 text-neutral-600 hover:text-neutral-400"
              }`}>
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const HACKATHON_BUILDER_INTERRUPTED_KEY = "cbt_os_hackathon_builder_interrupted";

export default function HackathonBuilder() {
  const [projects, setProjects] = useState<HackathonProject[]>([]);
  const [viewingProject, setViewingProject] = useState<HackathonProject | null>(null);
  const [url, setUrl] = useState("");
  const [building, setBuilding] = useState(false);
  const [steps, setSteps] = useState<BuildStep[]>([]);
  const [tab, setTab] = useState<"builder" | "library">("builder");
  const [runError, setRunError] = useState<string | null>(null);
  const [interruptedUrl, setInterruptedUrl] = useState<string | null>(null);
  const runStateRef = useRef<{ building: boolean; url: string }>({ building: false, url: "" });

  runStateRef.current = { building, url: url.trim() };

  useEffect(() => { setProjects(getProjects()); }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(HACKATHON_BUILDER_INTERRUPTED_KEY);
      if (raw) {
        const { url: u } = JSON.parse(raw) as { url?: string };
        if (u) setInterruptedUrl(u);
      }
    } catch {
      // ignore
    }
    sessionStorage.removeItem(HACKATHON_BUILDER_INTERRUPTED_KEY);
  }, []);

  useEffect(() => {
    return () => {
      const { building: b, url: u } = runStateRef.current;
      if (b && u && typeof window !== "undefined") {
        sessionStorage.setItem(HACKATHON_BUILDER_INTERRUPTED_KEY, JSON.stringify({ url: u }));
      }
    };
  }, []);

  function refreshProjects() {
    setProjects(getProjects());
    if (viewingProject) {
      const updated = getProjects().find(p => p.id === viewingProject.id);
      if (updated) setViewingProject(updated);
    }
  }

  async function handleBuild() {
    if (!url.trim() || building) return;
    setBuilding(true);
    setSteps([]);
    setRunError(null);
    const founderContext = getBrainSummary();

    try {
      for await (const update of runHackathonBuilder(url.trim(), founderContext, getStoredAnthropicKey())) {
        if (update.type === "step_update" && update.step) {
          setSteps(prev => {
            const idx = prev.findIndex(s => s.step === update.step!.step);
            if (idx >= 0) { const n = [...prev]; n[idx] = update.step!; return n; }
            return [...prev, update.step!];
          });
        } else if (update.type === "result" && update.project) {
          setProjects(getProjects());
          setViewingProject(update.project);
          setTab("library");
          setUrl("");
          setSteps([]);
        } else if (update.type === "error" && update.error) {
          setRunError(update.error);
          break;
        }
      }
    } finally {
      setBuilding(false);
    }
  }

  if (viewingProject) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <ProjectDetail project={viewingProject} onBack={() => setViewingProject(null)} onRefresh={refreshProjects} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-0">
        {[
          { id: "builder", label: "Build Project", icon: Code2 },
          { id: "library", label: `Project Library (${projects.length})`, icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? "border-amber-400 text-amber-400" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tab === "builder" ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Interrupted banner */}
            {interruptedUrl && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200">
                    Your build for this URL was interrupted when you left. Check the <button type="button" onClick={() => setTab("library")} className="text-amber-400 hover:underline">Project Library</button> for any completed project, or start a new build.
                  </p>
                </div>
                <button type="button" onClick={() => setInterruptedUrl(null)} className="text-neutral-500 hover:text-neutral-300 p-1" aria-label="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Run error */}
            {runError && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-200">Build failed</p>
                  <p className="text-xs text-neutral-400 mt-1">{runError}</p>
                </div>
                <button type="button" onClick={() => setRunError(null)} className="text-neutral-500 hover:text-neutral-300 p-1" aria-label="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Hero */}
            {!building && steps.length === 0 && !interruptedUrl && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 mb-4">
                  <Code2 className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-neutral-100 mb-2">Hackathon Builder Agent</h2>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
                  Paste a DevPost hackathon URL. The agent reads the brief, plans the perfect project, and builds the full codebase — ready to review and submit.
                </p>
              </div>
            )}

            {/* URL Input */}
            <div className="bg-neutral-900 border border-amber-400/20 rounded-lg p-5 space-y-4">
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">Hackathon URL</div>
              <div className="flex gap-2">
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleBuild()}
                  placeholder="https://devpost.com/software/build-for-..."
                  disabled={building}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleBuild}
                  disabled={building || !url.trim()}
                  className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold px-5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {building ? "Building..." : "Build"}
                </button>
              </div>
              <p className="text-xs text-neutral-600 font-mono">
                Works with DevPost, Devfolio, HackMD, or any hackathon page URL · Uses your Founder Brain context
              </p>
            </div>

            {/* Build steps */}
            {steps.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
                <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Build Progress</div>
                {steps.map(step => (
                  <div key={step.step} className="flex items-center gap-3">
                    {step.status === "done"
                      ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      : step.status === "active"
                      ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                      : <Circle className="w-4 h-4 text-neutral-700 flex-shrink-0" />
                    }
                    <span className={`text-sm ${step.status === "active" ? "text-amber-400" : step.status === "done" ? "text-neutral-400" : "text-neutral-700"}`}>
                      {step.label}
                    </span>
                    {step.detail && <span className="text-xs text-neutral-600">— {step.detail}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* How it works */}
            {!building && steps.length === 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">What the Agent Does</div>
                <div className="space-y-3">
                  {[
                    { step: "01", label: "Reads the full hackathon brief", desc: "Parses requirements, judging criteria, prizes, and deadlines" },
                    { step: "02", label: "Designs the winning project", desc: "Uses your Founder Brain context to create an authentic, competitive submission" },
                    { step: "03", label: "Aligns to judging criteria", desc: "Maps every feature to every scoring criterion explicitly" },
                    { step: "04", label: "Builds the full codebase", desc: "Generates all source files, API routes, components, and README" },
                    { step: "05", label: "Saves to Project Library", desc: "Review, test, and submit when you're ready" },
                  ].map(({ step, label, desc }) => (
                    <div key={step} className="flex gap-4">
                      <span className="text-xs font-mono text-amber-400 mt-0.5 w-6 flex-shrink-0">{step}</span>
                      <div>
                        <p className="text-sm font-semibold text-neutral-300">{label}</p>
                        <p className="text-xs text-neutral-600 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No projects yet — paste a hackathon URL and build your first one.</p>
              </div>
            ) : (
              projects.map(project => (
                <ProjectCard key={project.id} project={project} onView={() => setViewingProject(project)} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

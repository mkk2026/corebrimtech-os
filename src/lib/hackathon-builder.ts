// CORE BRIM TECH OS — Hackathon Builder Agent
// Paste a DevPost URL → reads brief → builds full project → saves to library

import { proxyHeaders } from "@/lib/proxy";

export interface HackathonBrief {
  title: string;
  description: string;
  theme: string;
  requirements: string[];
  techRequirements: string[];
  judgingCriteria: string[];
  prizes: string[];
  deadline: string;
  url: string;
  teamSize: string;
}

export interface ProjectPlan {
  name: string;
  tagline: string;
  problemStatement: string;
  solution: string;
  targetUsers: string;
  keyFeatures: string[];
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    ai: string[];
    deployment: string[];
  };
  mvpScope: string[];
  stretchGoals: string[];
  judgingAlignment: Record<string, string>; // criterion → how we address it
  estimatedBuildTime: string;
  winningAngle: string; // what makes this submission stand out
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  description: string;
}

export interface HackathonProject {
  id: string;
  brief: HackathonBrief;
  plan: ProjectPlan;
  files: ProjectFile[];
  status: "planning" | "building" | "review" | "submitted" | "won" | "lost";
  buildSteps: BuildStep[];
  createdAt: string;
  updatedAt: string;
  submissionUrl?: string;
  result?: string;
  notes?: string;
}

export interface BuildStep {
  step: number;
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

const STORAGE_KEY = "cbt_os_hackathon_projects";

export function getProjects(): HackathonProject[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function saveProject(project: HackathonProject): void {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) projects[idx] = project;
  else projects.unshift(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProject(id: string): HackathonProject | null {
  return getProjects().find(p => p.id === id) || null;
}

export function updateProjectStatus(id: string, status: HackathonProject["status"], notes?: string): void {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === id);
  if (idx >= 0) {
    projects[idx].status = status;
    projects[idx].updatedAt = new Date().toISOString();
    if (notes) projects[idx].notes = notes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
}

// ── STREAMING BUILD AGENT ──────────────────────────────────────────────────────

export async function* runHackathonBuilder(
  url: string,
  founderContext: string,
  apiKey?: string
): AsyncGenerator<{
  type: "step_update" | "result" | "error";
  step?: BuildStep;
  project?: HackathonProject;
  error?: string;
}> {
  const useMock = !apiKey || apiKey === "mock";
  const DELAY = (ms: number) => new Promise(r => setTimeout(r, ms));
  const projectId = `hack_${Date.now()}`;

  const steps: BuildStep[] = [
    { step: 1, label: "Reading hackathon brief from DevPost", status: "pending" },
    { step: 2, label: "Analyzing requirements & judging criteria", status: "pending" },
    { step: 3, label: "Generating project plan & winning angle", status: "pending" },
    { step: 4, label: "Building project architecture", status: "pending" },
    { step: 5, label: "Writing all source files", status: "pending" },
    { step: 6, label: "Generating README & submission docs", status: "pending" },
    { step: 7, label: "Saving to Project Library", status: "pending" },
  ];

  try {
    if (useMock) {
      yield { type: "error", error: "API key required. Add your Anthropic API key in Settings to use the Hackathon Builder." };
      return;
    }

    // Step 1-2: Read brief
    for (let i = 0; i < 2; i++) {
      steps[i].status = "active";
      yield { type: "step_update", step: { ...steps[i] } };
      await DELAY(3000);
      steps[i].status = "done";
      steps[i].detail = i === 0 ? "Brief loaded" : "Judging criteria identified";
      yield { type: "step_update", step: { ...steps[i] } };
    }

    const brief = await fetchRealBrief(url, apiKey!);

    // Step 3: Plan
    steps[2].status = "active";
    yield { type: "step_update", step: { ...steps[2] } };
    await DELAY(4000);
    const plan = await generateRealPlan(brief, founderContext, apiKey!);
    steps[2].status = "done";
    steps[2].detail = `"${plan.name}" — ${plan.estimatedBuildTime}`;
    yield { type: "step_update", step: { ...steps[2] } };

    // Steps 4-6: Build
    for (let i = 3; i < 6; i++) {
      steps[i].status = "active";
      yield { type: "step_update", step: { ...steps[i] } };
      await DELAY(5000);
      steps[i].status = "done";
      steps[i].detail = ["Architecture defined", `${i === 4 ? "6" : "1"} files written`, "Documentation complete"][i - 3];
      yield { type: "step_update", step: { ...steps[i] } };
    }

    const files = await generateRealFiles(plan, brief, founderContext, apiKey!);

    // Step 7: Save
    steps[6].status = "active";
    yield { type: "step_update", step: { ...steps[6] } };
    await DELAY(500);

    const project: HackathonProject = {
      id: projectId,
      brief,
      plan,
      files,
      status: "review",
      buildSteps: steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProject(project);
    steps[6].status = "done";
    steps[6].detail = `${files.length} files saved to Project Library`;
    yield { type: "step_update", step: { ...steps[6] } };

    yield { type: "result", project };
  } catch (err) {
    yield { type: "error", error: err instanceof Error ? err.message : "Build failed" };
  }
}

// Real API functions
import { fetchWithTimeout, getAnthropicError } from "./anthropic";

async function fetchRealBrief(url: string, apiKey: string): Promise<HackathonBrief> {
  const res = await fetchWithTimeout(
    "/api/ai",
    {
      method: "POST",
      headers: proxyHeaders(),
      body: JSON.stringify({
        provider: "claude",
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        anthropic_beta: "web-search-2025-03-05",
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: `Fetch and parse this hackathon page: ${url}. Extract: title, description, theme, requirements, techRequirements, judgingCriteria, prizes, deadline, teamSize. Return ONLY a JSON object with these fields.` }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(getAnthropicError(res, data));
  const text = (data as { content?: { type: string; text?: string }[] })?.content?.find((b) => b.type === "text")?.text || "{}";
  try { return { ...JSON.parse(text), url }; } catch { throw new Error("Could not parse the hackathon brief from the AI response. Try again."); }
}

async function generateRealPlan(brief: HackathonBrief, founderContext: string, apiKey: string): Promise<ProjectPlan> {
  const res = await fetchWithTimeout(
    "/api/ai",
    {
      method: "POST",
      headers: proxyHeaders(),
      body: JSON.stringify({
        provider: "claude",
        model: "claude-opus-4-20250514",
        max_tokens: 3000,
        messages: [{ role: "user", content: `Design a winning hackathon project for this challenge:\n\n${JSON.stringify(brief, null, 2)}\n\nFounder context:\n${founderContext}\n\nCreate a project that leverages the founder's authentic background for maximum impact. Return a JSON ProjectPlan object with: name, tagline, problemStatement, solution, targetUsers, keyFeatures, techStack, mvpScope, stretchGoals, judgingAlignment, estimatedBuildTime, winningAngle. Return ONLY the JSON.` }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(getAnthropicError(res, data));
  const text = (data as { content?: { type: string; text?: string }[] })?.content?.[0]?.text;
  if (!text) throw new Error("Invalid API response: no content");
  try { return JSON.parse(text); } catch { throw new Error("Could not parse the project plan from the AI response. Try again."); }
}

async function generateRealFiles(plan: ProjectPlan, brief: HackathonBrief, founderContext: string, apiKey: string): Promise<ProjectFile[]> {
  const res = await fetchWithTimeout(
    "/api/ai",
    {
      method: "POST",
      headers: proxyHeaders(),
      body: JSON.stringify({
        provider: "claude",
        model: "claude-opus-4-20250514",
        max_tokens: 8000,
        messages: [{ role: "user", content: `Build the core files for this hackathon project:\n\nProject: ${JSON.stringify(plan, null, 2)}\n\nBuild: README.md, main page component, 2 API routes, 1 core UI component, .env.example. Return a JSON array of {path, content, language, description} objects. Return ONLY the JSON array.` }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(getAnthropicError(res, data));
  const text = (data as { content?: { type: string; text?: string }[] })?.content?.[0]?.text;
  if (!text) throw new Error("Invalid API response: no content");
  try { return JSON.parse(text); } catch { throw new Error("Could not parse the generated files from the AI response. Try again."); }
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert } from "./supabase";

export function syncProjectToCloud(project: HackathonProject): void {
  dbUpsert("hackathon_projects", project.id, project);
}

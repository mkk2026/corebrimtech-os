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

// ── MOCK DATA ─────────────────────────────────────────────────────────────────

function generateMockBrief(url: string): HackathonBrief {
  return {
    title: "AI for Good: Emerging Markets Innovation Challenge",
    description: "Build AI-powered solutions that address real challenges faced by communities in emerging markets across Africa, Southeast Asia, and Latin America.",
    theme: "AI for Social Impact in Emerging Markets",
    requirements: [
      "Must use AI/ML as a core component",
      "Must address a real problem in an emerging market",
      "Must be deployable with limited infrastructure",
      "Submit working prototype with demo video",
      "Open source code required",
    ],
    techRequirements: [
      "Any AI/ML framework or API allowed",
      "Must work on mobile or low-bandwidth connections",
      "Cloud deployment required for demo",
    ],
    judgingCriteria: [
      "Innovation & Creativity (25%)",
      "Technical Implementation (25%)",
      "Social Impact Potential (30%)",
      "Presentation & Demo (20%)",
    ],
    prizes: ["$10,000 Grand Prize", "$5,000 Runner Up", "$2,500 Community Choice"],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    url,
    teamSize: "1-4 people",
  };
}

function generateMockPlan(brief: HackathonBrief): ProjectPlan {
  return {
    name: "CareerBridge AI",
    tagline: "AI-powered career coaching for emerging market developers",
    problemStatement: "90% of talented developers in West Africa cannot access quality career coaching and interview preparation, limiting their ability to land remote jobs at global companies despite having equivalent technical skills.",
    solution: "CareerBridge AI provides personalized, AI-powered interview preparation, resume optimization, and salary benchmarking specifically calibrated for emerging market developers — accessible via mobile, offline-capable, and priced for local purchasing power.",
    targetUsers: "Junior to mid-level software developers in Sub-Saharan Africa seeking remote work at global tech companies",
    keyFeatures: [
      "AI mock interviews with voice — practice real interviews out loud",
      "Resume analyzer calibrated for African developers applying globally",
      "Salary benchmarking: local vs remote vs company-specific rates",
      "Company research profiles for 500+ remote-friendly companies",
      "WhatsApp integration — get daily tips on the app everyone already uses",
      "Offline mode — core features work without internet",
      "Krio/Pidgin language support alongside English",
    ],
    techStack: {
      frontend: ["Next.js 15", "Tailwind CSS", "PWA (offline)"],
      backend: ["Next.js API Routes", "Edge Functions"],
      database: ["Supabase (PostgreSQL)"],
      ai: ["Claude API (Sonnet)", "Whisper API (voice)"],
      deployment: ["Vercel", "Supabase"],
    },
    mvpScope: [
      "AI text-based mock interview (10 common questions, feedback per answer)",
      "Resume upload + AI analysis with 5 specific improvements",
      "Salary comparison dashboard (3 tiers: local, remote SMB, remote FAANG)",
      "Basic company profiles for top 20 remote-first companies",
      "Working demo deployed to Vercel",
    ],
    stretchGoals: [
      "Voice interview mode with Whisper",
      "WhatsApp bot integration",
      "Offline PWA mode",
      "10 more company profiles",
    ],
    judgingAlignment: {
      "Innovation & Creativity (25%)": "Voice-based interview practice + WhatsApp integration is novel. No existing tool is built specifically for African developers with offline capability and local language support.",
      "Technical Implementation (25%)": "Full-stack Next.js + Supabase + Claude API deployed on Vercel. Clean architecture, working demo, open source code with documentation.",
      "Social Impact Potential (30%)": "Direct economic impact: each user who lands a remote job earns 5-10x local salary. 50M+ developers across Africa represent the target market.",
      "Presentation & Demo (20%)": "Live demo with real AI responses. Personal founder story (building from Sierra Leone) adds authentic narrative that resonates with judges.",
    },
    estimatedBuildTime: "48-72 hours for MVP",
    winningAngle: "The judge will have never seen a hackathon submission built BY someone from the emerging market they're trying to help. Authentic founder-market fit + working product + massive market = winning combination.",
  };
}

function generateMockFiles(plan: ProjectPlan): ProjectFile[] {
  return [
    {
      path: "README.md",
      language: "markdown",
      description: "Project documentation and setup guide",
      content: `# ${plan.name}

> ${plan.tagline}

## Problem
${plan.problemStatement}

## Solution
${plan.solution}

## Features
${plan.keyFeatures.map(f => `- ${f}`).join("\n")}

## Tech Stack
- **Frontend:** ${plan.techStack.frontend.join(", ")}
- **Backend:** ${plan.techStack.backend.join(", ")}
- **Database:** ${plan.techStack.database.join(", ")}
- **AI:** ${plan.techStack.ai.join(", ")}
- **Deployment:** ${plan.techStack.deployment.join(", ")}

## Setup
\`\`\`bash
npm install
cp .env.example .env.local
# Add your API keys
npm run dev
\`\`\`

## Environment Variables
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
\`\`\`

## Built at
Core Brim Tech · Freetown, Sierra Leone 🇸🇱
`,
    },
    {
      path: "src/app/api/interview/route.ts",
      language: "typescript",
      description: "AI mock interview API endpoint",
      content: `import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const INTERVIEW_SYSTEM = \`You are an expert technical interviewer helping developers from emerging markets prepare for global remote tech jobs.

Your role:
- Ask one clear interview question at a time
- Give specific, actionable feedback on answers
- Be encouraging but honest
- Calibrate difficulty to the role level specified
- Focus on communication clarity as much as technical accuracy

Format feedback as:
SCORE: X/10
STRENGTHS: [what they did well]
IMPROVEMENTS: [specific things to fix]
SAMPLE ANSWER: [a better version of their answer]
NEXT QUESTION: [the next question to practice]\`;

export async function POST(req: NextRequest) {
  const { message, history, role, level } = await req.json();

  const messages = [
    ...history,
    { role: "user" as const, content: message }
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: INTERVIEW_SYSTEM + \`\\n\\nRole being practiced: \${role || "Software Engineer"}, Level: \${level || "Mid-level"}\`,
    messages,
  });

  return NextResponse.json({
    reply: response.content[0].type === "text" ? response.content[0].text : "",
    usage: response.usage,
  });
}
`,
    },
    {
      path: "src/app/api/resume/route.ts",
      language: "typescript",
      description: "AI resume analyzer API endpoint",
      content: `import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { resumeText, targetRole } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: \`You are a resume expert who specializes in helping developers from Africa and emerging markets optimize their resumes for remote global tech jobs. You understand the specific challenges they face: explaining local companies unknown globally, visa status concerns, timezone mentions, and salary negotiation for remote work.\`,
    messages: [{
      role: "user",
      content: \`Analyze this resume for a \${targetRole || "Software Engineer"} position at a global remote company:

\${resumeText}

Provide:
1. OVERALL SCORE: X/10
2. TOP 5 IMPROVEMENTS (specific, actionable)
3. PHRASES TO REMOVE (anything that could hurt)
4. PHRASES TO ADD (power words for global market)
5. SUMMARY REWRITE (improved version of their summary)
6. ONE THING that will make this resume stand out\`,
    }],
  });

  return NextResponse.json({
    analysis: response.content[0].type === "text" ? response.content[0].text : "",
  });
}
`,
    },
    {
      path: "src/components/InterviewCoach.tsx",
      language: "typescript",
      description: "Main interview coaching UI component",
      content: `"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_QUESTIONS = [
  "Tell me about yourself and your background",
  "Describe a challenging technical problem you solved",
  "How do you handle working across time zones?",
  "What's your experience with remote collaboration?",
];

export default function InterviewCoach() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Welcome to CareerBridge AI Interview Coach! I'll help you practice for technical interviews at global remote companies.\\n\\nTo start, tell me: **What role are you preparing for?** (e.g., Frontend Engineer, Full-Stack Developer, Backend Engineer)"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Software Engineer");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = text || input;
    if (!content.trim() || loading) return;

    const userMessage: Message = { role: "user", content };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: proxyHeaders(),
        body: JSON.stringify({
          message: content,
          history: newHistory.slice(-10),
          role,
          level: "Mid-level",
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      <div className="border-b border-neutral-800 p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
          <span className="text-amber-400 font-bold text-sm">AI</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-neutral-200">Interview Coach</h1>
          <p className="text-xs text-neutral-500">Preparing for: {role}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={\`flex \${msg.role === "user" ? "justify-end" : "justify-start"}\`}>
            <div className={\`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap \${
              msg.role === "user"
                ? "bg-amber-400 text-black font-medium"
                : "bg-neutral-900 border border-neutral-800 text-neutral-200"
            }\`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: \`\${i * 0.15}s\` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-neutral-800 p-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STARTER_QUESTIONS.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="flex-shrink-0 text-xs bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-amber-400 hover:border-amber-400/30 px-3 py-1.5 rounded-full transition-colors">
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type your answer or ask a question..."
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold px-4 rounded-lg transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
`,
    },
    {
      path: ".env.example",
      language: "bash",
      description: "Environment variables template",
      content: `# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic
ANTHROPIC_API_KEY=your_claude_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`,
    },
    {
      path: "src/app/page.tsx",
      language: "typescript",
      description: "Main landing page",
      content: `import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono text-amber-400">Built at Hackathon · Freetown, SL 🇸🇱</span>
          </div>
          <h1 className="text-5xl font-black text-neutral-100 mb-4">CareerBridge AI</h1>
          <p className="text-xl text-neutral-400 leading-relaxed">
            AI-powered interview coaching for emerging market developers.<br />
            Your talent is global. Your opportunity should be too.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          {[
            { label: "Mock Interviews", desc: "Practice with AI that gives real feedback" },
            { label: "Resume Analysis", desc: "Optimize for global remote companies" },
            { label: "Salary Data", desc: "Know your worth locally and globally" },
            { label: "Company Research", desc: "500+ remote-friendly company profiles" },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-neutral-200 mb-1">{label}</h3>
              <p className="text-xs text-neutral-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/interview"
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold px-8 py-3 rounded-lg transition-colors">
            Start Mock Interview
          </Link>
          <Link href="/resume"
            className="bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 font-bold px-8 py-3 rounded-lg transition-colors">
            Analyze Resume
          </Link>
        </div>
      </div>
    </main>
  );
}
`,
    },
  ];
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
    // Step 1-2: Read brief
    for (let i = 0; i < 2; i++) {
      steps[i].status = "active";
      yield { type: "step_update", step: { ...steps[i] } };
      await DELAY(useMock ? 1500 : 3000);
      steps[i].status = "done";
      steps[i].detail = i === 0 ? "Brief loaded — AI for Emerging Markets challenge" : "4 judging criteria identified";
      yield { type: "step_update", step: { ...steps[i] } };
    }

    const brief = useMock ? generateMockBrief(url) : await fetchRealBrief(url, apiKey!);

    // Step 3: Plan
    steps[2].status = "active";
    yield { type: "step_update", step: { ...steps[2] } };
    await DELAY(useMock ? 2000 : 4000);
    const plan = useMock ? generateMockPlan(brief) : await generateRealPlan(brief, founderContext, apiKey!);
    steps[2].status = "done";
    steps[2].detail = `"${plan.name}" — ${plan.estimatedBuildTime}`;
    yield { type: "step_update", step: { ...steps[2] } };

    // Steps 4-6: Build
    for (let i = 3; i < 6; i++) {
      steps[i].status = "active";
      yield { type: "step_update", step: { ...steps[i] } };
      await DELAY(useMock ? 1800 : 5000);
      steps[i].status = "done";
      steps[i].detail = ["Architecture defined", `${i === 4 ? "6" : "1"} files written`, "Documentation complete"][i - 3];
      yield { type: "step_update", step: { ...steps[i] } };
    }

    const files = useMock ? generateMockFiles(plan) : await generateRealFiles(plan, brief, founderContext, apiKey!);

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
  try { return { ...JSON.parse(text), url }; } catch { return generateMockBrief(url); }
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
  try { return JSON.parse(text); } catch { return generateMockPlan(brief); }
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
  try { return JSON.parse(text); } catch { return generateMockFiles(plan); }
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert } from "./supabase";

export function syncProjectToCloud(project: HackathonProject): void {
  dbUpsert("hackathon_projects", project.id, project);
}

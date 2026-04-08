// CORE BRIM TECH OS — Support Module: SOPs & Playbooks
import { getSupabaseClient, dbUpsert, dbUpsertMany, dbDelete } from "../supabase";

export type SOPCategory = "hackathon" | "client" | "grant" | "product" | "finance" | "marketing" | "hiring" | "operations";

export interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  checklist: string[];
  timeEstimate?: string;
  tools?: string[];
  notes?: string;
}

export interface SOP {
  id: string;
  title: string;
  description: string;
  category: SOPCategory;
  trigger: string;
  owner: string;
  estimatedTime: string;
  steps: SOPStep[];
  lastUsed?: string;
  timesUsed: number;
  createdAt: string;
  updatedAt: string;
}

const SOP_KEY = "cbt_os_sops";

function syncUpsert(id: string, data: SOP): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbUpsert("sops", id, data).catch(() => {});
}

function syncUpsertMany(records: SOP[]): void {
  const client = getSupabaseClient();
  if (!client || records.length === 0) return;
  void dbUpsertMany("sops", records.map(r => ({ id: r.id, data: r }))).catch(() => {});
}

function syncDelete(id: string): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbDelete("sops", id).catch(() => {});
}

function initSOPs(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SOP_KEY)) return;

  const starterSOPs: SOP[] = [
    {
      id: "sop_hackathon",
      title: "Hackathon End-to-End Playbook",
      description: "From finding a hackathon to submitting and following up on results",
      category: "hackathon",
      trigger: "When you decide to enter a hackathon",
      owner: "Founder",
      estimatedTime: "8-16 hours",
      timesUsed: 0,
      steps: [
        {
          id: "s1",
          order: 1,
          title: "Find & Qualify",
          description: "Use Auto-Scout to find hackathons. Check fit score ≥85, prize ≥$3K, and deadline ≥7 days away.",
          checklist: ["Run Auto-Scout", "Check fit score", "Read full brief", "Confirm eligibility", "Save to library"],
          timeEstimate: "30 min",
          tools: ["Auto-Scout", "DevPost"],
        },
        {
          id: "s2",
          order: 2,
          title: "Plan the Project",
          description: "Use Hackathon Builder Agent to generate a full project plan. Review and adjust.",
          checklist: ["Paste DevPost URL into Builder", "Review generated plan", "Adjust tech stack if needed", "Confirm MVP scope is achievable"],
          timeEstimate: "1 hour",
          tools: ["Hackathon Builder"],
        },
        {
          id: "s3",
          order: 3,
          title: "Build the MVP",
          description: "Focus on demo-ability over completeness. Judges see demos, not code.",
          checklist: ["Build core feature first", "Make the UI clean", "Record demo video", "Write clear README"],
          timeEstimate: "4-12 hours",
          tools: ["VS Code", "GitHub"],
        },
        {
          id: "s4",
          order: 4,
          title: "Write the Submission",
          description: "Story beats tech. Tell the human impact story clearly.",
          checklist: ["Problem statement (2 sentences)", "Solution overview", "Demo link/video", "Tech stack listed", "Impact metrics stated", "Team info added"],
          timeEstimate: "1 hour",
          tools: ["DevPost"],
        },
        {
          id: "s5",
          order: 5,
          title: "Submit & Log",
          description: "Submit before deadline. Log as a Win regardless of result.",
          checklist: ["Submit on DevPost", "Update status in Auto-Scout to Submitted", "Log in Portfolio", "Set calendar reminder for results"],
          timeEstimate: "30 min",
          tools: ["CBT OS Portfolio"],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sop_client",
      title: "New Client Onboarding Playbook",
      description: "From first contact to project kickoff and invoice sent",
      category: "client",
      trigger: "When a lead becomes interested or a deal is won",
      owner: "Founder",
      estimatedTime: "2-4 hours",
      timesUsed: 0,
      steps: [
        {
          id: "s1",
          order: 1,
          title: "Qualify the Lead",
          description: "Not every lead is worth pursuing. Qualify before investing time.",
          checklist: ["Budget confirmed?", "Timeline realistic?", "Decision maker in the room?", "Problem clearly defined?"],
          timeEstimate: "30 min",
        },
        {
          id: "s2",
          order: 2,
          title: "Send Proposal",
          description: "Use Proposal Writer skill. Personalise before sending.",
          checklist: ["Run Proposal Writer skill", "Customise with specific details", "Set clear deadline", "Send via email or WhatsApp"],
          timeEstimate: "30 min",
          tools: ["Skill Engine — Proposal Writer"],
        },
        {
          id: "s3",
          order: 3,
          title: "Follow Up",
          description: "Follow up in exactly 3 days if no response. Be brief and direct.",
          checklist: ["Day 3: Send one-line follow-up", "Day 7: Final follow-up with value add", "Update pipeline status"],
          timeEstimate: "10 min",
        },
        {
          id: "s4",
          order: 4,
          title: "Close & Invoice",
          description: "Once agreed, send invoice immediately. Don't start work before 50% deposit.",
          checklist: ["Mark as Won in Client Pipeline", "Generate invoice in Invoice Generator", "Send invoice", "Confirm payment terms", "Schedule kickoff call"],
          timeEstimate: "30 min",
          tools: ["Invoice Generator", "Client Pipeline"],
        },
        {
          id: "s5",
          order: 5,
          title: "Kickoff",
          description: "Start with clarity. Define deliverables, timeline, and communication channel.",
          checklist: ["Send project brief document", "Confirm deliverables in writing", "Set weekly check-in", "Add to Session Brain as active project"],
          timeEstimate: "1 hour",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sop_grant",
      title: "Grant Application Playbook",
      description: "From finding a grant to submitting a winning application",
      category: "grant",
      trigger: "When a grant with 80%+ fit score is found",
      owner: "Founder",
      estimatedTime: "4-8 hours",
      timesUsed: 0,
      steps: [
        {
          id: "s1",
          order: 1,
          title: "Research the Grant",
          description: "Understand what the funder actually cares about. Read past winners.",
          checklist: ["Read full grant description", "Find past winners online", "Understand judging criteria", "Note any deal-breakers"],
          timeEstimate: "1 hour",
          tools: ["Deep Research Engine"],
        },
        {
          id: "s2",
          order: 2,
          title: "Generate Draft",
          description: "Use Grant Drafter skill as starting point. Never submit the raw draft.",
          checklist: ["Run Grant Drafter skill", "Review the draft", "Mark sections to personalise", "Add specific data and metrics"],
          timeEstimate: "1 hour",
          tools: ["Skill Engine — Grant Drafter"],
        },
        {
          id: "s3",
          order: 3,
          title: "Personalise & Strengthen",
          description: "Make it specific to YOU and YOUR context. Generic = rejected.",
          checklist: ["Add real impact numbers", "Include your Sierra Leone story", "Connect to funder's mission", "Remove any generic language"],
          timeEstimate: "2 hours",
        },
        {
          id: "s4",
          order: 4,
          title: "Review & Submit",
          description: "Read it out loud. If it sounds like a robot wrote it, rewrite.",
          checklist: ["Read aloud test", "Check word limits", "Attach all required documents", "Submit before deadline (not on deadline)", "Screenshot/save confirmation"],
          timeEstimate: "1 hour",
        },
        {
          id: "s5",
          order: 5,
          title: "Log & Track",
          description: "Update Grant Tracker and log as a portfolio activity.",
          checklist: ["Update status to Submitted in Grant Tracker", "Add to Knowledge Base — what approach you took", "Set calendar reminder for results"],
          timeEstimate: "15 min",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(SOP_KEY, JSON.stringify(starterSOPs));
  syncUpsertMany(starterSOPs);
}

export function getSOPs(): SOP[] {
  if (typeof window === "undefined") return [];
  initSOPs();
  try {
    return JSON.parse(localStorage.getItem(SOP_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getSOP(id: string): SOP | null {
  return getSOPs().find(s => s.id === id) || null;
}

export function addSOP(sop: Omit<SOP, "id" | "createdAt" | "updatedAt" | "timesUsed">): SOP {
  const sops = getSOPs();
  const newSOP: SOP = {
    ...sop,
    id: `sop_${Date.now()}`,
    timesUsed: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sops.unshift(newSOP);
  localStorage.setItem(SOP_KEY, JSON.stringify(sops));
  syncUpsert(newSOP.id, newSOP);
  return newSOP;
}

export function updateSOP(id: string, updates: Partial<SOP>): void {
  const sops = getSOPs();
  const idx = sops.findIndex(s => s.id === id);
  if (idx >= 0) {
    sops[idx] = { ...sops[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(SOP_KEY, JSON.stringify(sops));
    syncUpsert(id, sops[idx]);
  }
}

export function logSOPUsed(id: string): void {
  const sops = getSOPs();
  const idx = sops.findIndex(s => s.id === id);
  if (idx >= 0) {
    sops[idx].timesUsed += 1;
    sops[idx].lastUsed = new Date().toISOString();
    localStorage.setItem(SOP_KEY, JSON.stringify(sops));
    syncUpsert(id, sops[idx]);
  }
}

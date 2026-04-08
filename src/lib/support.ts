// CORE BRIM TECH OS — Supporting Libraries
// Portfolio | Knowledge Base | SOPs | Notifications | Scheduler | Templates | Export

import { getSupabaseClient, dbUpsert, dbUpsertMany, dbDelete } from "./supabase";
import type { TableName } from "./supabase";

function syncUpsert<T extends object>(table: TableName, id: string, data: T): void {
  if (!getSupabaseClient()) return;
  void dbUpsert(table, id, data).catch(() => {});
}

function syncUpsertMany<T extends { id: string }>(table: TableName, records: T[]): void {
  if (!getSupabaseClient() || records.length === 0) return;
  void dbUpsertMany(table, records.map(r => ({ id: r.id, data: r as object }))).catch(() => {});
}

function syncDelete(table: TableName, id: string): void {
  if (!getSupabaseClient()) return;
  void dbDelete(table, id).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
// 1. PORTFOLIO / WINS LOGGER
// ═══════════════════════════════════════════════════════════════

export type WinType = "hackathon" | "grant" | "client" | "product" | "media" | "partnership" | "award" | "milestone";

export interface Win {
  id: string;
  type: WinType;
  title: string;
  description: string;
  value?: number; // USD if applicable
  date: string;
  proof?: string; // URL to screenshot, article, etc
  tags: string[];
  featured: boolean;
  lessonsLearned?: string;
  whatWorked?: string;
  createdAt: string;
}

const WIN_KEY = "cbt_os_wins";

export function getWins(): Win[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WIN_KEY) || "[]").sort((a: Win, b: Win) => new Date(b.date).getTime() - new Date(a.date).getTime()); } catch { return []; }
}

export function addWin(win: Omit<Win, "id" | "createdAt">): Win {
  const wins = getWins();
  const newWin: Win = { ...win, id: `win_${Date.now()}`, createdAt: new Date().toISOString() };
  wins.unshift(newWin);
  localStorage.setItem(WIN_KEY, JSON.stringify(wins));
  syncUpsert("wins", newWin.id, newWin);
  return newWin;
}

export function updateWin(id: string, updates: Partial<Win>): void {
  const wins = getWins();
  const idx = wins.findIndex(w => w.id === id);
  if (idx >= 0) {
    wins[idx] = { ...wins[idx], ...updates };
    localStorage.setItem(WIN_KEY, JSON.stringify(wins));
    syncUpsert("wins", id, wins[idx]);
  }
}

export function deleteWin(id: string): void {
  localStorage.setItem(WIN_KEY, JSON.stringify(getWins().filter(w => w.id !== id)));
  syncDelete("wins", id);
}

export function getWinStats() {
  const wins = getWins();
  return {
    total: wins.length,
    totalValue: wins.reduce((s, w) => s + (w.value || 0), 0),
    hackathons: wins.filter(w => w.type === "hackathon").length,
    grants: wins.filter(w => w.type === "grant").length,
    clients: wins.filter(w => w.type === "client").length,
    featured: wins.filter(w => w.featured).length,
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════

export type KBCategory = "hackathon" | "grant" | "sales" | "product" | "operations" | "finance" | "marketing" | "general";

export interface KBEntry {
  id: string;
  title: string;
  content: string;
  category: KBCategory;
  tags: string[];
  source?: string; // where this insight came from
  linkedWinId?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const KB_KEY = "cbt_os_knowledge_base";

function initKB(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KB_KEY)) return;
  const starter: KBEntry[] = [
    {
      id: "kb_1", title: "What makes a winning hackathon project",
      content: "1. Solve a real problem in the theme. 2. Demo that works — judges don't read code. 3. Clear impact story — who benefits and how much. 4. African/emerging market angle = differentiation. 5. Team story matters — why are YOU the right person to build this?",
      category: "hackathon", tags: ["winning", "strategy"], source: "CBT research", pinned: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "kb_2", title: "Grant application must-haves",
      content: "Every winning grant application has: (1) Clear problem statement with data, (2) Specific solution — not vague, (3) Measurable impact metrics, (4) Team credibility — why us, (5) Realistic budget breakdown, (6) Sustainability plan — what happens after the grant. Most applications fail on #4 and #5.",
      category: "grant", tags: ["applications", "strategy"], source: "CBT research", pinned: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "kb_3", title: "Proposal language that closes clients",
      content: "Lead with their problem, not your solution. Use 'you' 3x more than 'we'. Include a specific timeline. State the price clearly — don't hide it. End with ONE clear CTA. Follow up in exactly 3 days if no response. Short proposals win over long ones.",
      category: "sales", tags: ["proposals", "closing"], source: "Sales research", pinned: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "kb_4", title: "Tony Elumelu Foundation — what they want",
      content: "TEF funds African entrepreneurs with strong social impact. Key: (1) Be authentically African — your story matters, (2) Show employment creation potential, (3) Highlight sustainability beyond the grant, (4) Keep language simple and direct, (5) Video pitch should be personal and confident — not scripted. Deadline is typically January.",
      category: "grant", tags: ["TEF", "africa"], source: "TEF research", pinned: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(KB_KEY, JSON.stringify(starter));
  syncUpsertMany("knowledge_base", starter);
}

export function getKBEntries(): KBEntry[] {
  if (typeof window === "undefined") return [];
  initKB();
  try {
    return JSON.parse(localStorage.getItem(KB_KEY) || "[]")
      .sort((a: KBEntry, b: KBEntry) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch { return []; }
}

export function addKBEntry(entry: Omit<KBEntry, "id" | "createdAt" | "updatedAt">): KBEntry {
  const entries = getKBEntries();
  const newEntry: KBEntry = { ...entry, id: `kb_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  entries.unshift(newEntry);
  localStorage.setItem(KB_KEY, JSON.stringify(entries));
  syncUpsert("knowledge_base", newEntry.id, newEntry);
  return newEntry;
}

export function updateKBEntry(id: string, updates: Partial<KBEntry>): void {
  const entries = getKBEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(KB_KEY, JSON.stringify(entries));
    syncUpsert("knowledge_base", id, entries[idx]);
  }
}

export function deleteKBEntry(id: string): void {
  localStorage.setItem(KB_KEY, JSON.stringify(getKBEntries().filter(e => e.id !== id)));
  syncDelete("knowledge_base", id);
}

// ═══════════════════════════════════════════════════════════════
// 3. SOPs & PLAYBOOKS
// ═══════════════════════════════════════════════════════════════

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
  trigger: string; // "When to use this SOP"
  owner: string;
  estimatedTime: string;
  steps: SOPStep[];
  lastUsed?: string;
  timesUsed: number;
  createdAt: string;
  updatedAt: string;
}

const SOP_KEY = "cbt_os_sops";

function initSOPs(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SOP_KEY)) return;

  const starterSOPs: SOP[] = [
    {
      id: "sop_hackathon", title: "Hackathon End-to-End Playbook",
      description: "From finding a hackathon to submitting and following up on results",
      category: "hackathon", trigger: "When you decide to enter a hackathon",
      owner: "Founder", estimatedTime: "8-16 hours", timesUsed: 0,
      steps: [
        { id: "s1", order: 1, title: "Find & Qualify", description: "Use Auto-Scout to find hackathons. Check fit score ≥85, prize ≥$3K, and deadline ≥7 days away.", checklist: ["Run Auto-Scout", "Check fit score", "Read full brief", "Confirm eligibility", "Save to library"], timeEstimate: "30 min", tools: ["Auto-Scout", "DevPost"] },
        { id: "s2", order: 2, title: "Plan the Project", description: "Use Hackathon Builder Agent to generate a full project plan. Review and adjust.", checklist: ["Paste DevPost URL into Builder", "Review generated plan", "Adjust tech stack if needed", "Confirm MVP scope is achievable"], timeEstimate: "1 hour", tools: ["Hackathon Builder"] },
        { id: "s3", order: 3, title: "Build the MVP", description: "Focus on demo-ability over completeness. Judges see demos, not code.", checklist: ["Build core feature first", "Make the UI clean", "Record demo video", "Write clear README"], timeEstimate: "4-12 hours", tools: ["VS Code", "GitHub"] },
        { id: "s4", order: 4, title: "Write the Submission", description: "Story beats tech. Tell the human impact story clearly.", checklist: ["Problem statement (2 sentences)", "Solution overview", "Demo link/video", "Tech stack listed", "Impact metrics stated", "Team info added"], timeEstimate: "1 hour", tools: ["DevPost"] },
        { id: "s5", order: 5, title: "Submit & Log", description: "Submit before deadline. Log as a Win regardless of result.", checklist: ["Submit on DevPost", "Update status in Auto-Scout to Submitted", "Log in Portfolio", "Set calendar reminder for results"], timeEstimate: "30 min", tools: ["CBT OS Portfolio"] },
      ],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "sop_client", title: "New Client Onboarding Playbook",
      description: "From first contact to project kickoff and invoice sent",
      category: "client", trigger: "When a lead becomes interested or a deal is won",
      owner: "Founder", estimatedTime: "2-4 hours", timesUsed: 0,
      steps: [
        { id: "s1", order: 1, title: "Qualify the Lead", description: "Not every lead is worth pursuing. Qualify before investing time.", checklist: ["Budget confirmed?", "Timeline realistic?", "Decision maker in the room?", "Problem clearly defined?"], timeEstimate: "30 min" },
        { id: "s2", order: 2, title: "Send Proposal", description: "Use Proposal Writer skill. Personalise before sending.", checklist: ["Run Proposal Writer skill", "Customise with specific details", "Set clear deadline", "Send via email or WhatsApp"], timeEstimate: "30 min", tools: ["Skill Engine — Proposal Writer"] },
        { id: "s3", order: 3, title: "Follow Up", description: "Follow up in exactly 3 days if no response. Be brief and direct.", checklist: ["Day 3: Send one-line follow-up", "Day 7: Final follow-up with value add", "Update pipeline status"], timeEstimate: "10 min" },
        { id: "s4", order: 4, title: "Close & Invoice", description: "Once agreed, send invoice immediately. Don't start work before 50% deposit.", checklist: ["Mark as Won in Client Pipeline", "Generate invoice in Invoice Generator", "Send invoice", "Confirm payment terms", "Schedule kickoff call"], timeEstimate: "30 min", tools: ["Invoice Generator", "Client Pipeline"] },
        { id: "s5", order: 5, title: "Kickoff", description: "Start with clarity. Define deliverables, timeline, and communication channel.", checklist: ["Send project brief document", "Confirm deliverables in writing", "Set weekly check-in", "Add to Session Brain as active project"], timeEstimate: "1 hour" },
      ],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "sop_grant", title: "Grant Application Playbook",
      description: "From finding a grant to submitting a winning application",
      category: "grant", trigger: "When a grant with 80%+ fit score is found",
      owner: "Founder", estimatedTime: "4-8 hours", timesUsed: 0,
      steps: [
        { id: "s1", order: 1, title: "Research the Grant", description: "Understand what the funder actually cares about. Read past winners.", checklist: ["Read full grant description", "Find past winners online", "Understand judging criteria", "Note any deal-breakers"], timeEstimate: "1 hour", tools: ["Deep Research Engine"] },
        { id: "s2", order: 2, title: "Generate Draft", description: "Use Grant Drafter skill as starting point. Never submit the raw draft.", checklist: ["Run Grant Drafter skill", "Review the draft", "Mark sections to personalise", "Add specific data and metrics"], timeEstimate: "1 hour", tools: ["Skill Engine — Grant Drafter"] },
        { id: "s3", order: 3, title: "Personalise & Strengthen", description: "Make it specific to YOU and YOUR context. Generic = rejected.", checklist: ["Add real impact numbers", "Include your Sierra Leone story", "Connect to funder's mission", "Remove any generic language"], timeEstimate: "2 hours" },
        { id: "s4", order: 4, title: "Review & Submit", description: "Read it out loud. If it sounds like a robot wrote it, rewrite.", checklist: ["Read aloud test", "Check word limits", "Attach all required documents", "Submit before deadline (not on deadline)", "Screenshot/save confirmation"], timeEstimate: "1 hour" },
        { id: "s5", order: 5, title: "Log & Track", description: "Update Grant Tracker and log as a portfolio activity.", checklist: ["Update status to Submitted in Grant Tracker", "Add to Knowledge Base — what approach you took", "Set calendar reminder for results"], timeEstimate: "15 min" },
      ],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(SOP_KEY, JSON.stringify(starterSOPs));
  syncUpsertMany("sops", starterSOPs);
}

export function getSOPs(): SOP[] {
  if (typeof window === "undefined") return [];
  initSOPs();
  try { return JSON.parse(localStorage.getItem(SOP_KEY) || "[]"); } catch { return []; }
}

export function getSOP(id: string): SOP | null {
  return getSOPs().find(s => s.id === id) || null;
}

export function addSOP(sop: Omit<SOP, "id" | "createdAt" | "updatedAt" | "timesUsed">): SOP {
  const sops = getSOPs();
  const newSOP: SOP = { ...sop, id: `sop_${Date.now()}`, timesUsed: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  sops.unshift(newSOP);
  localStorage.setItem(SOP_KEY, JSON.stringify(sops));
  syncUpsert("sops", newSOP.id, newSOP);
  return newSOP;
}

export function updateSOP(id: string, updates: Partial<SOP>): void {
  const sops = getSOPs();
  const idx = sops.findIndex(s => s.id === id);
  if (idx >= 0) {
    sops[idx] = { ...sops[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(SOP_KEY, JSON.stringify(sops));
    syncUpsert("sops", id, sops[idx]);
  }
}

export function logSOPUsed(id: string): void {
  const sops = getSOPs();
  const idx = sops.findIndex(s => s.id === id);
  if (idx >= 0) {
    sops[idx].timesUsed += 1;
    sops[idx].lastUsed = new Date().toISOString();
    localStorage.setItem(SOP_KEY, JSON.stringify(sops));
    syncUpsert("sops", id, sops[idx]);
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. NOTIFICATION CENTER
// ═══════════════════════════════════════════════════════════════

export type NotificationType = "deadline" | "opportunity" | "approval" | "win" | "alert" | "reminder" | "system";
export type NotificationPriority = "urgent" | "high" | "medium" | "low";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  module?: string; // which module to navigate to
  read: boolean;
  dismissed: boolean;
  actionLabel?: string;
  createdAt: string;
  expiresAt?: string;
}

const NOTIF_KEY = "cbt_os_notifications";

export function getNotifications(includeRead = false): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
    return all
      .filter(n => !n.dismissed && (includeRead || !n.read))
      .filter(n => !n.expiresAt || new Date(n.expiresAt) > new Date())
      .sort((a, b) => {
        const pOrder: NotificationPriority[] = ["urgent", "high", "medium", "low"];
        return pOrder.indexOf(a.priority) - pOrder.indexOf(b.priority) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  } catch { return []; }
}

let notifCounter = 0;

export function addNotification(notif: Omit<Notification, "id" | "read" | "dismissed" | "createdAt">): Notification {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  notifCounter++;
  const newNotif: Notification = { ...notif, id: `notif_${Date.now()}_${notifCounter}`, read: false, dismissed: false, createdAt: new Date().toISOString() };
  all.unshift(newNotif);
  // Keep only last 20 notifications to prevent accumulation
  const trimmed = all.slice(0, 20);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(trimmed));
  syncUpsert("notifications", newNotif.id, newNotif);
  return newNotif;
}

export function markRead(id: string): void {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  const n = all.find(n => n.id === id);
  if (n) {
    n.read = true;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    syncUpsert("notifications", id, n);
  }
}

export function markAllRead(): void {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  all.forEach(n => n.read = true);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  syncUpsertMany("notifications", all);
}

export function dismissNotification(id: string): void {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  const n = all.find(n => n.id === id);
  if (n) {
    n.dismissed = true;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    syncUpsert("notifications", id, n);
  }
}

export function getUnreadCount(): number {
  return getNotifications(false).length;
}

export function clearAllNotifications(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIF_KEY, "[]");
  notifCounter = 0;
}

// Deduplicate notifications by signature (type + title + message)
export function deduplicateNotifications(): void {
  if (typeof window === "undefined") return;
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  const seen = new Set<string>();
  const unique = all.filter(n => {
    const sig = `${n.type}-${n.title}-${n.message}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
  localStorage.setItem(NOTIF_KEY, JSON.stringify(unique));
}

// Generate smart notifications from system state
// Only generates from YOUR TRACKED data with valid dates - no discovery data
export function generateSystemNotifications(): void {
  if (typeof window === "undefined") return;

  try {
    const grants = JSON.parse(localStorage.getItem("cbt_os_grants") || "[]");
    const clients = JSON.parse(localStorage.getItem("cbt_os_clients") || "[]");
    const goals = JSON.parse(localStorage.getItem("cbt_os_goals") || "[]");
    const listings = JSON.parse(localStorage.getItem("cbt_os_hackathon_listings") || "[]");
    const existing = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];

    // Track existing notification signatures to avoid duplicates
    const existingSignatures = new Set(existing.map(n => `${n.type}-${n.title}-${n.message}`));

    const toAdd: Omit<Notification, "id" | "read" | "dismissed" | "createdAt">[] = [];

    // Only generate notifications if there's actual tracked data
    const hasRealData = grants.length > 0 || clients.length > 0 || goals.length > 0 || listings.length > 0;
    if (!hasRealData) return;

    // Helper to check if date is valid ISO date (not text like "January annually")
    function isValidDate(dateStr: string): boolean {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && dateStr.includes("T");
    }

    // Grant deadline alerts - only for tracked grants with VALID ISO dates
    grants.forEach((g: { id?: string; deadline?: string; status: string; name: string; isBuiltIn?: boolean }) => {
      // Skip discovery/built-in grants - only notify on YOUR tracked grants
      if (g.isBuiltIn || !g.deadline || g.status === "won" || g.status === "rejected") return;
      
      // Validate it's a real date, not text
      if (!isValidDate(g.deadline)) return;
      
      const days = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
      if (days > 0 && days <= 7) { // Only notify for deadlines within 7 days
        const sig = `deadline-Grant deadline in ${days} day${days === 1 ? "" : "s"}-${g.name}`;
        if (!existingSignatures.has(sig)) {
          toAdd.push({
            type: "deadline", priority: days <= 3 ? "urgent" : "high",
            title: `Grant deadline in ${days} day${days === 1 ? "" : "s"}`,
            message: `${g.name} — don't miss this.`, module: "grants",
            actionLabel: "Open Grant Tracker", expiresAt: g.deadline,
          });
        }
      }
    });

    // High-fit new hackathons - only for real listings with high fit scores
    listings.filter((l: { fitScore: number; status: string }) => l.fitScore >= 90 && l.status === "new").forEach((l: { title: string; prizeDisplay: string; fitScore: number }) => {
      const sig = `opportunity-High-fit hackathon found-${l.title}`;
      if (!existingSignatures.has(sig)) {
        toAdd.push({
          type: "opportunity", priority: "high",
          title: `High-fit hackathon found`,
          message: `${l.title} — ${l.prizeDisplay} · ${l.fitScore}% fit`, module: "scout",
          actionLabel: "View in Scout",
        });
      }
    });

    // Stale leads - only for real clients
    clients.filter((c: { status: string; updatedAt: string; name: string }) => c.status === "contacted").forEach((c: { updatedAt: string; name: string }) => {
      const daysSince = Math.floor((Date.now() - new Date(c.updatedAt).getTime()) / 86400000);
      if (daysSince >= 7) { // Only after 7 days of inactivity
        const sig = `reminder-Follow up with ${c.name}`;
        if (!existingSignatures.has(sig)) {
          toAdd.push({
            type: "reminder", priority: "medium",
            title: `Follow up with ${c.name}`,
            message: `No activity in ${daysSince} days — send a follow-up now.`, module: "revenue",
            actionLabel: "Open Pipeline",
          });
        }
      }
    });

    // At-risk goals - only for real goals
    goals.filter((g: { status: string; progress: number; title: string }) => g.status === "active" && g.progress < 20).forEach((g: { title: string }) => {
      const sig = `alert-Goal at risk-${g.title}`;
      if (!existingSignatures.has(sig)) {
        toAdd.push({
          type: "alert", priority: "medium",
          title: `Goal at risk`, message: `"${g.title}" is under 20% progress.`, module: "goals",
          actionLabel: "View Goals",
        });
      }
    });

    // Strictly limit to 5 new notifications max per session
    toAdd.slice(0, 5).forEach(n => addNotification(n));
  } catch { /* silently fail */ }
}

// ═══════════════════════════════════════════════════════════════
// 5. EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

export type TemplateCategory = "proposal" | "follow_up" | "invoice" | "grant" | "outreach" | "onboarding" | "partnership" | "general";

export interface EmailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  variables: string[]; // {{client_name}}, {{company}}, etc
  timesUsed: number;
  isBuiltIn: boolean;
  createdAt: string;
}

const TEMPLATE_KEY = "cbt_os_templates";

function initTemplates(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(TEMPLATE_KEY)) return;

  const templates: EmailTemplate[] = [
    {
      id: "tpl_1", name: "Cold Outreach — LinkedIn",
      category: "outreach",
      subject: "Quick question about {{company}}",
      body: `Hi {{client_name}},

I came across {{company}} and was struck by what you're building.

I'm {{founder_name}}, founder of {{company_name}}. We help companies like yours with {{service}} — specifically for teams that need results fast without the overhead of a large agency.

I'd love to show you what we've done for similar clients. Would a 20-minute call this week work?

Best,
{{founder_name}}
{{company_name}}`,
      variables: ["client_name", "company", "founder_name", "company_name", "service"],
      timesUsed: 0, isBuiltIn: true, createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_2", name: "Proposal Follow-Up (3 days)",
      category: "follow_up",
      subject: "Re: Proposal for {{project}}",
      body: `Hi {{client_name}},

Just following up on the proposal I sent over for {{project}}.

Happy to jump on a quick call to answer any questions or adjust the scope. What works for you this week?

{{founder_name}}`,
      variables: ["client_name", "project", "founder_name"],
      timesUsed: 0, isBuiltIn: true, createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_3", name: "Invoice Sent",
      category: "invoice",
      subject: "Invoice #{{invoice_number}} — {{company_name}}",
      body: `Hi {{client_name}},

Please find attached invoice #{{invoice_number}} for {{service}} — total {{amount}} due by {{due_date}}.

Payment details:
{{payment_instructions}}

Let me know if you have any questions.

{{founder_name}}
{{company_name}}`,
      variables: ["client_name", "invoice_number", "company_name", "service", "amount", "due_date", "payment_instructions", "founder_name"],
      timesUsed: 0, isBuiltIn: true, createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_4", name: "Grant Application Cover Email",
      category: "grant",
      subject: "Application: {{grant_name}} — {{company_name}}",
      body: `Dear {{grant_team}},

Please find attached our application for the {{grant_name}}.

{{company_name}} is a technology company based in {{location}}, building {{product_description}}. We believe our work directly aligns with {{grant_organization}}'s mission because {{alignment_reason}}.

We would be honoured to be considered for this opportunity. Please don't hesitate to reach out with any questions.

Sincerely,
{{founder_name}}
Founder, {{company_name}}
{{email}}`,
      variables: ["grant_team", "grant_name", "company_name", "location", "product_description", "grant_organization", "alignment_reason", "founder_name", "email"],
      timesUsed: 0, isBuiltIn: true, createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_5", name: "Partnership Outreach",
      category: "partnership",
      subject: "Partnership opportunity — {{company_name}} x {{partner_name}}",
      body: `Hi {{contact_name}},

I'm {{founder_name}}, founder of {{company_name}}. We're building {{product_description}} for {{target_market}}.

I've been following {{partner_name}}'s work closely and see a strong opportunity to collaborate. Specifically, {{partnership_idea}}.

This could benefit both our communities because {{mutual_benefit}}.

Would you be open to a 20-minute exploratory call this week?

{{founder_name}}
{{company_name}}`,
      variables: ["contact_name", "founder_name", "company_name", "product_description", "target_market", "partner_name", "partnership_idea", "mutual_benefit"],
      timesUsed: 0, isBuiltIn: true, createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_6", name: "Project Kickoff",
      category: "onboarding",
      subject: "We're starting — {{project}} kickoff",
      body: `Hi {{client_name}},

Excited to get started on {{project}}!

Here's what happens next:

1. I'll send you a project brief to confirm all requirements by {{brief_date}}
2. First milestone: {{first_milestone}} by {{milestone_date}}
3. Weekly updates every {{update_day}}
4. Best way to reach me: {{contact_method}}

Please reply to confirm this all looks good.

{{founder_name}}`,
      variables: ["client_name", "project", "brief_date", "first_milestone", "milestone_date", "update_day", "contact_method", "founder_name"],
      timesUsed: 0, isBuiltIn: true, createdAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncUpsertMany("templates", templates);
}

export function getTemplates(): EmailTemplate[] {
  if (typeof window === "undefined") return [];
  initTemplates();
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}

export function addTemplate(template: Omit<EmailTemplate, "id" | "timesUsed" | "isBuiltIn" | "createdAt">): EmailTemplate {
  const templates = getTemplates();
  const newTemplate: EmailTemplate = { ...template, id: `tpl_${Date.now()}`, timesUsed: 0, isBuiltIn: false, createdAt: new Date().toISOString() };
  templates.unshift(newTemplate);
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncUpsert("templates", newTemplate.id, newTemplate);
  return newTemplate;
}

export function useTemplate(id: string): EmailTemplate | null {
  const templates = getTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx < 0) return null;
  templates[idx].timesUsed += 1;
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncUpsert("templates", id, templates[idx]);
  return templates[idx];
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncDelete("templates", id);
}

// Fill template variables with actual values
export function fillTemplate(template: EmailTemplate, values: Record<string, string>): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });
  return { subject, body };
}

// ═══════════════════════════════════════════════════════════════
// 6. SCHEDULER
// ═══════════════════════════════════════════════════════════════

export interface ScheduledJob {
  id: string;
  skillId: string;
  skillName: string;
  schedule: string;
  nextRun: string;
  lastRun?: string;
  enabled: boolean;
  runCount: number;
}

const SCHEDULER_KEY = "cbt_os_scheduler";

export function getScheduledJobs(): ScheduledJob[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SCHEDULER_KEY) || "[]"); } catch { return []; }
}

export function initScheduler(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SCHEDULER_KEY)) return;

  const now = new Date();
  const tomorrow6am = new Date(now); tomorrow6am.setDate(tomorrow6am.getDate() + 1); tomorrow6am.setHours(6, 0, 0, 0);
  const tomorrow7am = new Date(tomorrow6am); tomorrow7am.setHours(7, 0, 0, 0);
  const nextMonday = new Date(now); nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay() + 1) % 7 || 7); nextMonday.setHours(7, 0, 0, 0);
  const nextSunday = new Date(now); nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7 || 7); nextSunday.setHours(18, 0, 0, 0);

  const jobs: ScheduledJob[] = [
    { id: "job_1", skillId: "skill_grant_drafter", skillName: "Grant Drafter", schedule: "daily_6am", nextRun: tomorrow6am.toISOString(), enabled: true, runCount: 0 },
    { id: "job_2", skillId: "skill_opportunity_scanner", skillName: "Opportunity Scanner", schedule: "daily_7am", nextRun: tomorrow7am.toISOString(), enabled: true, runCount: 0 },
    { id: "job_3", skillId: "skill_competitor_monitor", skillName: "Competitor Monitor", schedule: "weekly_monday", nextRun: nextMonday.toISOString(), enabled: true, runCount: 0 },
    { id: "job_4", skillId: "skill_weekly_report", skillName: "Weekly Reporter", schedule: "weekly_sunday", nextRun: nextSunday.toISOString(), enabled: true, runCount: 0 },
  ];
  localStorage.setItem(SCHEDULER_KEY, JSON.stringify(jobs));
  syncUpsertMany("scheduler", jobs);
}

export function toggleJob(id: string): void {
  const jobs = getScheduledJobs();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx >= 0) {
    jobs[idx].enabled = !jobs[idx].enabled;
    localStorage.setItem(SCHEDULER_KEY, JSON.stringify(jobs));
    syncUpsert("scheduler", id, jobs[idx]);
  }
}

export function logJobRun(skillId: string): void {
  const jobs = getScheduledJobs();
  const job = jobs.find(j => j.skillId === skillId);
  if (!job) return;
  job.lastRun = new Date().toISOString();
  job.runCount += 1;
  // Calculate next run
  const next = new Date();
  if (job.schedule.startsWith("daily")) { next.setDate(next.getDate() + 1); next.setHours(job.schedule.includes("6am") ? 6 : 7, 0, 0, 0); }
  else if (job.schedule === "weekly_monday") { next.setDate(next.getDate() + 7); }
  else if (job.schedule === "weekly_sunday") { next.setDate(next.getDate() + 7); }
  job.nextRun = next.toISOString();
  localStorage.setItem(SCHEDULER_KEY, JSON.stringify(jobs));
  syncUpsert("scheduler", job.id, job);
}

// ═══════════════════════════════════════════════════════════════
// 7. DATA EXPORT
// ═══════════════════════════════════════════════════════════════

export interface ExportBundle {
  exportedAt: string;
  version: string;
  data: Record<string, unknown>;
}

export function exportAllData(): ExportBundle {
  if (typeof window === "undefined") return { exportedAt: new Date().toISOString(), version: "3.0", data: {} };

  const keys = [
    "cbt_os_founder_brain", "cbt_os_sessions", "cbt_os_tasks", "cbt_os_decisions",
    "cbt_os_ideas", "cbt_os_goals", "cbt_os_grants", "cbt_os_clients", "cbt_os_revenue",
    "cbt_os_hackathon_projects", "cbt_os_hackathon_listings", "cbt_os_competitor_reports",
    "cbt_os_research_library", "cbt_os_skills", "cbt_os_skill_runs", "cbt_os_invoices",
    "cbt_os_wins", "cbt_os_knowledge_base", "cbt_os_sops", "cbt_os_templates",
    "cbt_os_notifications", "cbt_os_scheduler",
  ];

  const data: Record<string, unknown> = {};
  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw) { try { data[key] = JSON.parse(raw); } catch { data[key] = raw; } }
  });

  return { exportedAt: new Date().toISOString(), version: "3.0", data };
}

export function downloadJSON(bundle: ExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cbt-os-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(bundle: ExportBundle): void {
  if (typeof window === "undefined") return;
  Object.entries(bundle.data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
}

export function exportCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify((row as Record<string, unknown>)[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// CORE BRIM TECH OS — Money Layer
// Client Pipeline + Revenue Dashboard

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type DealStatus = "lead" | "contacted" | "proposal" | "negotiating" | "won" | "lost" | "on_hold";
export type IncomeType = "hackathon" | "freelance" | "grant" | "consulting" | "product" | "other";

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source: string; // "LinkedIn", "Referral", "Cold outreach", etc
  status: DealStatus;
  service: string; // "Web development", "AI integration", etc
  value: number; // USD
  currency: string;
  notes: string;
  nextAction?: string;
  nextActionDate?: string;
  probability: number; // 0-100%
  createdAt: string;
  updatedAt: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
}

export interface RevenueEntry {
  id: string;
  type: IncomeType;
  description: string;
  amount: number; // USD
  currency: string;
  date: string;
  clientId?: string;
  projectId?: string; // hackathon project
  grantId?: string;
  recurring: boolean;
  recurringInterval?: "monthly" | "quarterly" | "annually";
  notes?: string;
}

export interface RevenueGoal {
  id: string;
  title: string;
  target: number;
  deadline: string;
  type: IncomeType | "total";
}

// ── STORAGE ───────────────────────────────────────────────────────────────────

const KEYS = {
  clients: "cbt_os_clients",
  revenue: "cbt_os_revenue",
  goals: "cbt_os_revenue_goals",
};

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function persist<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── CLIENT PIPELINE ───────────────────────────────────────────────────────────

export function getClients(): Client[] {
  return load<Client>(KEYS.clients);
}

export function addClient(client: Omit<Client, "id" | "createdAt" | "updatedAt">): Client {
  const clients = getClients();
  const newClient: Client = {
    ...client,
    id: `client_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  clients.unshift(newClient);
  persist(KEYS.clients, clients);
  return newClient;
}

export function updateClient(id: string, updates: Partial<Client>): void {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx >= 0) {
    clients[idx] = { ...clients[idx], ...updates, updatedAt: new Date().toISOString() };
    if (updates.status === "won") {
      clients[idx].wonAt = new Date().toISOString();
      // Auto-create revenue entry
      addRevenue({
        type: "freelance",
        description: `${clients[idx].service} — ${clients[idx].name}`,
        amount: clients[idx].value,
        currency: clients[idx].currency,
        date: new Date().toISOString().split("T")[0],
        clientId: id,
        recurring: false,
      });
    }
    persist(KEYS.clients, clients);
  }
}

export function deleteClient(id: string): void {
  persist(KEYS.clients, getClients().filter(c => c.id !== id));
}

export function getPipelineStats() {
  const clients = getClients();
  const pipeline = clients.filter(c => !["won", "lost"].includes(c.status));
  const won = clients.filter(c => c.status === "won");

  return {
    totalLeads: clients.length,
    activeDeals: pipeline.length,
    pipelineValue: pipeline.reduce((s, c) => s + (c.value * c.probability / 100), 0),
    totalWon: won.length,
    wonValue: won.reduce((s, c) => s + c.value, 0),
    conversionRate: clients.length > 0 ? Math.round((won.length / clients.length) * 100) : 0,
  };
}

// ── REVENUE ───────────────────────────────────────────────────────────────────

export function getRevenue(): RevenueEntry[] {
  return load<RevenueEntry>(KEYS.revenue).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function addRevenue(entry: Omit<RevenueEntry, "id">): RevenueEntry {
  const revenue = getRevenue();
  const newEntry: RevenueEntry = { ...entry, id: `rev_${Date.now()}` };
  revenue.unshift(newEntry);
  persist(KEYS.revenue, revenue);
  return newEntry;
}

export function deleteRevenue(id: string): void {
  persist(KEYS.revenue, getRevenue().filter(r => r.id !== id));
}

export function getRevenueStats() {
  const revenue = getRevenue();
  const now = new Date();
  const thisMonth = revenue.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = revenue.filter(r => {
    const d = new Date(r.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const thisYear = revenue.filter(r => new Date(r.date).getFullYear() === now.getFullYear());

  const byType = (type: IncomeType) => revenue.filter(r => r.type === type).reduce((s, r) => s + r.amount, 0);

  const thisMonthTotal = thisMonth.reduce((s, r) => s + r.amount, 0);
  const lastMonthTotal = lastMonth.reduce((s, r) => s + r.amount, 0);
  const growth = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;

  return {
    allTime: revenue.reduce((s, r) => s + r.amount, 0),
    thisYear: thisYear.reduce((s, r) => s + r.amount, 0),
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    growth,
    byType: {
      hackathon: byType("hackathon"),
      freelance: byType("freelance"),
      grant: byType("grant"),
      consulting: byType("consulting"),
      product: byType("product"),
      other: byType("other"),
    },
    entryCount: revenue.length,
  };
}

// ── GOALS ─────────────────────────────────────────────────────────────────────

export function getGoals(): RevenueGoal[] {
  return load<RevenueGoal>(KEYS.goals);
}

export function addGoal(goal: Omit<RevenueGoal, "id">): void {
  const goals = getGoals();
  goals.push({ ...goal, id: `goal_${Date.now()}` });
  persist(KEYS.goals, goals);
}

export function deleteGoal(id: string): void {
  persist(KEYS.goals, getGoals().filter(g => g.id !== id));
}

// ── SUPABASE SYNC ─────────────────────────────────────────────────────────────
import { dbUpsert, dbDelete } from "./supabase";

export function syncClientToCloud(client: Client): void {
  dbUpsert("clients", client.id, client);
}
export function deleteClientFromCloud(id: string): void {
  dbDelete("clients", id);
}
export function syncRevenueToCloud(entry: RevenueEntry): void {
  dbUpsert("revenue", entry.id, entry);
}
export function deleteRevenueFromCloud(id: string): void {
  dbDelete("revenue", id);
}

// CORE BRIM TECH OS — Autonomous Revenue Agent
// 24/7 AI that finds opportunities, qualifies leads, and moves deals forward

export type AgentTaskType = "scan_opportunities" | "qualify_lead" | "draft_outreach" | "follow_up" | "generate_proposal";
export type AgentTaskStatus = "pending" | "running" | "completed" | "failed" | "paused";

export interface AgentTask {
  id: string;
  type: AgentTaskType;
  status: AgentTaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledFor?: string; // For future tasks
}

export interface RevenueAgentConfig {
  enabled: boolean;
  scanFrequency: "hourly" | "daily" | "weekly";
  autoQualify: boolean;
  autoDraft: boolean;
  autoFollowUp: boolean;
  maxDailyTasks: number;
  focusAreas: string[];
  excludeSources: string[];
  minDealValue: number;
}

export interface Opportunity {
  id: string;
  source: string;
  title: string;
  description: string;
  url?: string;
  company?: string;
  contactName?: string;
  estimatedValue: number;
  urgency: "low" | "medium" | "high";
  fitScore: number; // 0-100
  status: "new" | "reviewed" | "qualified" | "contacted" | "converted" | "rejected";
  discoveredAt: string;
  reviewedAt?: string;
  notes?: string;
  tags: string[];
}

const AGENT_TASKS_KEY = "cbt_os_agent_tasks";
const AGENT_CONFIG_KEY = "cbt_os_agent_config";
const OPPORTUNITIES_KEY = "cbt_os_opportunities";

// Default configuration
export const DEFAULT_AGENT_CONFIG: RevenueAgentConfig = {
  enabled: false,
  scanFrequency: "daily",
  autoQualify: true,
  autoDraft: false,
  autoFollowUp: true,
  maxDailyTasks: 10,
  focusAreas: ["AI", "SaaS", "Enterprise Software", "Automation"],
  excludeSources: [],
  minDealValue: 5000,
};

export function getAgentConfig(): RevenueAgentConfig {
  if (typeof window === "undefined") return DEFAULT_AGENT_CONFIG;
  try {
    return { ...DEFAULT_AGENT_CONFIG, ...JSON.parse(localStorage.getItem(AGENT_CONFIG_KEY) || "{}") };
  } catch { return DEFAULT_AGENT_CONFIG; }
}

export function updateAgentConfig(updates: Partial<RevenueAgentConfig>): void {
  const current = getAgentConfig();
  localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify({ ...current, ...updates }));
}

export function getAgentTasks(status?: AgentTaskStatus): AgentTask[] {
  if (typeof window === "undefined") return [];
  try {
    const tasks = JSON.parse(localStorage.getItem(AGENT_TASKS_KEY) || "[]") as AgentTask[];
    return status ? tasks.filter(t => t.status === status) : tasks;
  } catch { return []; }
}

export function addAgentTask(task: Omit<AgentTask, "id" | "createdAt" | "status">): AgentTask {
  const newTask: AgentTask = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    status: task.scheduledFor && new Date(task.scheduledFor) > new Date() ? "pending" : "pending",
  };
  
  const tasks = getAgentTasks();
  tasks.unshift(newTask);
  
  if (tasks.length > 500) tasks.length = 500;
  
  localStorage.setItem(AGENT_TASKS_KEY, JSON.stringify(tasks));
  return newTask;
}

export function updateAgentTask(id: string, updates: Partial<AgentTask>): void {
  const tasks = getAgentTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates };
    localStorage.setItem(AGENT_TASKS_KEY, JSON.stringify(tasks));
  }
}

export function getOpportunities(status?: Opportunity["status"]): Opportunity[] {
  if (typeof window === "undefined") return [];
  try {
    const ops = JSON.parse(localStorage.getItem(OPPORTUNITIES_KEY) || "[]") as Opportunity[];
    return status ? ops.filter(o => o.status === status) : ops;
  } catch { return []; }
}

export function addOpportunity(opp: Omit<Opportunity, "id" | "discoveredAt" | "status">): Opportunity {
  const newOpp: Opportunity = {
    ...opp,
    id: `opp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    discoveredAt: new Date().toISOString(),
    status: "new",
  };
  
  const opps = getOpportunities();
  opps.unshift(newOpp);
  
  if (opps.length > 200) opps.length = 200;
  
  localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(opps));
  return newOpp;
}

export function updateOpportunity(id: string, updates: Partial<Opportunity>): void {
  const opps = getOpportunities();
  const idx = opps.findIndex(o => o.id === id);
  if (idx >= 0) {
    opps[idx] = { ...opps[idx], ...updates };
    localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(opps));
  }
}

// Simulate agent scanning for opportunities
export function simulateOpportunityScan(): Opportunity[] {
  const sampleOpportunities: Omit<Opportunity, "id" | "discoveredAt" | "status">[] = [
    {
      source: "LinkedIn",
      title: "CTO looking for AI automation partner",
      description: "Post from TechCorp CTO about needing help with AI integration",
      company: "TechCorp",
      contactName: "Michael Chen",
      estimatedValue: 50000,
      urgency: "high",
      fitScore: 92,
      tags: ["enterprise", "AI", "integration"],
    },
    {
      source: "AngelList",
      title: "Startup seeking technical co-founder",
      description: "Fintech startup looking for technical partner with AI experience",
      estimatedValue: 25000,
      urgency: "medium",
      fitScore: 78,
      tags: ["startup", "fintech", "partnership"],
    },
    {
      source: "Clutch",
      title: "RFP for custom software development",
      description: "Enterprise RFP for 6-month development project",
      company: "Global Industries",
      estimatedValue: 150000,
      urgency: "medium",
      fitScore: 85,
      tags: ["enterprise", "RFP", "development"],
    },
    {
      source: "Twitter",
      title: "Founder complaining about current solution",
      description: "Startup founder publicly frustrated with their current vendor",
      company: "StartupXYZ",
      contactName: "Sarah Johnson",
      estimatedValue: 15000,
      urgency: "high",
      fitScore: 88,
      tags: ["startup", "pain-point", "quick-win"],
    },
  ];
  
  return sampleOpportunities.map(opp => addOpportunity(opp));
}

// Simulate agent qualifying a lead
export function simulateLeadQualification(opportunityId: string): AgentTask {
  const task = addAgentTask({
    type: "qualify_lead",
    priority: "high",
    input: { opportunityId },
  });
  
  // Simulate processing
  setTimeout(() => {
    updateAgentTask(task.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      output: {
        qualified: true,
        score: 85,
        reasons: ["Budget confirmed", "Decision maker identified", "Timeline is clear"],
        nextAction: "Send discovery meeting invite",
      },
    });
    
    updateOpportunity(opportunityId, { status: "qualified" });
  }, 2000);
  
  return task;
}

// Simulate agent drafting outreach
export function simulateOutreachDraft(opportunityId: string): AgentTask {
  const task = addAgentTask({
    type: "draft_outreach",
    priority: "medium",
    input: { opportunityId },
  });
  
  setTimeout(() => {
    updateAgentTask(task.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      output: {
        subject: "Quick question about your AI automation needs",
        body: "Hi there,\n\nI noticed your post about looking for AI automation help...",
        tone: "professional",
        personalization: "Referenced their recent LinkedIn post",
      },
    });
  }, 3000);
  
  return task;
}

// Get agent stats
export function getAgentStats() {
  const tasks = getAgentTasks();
  const opportunities = getOpportunities();
  const config = getAgentConfig();
  
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.createdAt.startsWith(today));
  
  return {
    enabled: config.enabled,
    totalTasks: tasks.length,
    completedToday: todayTasks.filter(t => t.status === "completed").length,
    failedToday: todayTasks.filter(t => t.status === "failed").length,
    pendingTasks: tasks.filter(t => t.status === "pending").length,
    runningTasks: tasks.filter(t => t.status === "running").length,
    totalOpportunities: opportunities.length,
    newOpportunities: opportunities.filter(o => o.status === "new").length,
    qualifiedOpportunities: opportunities.filter(o => o.status === "qualified").length,
    convertedOpportunities: opportunities.filter(o => o.status === "converted").length,
    potentialValue: opportunities
      .filter(o => ["new", "reviewed", "qualified"].includes(o.status))
      .reduce((sum, o) => sum + o.estimatedValue, 0),
    avgFitScore: opportunities.length > 0
      ? Math.round(opportunities.reduce((sum, o) => sum + o.fitScore, 0) / opportunities.length)
      : 0,
  };
}

// Run the agent (simulated)
export async function runRevenueAgent(): Promise<void> {
  const config = getAgentConfig();
  if (!config.enabled) return;
  
  // 1. Scan for opportunities
  addAgentTask({
    type: "scan_opportunities",
    priority: "high",
    input: { sources: ["LinkedIn", "Twitter", "AngelList", "Clutch"] },
  });
  
  // Simulate finding opportunities
  await new Promise(resolve => setTimeout(resolve, 2000));
  simulateOpportunityScan();
  
  // 2. Auto-qualify new opportunities
  if (config.autoQualify) {
    const newOpps = getOpportunities("new");
    for (const opp of newOpps.slice(0, 3)) {
      simulateLeadQualification(opp.id);
    }
  }
  
  // 3. Draft outreach for qualified leads
  if (config.autoDraft) {
    const qualified = getOpportunities("qualified");
    for (const opp of qualified.slice(0, 2)) {
      simulateOutreachDraft(opp.id);
    }
  }
}

// Pause/resume agent
export function toggleAgent(): boolean {
  const config = getAgentConfig();
  updateAgentConfig({ enabled: !config.enabled });
  return !config.enabled;
}

// Clear all agent data
export function clearAgentData(): void {
  localStorage.removeItem(AGENT_TASKS_KEY);
  localStorage.removeItem(OPPORTUNITIES_KEY);
}

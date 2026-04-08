// CORE BRIM TECH OS — Shared Type Definitions
// Central type registry for all modules

// ═══════════════════════════════════════════════════════════════
// CORE ENTITIES
// ═══════════════════════════════════════════════════════════════

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncableEntity extends BaseEntity {
  syncedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// FOUNDER BRAIN
// ═══════════════════════════════════════════════════════════════

export interface Founder {
  name: string;
  bio: string;
  skills: string[];
  linkedIn?: string;
  twitter?: string;
  github?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  stage: "idea" | "mvp" | "launched" | "growth";
  launchedAt?: string;
}

export interface Competitor {
  id: string;
  name: string;
  description: string;
  threatLevel: "low" | "medium" | "high" | "critical";
  url?: string;
  lastChecked?: string;
}

export interface FounderBrain {
  companyName: string;
  companyMission: string;
  location: string;
  stage: "pre-seed" | "seed" | "series-a" | "series-b" | "bootstrapped";
  founders: Founder[];
  products: Product[];
  competitors: Competitor[];
  coreValues: string[];
  targetMarket: string;
  revenueModel: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// MONEY MODULES
// ═══════════════════════════════════════════════════════════════

export interface Grant {
  id: string;
  name: string;
  organization: string;
  amount: string;
  description: string;
  deadline: string;
  url: string;
  fitScore: number;
  status: "discovered" | "eligible" | "watching" | "applied" | "won" | "rejected";
  requirements: string[];
  eligibility: string[];
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  service: string;
  value: number;
  status: "lead" | "contacted" | "proposal" | "negotiation" | "won" | "lost";
  source: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
  paidAt?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Revenue {
  id: string;
  amount: number;
  currency: string;
  source: "client" | "grant" | "hackathon" | "product" | "other";
  description: string;
  receivedAt: string;
  relatedEntityId?: string;
  createdAt: string;
}

export interface BurnRate {
  monthlyBurn: number;
  runway: number; // months
  lastUpdated: string;
  expenses: Expense[];
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  recurring: boolean;
}

export interface Investor {
  id: string;
  name: string;
  firm?: string;
  type: "angel" | "vc" | "accelerator" | "corporate";
  focus: string[];
  checkSize?: string;
  location?: string;
  website?: string;
  notes?: string;
  status: "researching" | "contacted" | "meeting" | "due-diligence" | "passed";
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  name: string;
  type: "investment" | "partnership" | "acquisition";
  value?: number;
  stage: "initial" | "qualified" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
  probability: number; // 0-100
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTIVITY MODULES
// ═══════════════════════════════════════════════════════════════

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: "objective" | "key-result" | "task";
  status: "active" | "completed" | "paused" | "cancelled";
  priority: "critical" | "high" | "medium" | "low";
  progress: number; // 0-100
  dueDate?: string;
  parentGoalId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  title: string;
  type: "meeting" | "focus" | "brainstorm" | "review" | "planning";
  scheduledAt: string;
  duration: number; // minutes
  attendees?: string[];
  agenda?: string;
  notes?: string;
  outcomes?: string[];
  energyLevel?: number; // 1-10
  createdAt: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  context: string;
  alternatives: string[];
  decision: string;
  rationale: string;
  outcome?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: "product" | "feature" | "business" | "marketing" | "other";
  status: "backlog" | "validating" | "building" | "launched" | "archived";
  priority: "critical" | "high" | "medium" | "low";
  validationNotes?: string;
  launchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// HACKATHON MODULES
// ═══════════════════════════════════════════════════════════════

export interface HackathonListing {
  id: string;
  title: string;
  url: string;
  platform: string;
  prizeDisplay: string;
  prizeTotal: number;
  deadline: string;
  fitScore: number;
  status: "new" | "saved" | "building" | "submitted" | "won" | "lost";
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HackathonProject {
  id: string;
  listingId: string;
  title: string;
  description: string;
  techStack: string[];
  teamMembers: string[];
  repoUrl?: string;
  demoUrl?: string;
  submissionUrl?: string;
  status: "planning" | "building" | "submitted" | "won" | "lost";
  plan?: HackathonPlan;
  createdAt: string;
  updatedAt: string;
}

export interface HackathonPlan {
  mvp: string;
  features: string[];
  timeline: TimelineItem[];
  roles: string[];
  risks: string[];
}

export interface TimelineItem {
  day: number;
  tasks: string[];
  deliverable: string;
}

// ═══════════════════════════════════════════════════════════════
// RESEARCH MODULES
// ═══════════════════════════════════════════════════════════════

export interface ResearchEntry extends BaseEntity {
  topic: string;
  summary: string;
  keyFindings: string[];
  sources: ResearchSource[];
  categories: string[];
  tags: string[];
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  credibility: "very_high" | "high" | "medium" | "low";
  category: string;
  isActive?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// SUPPORT MODULES (from support.ts)
// ═══════════════════════════════════════════════════════════════

export type WinType = "hackathon" | "grant" | "client" | "product" | "media" | "partnership" | "award" | "milestone";

export interface Win extends BaseEntity {
  type: WinType;
  title: string;
  description: string;
  value?: number;
  date: string;
  proof?: string;
  tags: string[];
  featured: boolean;
  lessonsLearned?: string;
  whatWorked?: string;
}

export type KBCategory = "hackathon" | "grant" | "sales" | "product" | "operations" | "finance" | "marketing" | "general";

export interface KBEntry extends BaseEntity {
  title: string;
  content: string;
  category: KBCategory;
  tags: string[];
  source?: string;
  linkedWinId?: string;
  pinned: boolean;
}

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

export interface SOP extends BaseEntity {
  title: string;
  description: string;
  category: SOPCategory;
  trigger: string;
  owner: string;
  estimatedTime: string;
  steps: SOPStep[];
  lastUsed?: string;
  timesUsed: number;
}

export type NotificationType = "deadline" | "opportunity" | "approval" | "win" | "alert" | "reminder" | "system";
export type NotificationPriority = "urgent" | "high" | "medium" | "low";

export interface Notification extends BaseEntity {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  module?: string;
  read: boolean;
  dismissed: boolean;
  actionLabel?: string;
  expiresAt?: string;
}

export type TemplateCategory = "proposal" | "follow_up" | "invoice" | "grant" | "outreach" | "onboarding" | "partnership" | "general";

export interface EmailTemplate extends BaseEntity {
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  variables: string[];
  timesUsed: number;
  isBuiltIn: boolean;
}

export interface ScheduledJob extends BaseEntity {
  skillId: string;
  skillName: string;
  schedule: string;
  nextRun: string;
  lastRun?: string;
  enabled: boolean;
  runCount: number;
}

// ═══════════════════════════════════════════════════════════════
// SKILL ENGINE (from skill-engine.ts)
// ═══════════════════════════════════════════════════════════════

export type SkillStatus = "active" | "paused" | "error" | "running";
export type SkillTrigger = "manual" | "scheduled" | "event";
export type SkillCategory = "revenue" | "research" | "outreach" | "monitoring" | "reporting" | "automation";

export interface SkillConfig {
  [key: string]: string | number | boolean | string[];
}

export interface SkillAction {
  type: "draft" | "alert" | "research" | "submit" | "email" | "telegram";
  title: string;
  description: string;
  data?: object;
  requiresApproval: boolean;
  approved?: boolean;
  executedAt?: string;
}

export interface SkillRun extends BaseEntity {
  skillId: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "success" | "failed";
  output?: string;
  actions?: SkillAction[];
  error?: string;
  tokensUsed?: number;
  costUSD?: number;
}

export interface Skill extends BaseEntity {
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  author: string;
  status: SkillStatus;
  trigger: SkillTrigger;
  schedule?: string;
  config: SkillConfig;
  lastRun?: string;
  nextRun?: string;
  totalRuns: number;
  successRuns: number;
  totalRevenue: number;
  isBuiltIn: boolean;
}

// ═══════════════════════════════════════════════════════════════
// API OPTIMIZER
// ═══════════════════════════════════════════════════════════════

export type ModelName = "claude-haiku-4-5" | "claude-sonnet-4" | "claude-opus-4" | "gemini-2.0-flash" | "gemini-2.0-pro";

export interface ModelConfig {
  name: ModelName;
  provider: "anthropic" | "google";
  costPer1KInput: number;
  costPer1KOutput: number;
  maxTokens: number;
  useCase: string;
}

export interface APICostEntry extends BaseEntity {
  module: string;
  model: ModelName;
  tokensIn: number;
  tokensOut: number;
  costUSD: number;
  cached: boolean;
  prompt?: string;
  response?: string;
}

export interface BudgetConfig {
  monthlyBudget: number;
  alertThreshold: number; // percentage
  hardLimit: number;
  autoDowngrade: boolean;
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

export type SortDirection = "asc" | "desc";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

// ═══════════════════════════════════════════════════════════════
// DATABASE SCHEMA TYPES (for Supabase)
// ═══════════════════════════════════════════════════════════════

export interface DBRecord<T> {
  id: string;
  data: T;
  created_at: string;
  updated_at: string;
}

export type TableName =
  | "founder_brain"
  | "sessions"
  | "tasks"
  | "decisions"
  | "ideas"
  | "goals"
  | "grants"
  | "clients"
  | "revenue"
  | "hackathon_projects"
  | "hackathon_listings"
  | "competitor_reports"
  | "research_library"
  | "wins"
  | "knowledge_base"
  | "sops"
  | "notifications"
  | "templates"
  | "scheduler";

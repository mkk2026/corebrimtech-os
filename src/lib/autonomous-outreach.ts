// CORE BRIM TECH OS — Autonomous Outreach System
// AI-powered lead generation and outreach that runs 24/7

import { getBrain, type FounderBrain } from "./founder-brain";
import { smartCall } from "./api-optimizer";
import { addClient, type Client } from "./money";

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type OutreachSource = "linkedin" | "twitter" | "reddit" | "hackernews" | "manual" | "ai_discovered";
export type OutreachStatus = "discovered" | "qualified" | "message_drafted" | "sent" | "responded" | "converted" | "rejected";

export interface OutreachLead {
  id: string;
  name: string;
  company?: string;
  title?: string;
  source: OutreachSource;
  sourceUrl?: string;
  context: string; // How/where they were found
  painPoints: string[];
  fitScore: number; // 0-100
  status: OutreachStatus;
  message?: string; // AI drafted message
  messageTone: "casual" | "professional" | "warm";
  contactMethod: "email" | "linkedin" | "twitter";
  contactInfo?: string;
  discoveredAt: string;
  lastActionAt: string;
  scheduledFor?: string;
  notes?: string;
  convertedToClientId?: string;
}

export interface OutreachCampaign {
  id: string;
  name: string;
  targetPersona: string;
  targetIndustries: string[];
  messageTemplate: string;
  status: "active" | "paused" | "completed";
  leadsGenerated: number;
  messagesSent: number;
  responses: number;
  conversions: number;
  createdAt: string;
  lastRunAt?: string;
}

export interface OutreachStats {
  totalLeads: number;
  byStatus: Record<OutreachStatus, number>;
  bySource: Record<OutreachSource, number>;
  responseRate: number;
  conversionRate: number;
  thisWeek: number;
  thisMonth: number;
}

// ── STORAGE ───────────────────────────────────────────────────────────────────

const LEADS_KEY = "cbt_os_outreach_leads";
const CAMPAIGNS_KEY = "cbt_os_outreach_campaigns";

export function getOutreachLeads(): OutreachLead[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LEADS_KEY) || "[]")
      .sort((a: OutreachLead, b: OutreachLead) => 
        new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
      );
  } catch { return []; }
}

function saveOutreachLeads(leads: OutreachLead[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function getOutreachCampaigns(): OutreachCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || "[]");
  } catch { return []; }
}

function saveOutreachCampaigns(campaigns: OutreachCampaign[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

// ── LEAD MANAGEMENT ───────────────────────────────────────────────────────────

export function addOutreachLead(lead: Omit<OutreachLead, "id" | "discoveredAt" | "lastActionAt">): OutreachLead {
  const newLead: OutreachLead = {
    ...lead,
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    discoveredAt: new Date().toISOString(),
    lastActionAt: new Date().toISOString(),
  };
  
  const leads = getOutreachLeads();
  leads.unshift(newLead);
  saveOutreachLeads(leads);
  
  return newLead;
}

export function updateOutreachLead(id: string, updates: Partial<OutreachLead>): void {
  const leads = getOutreachLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx >= 0) {
    leads[idx] = { ...leads[idx], ...updates, lastActionAt: new Date().toISOString() };
    saveOutreachLeads(leads);
  }
}

export function deleteOutreachLead(id: string): void {
  const leads = getOutreachLeads().filter(l => l.id !== id);
  saveOutreachLeads(leads);
}

export function convertLeadToClient(leadId: string): Client | null {
  const lead = getOutreachLeads().find(l => l.id === leadId);
  if (!lead) return null;
  
  const client = addClient({
    name: lead.name,
    company: lead.company,
    source: `Outreach: ${lead.source}`,
    service: "To be determined",
    value: 0,
    currency: "USD",
    status: "lead",
    probability: lead.fitScore,
    notes: `Discovered via autonomous outreach. Context: ${lead.context}. Pain points: ${lead.painPoints.join(", ")}`,
  });
  
  updateOutreachLead(leadId, { 
    status: "converted", 
    convertedToClientId: client.id 
  });
  
  return client;
}

// ── AI-POWERED FUNCTIONS ──────────────────────────────────────────────────────

function buildFounderContext(): string {
  const brain = getBrain();
  if (!brain || !brain.setupComplete) {
    return "Company: Core Brim Tech - Building AI-powered tools for founders from Sierra Leone";
  }
  
  const founder = brain.founders[0];
  return `
Company: ${brain.companyName}
Tagline: ${brain.companyTagline}
Mission: ${brain.companyMission}
Founder: ${founder?.name || "Founder"}
Location: ${brain.location}
Services: Web development, AI integration, technical consulting
Target: Startups and SMEs in emerging markets
`;
}

// Generate personalized outreach message
export async function generateOutreachMessage(
  lead: OutreachLead,
  apiKey?: string
): Promise<string> {
  const founderContext = buildFounderContext();
  
  const prompt = `FOUNDER CONTEXT:
${founderContext}

LEAD INFORMATION:
Name: ${lead.name}
${lead.company ? `Company: ${lead.company}` : ""}
${lead.title ? `Title: ${lead.title}` : ""}
Source: ${lead.source}
Context: ${lead.context}
Pain Points: ${lead.painPoints.join(", ")}

Write a ${lead.messageTone} outreach message to ${lead.name}.

Requirements:
1. Reference their specific situation/context
2. Show you understand their pain points
3. Briefly mention how you can help (without being salesy)
4. Include a clear, low-friction CTA
5. Keep it under 150 words
6. Sound like a human, not a template

The message should feel like it was written specifically for them after researching their work.`;

  try {
    const message = await smartCall({
      task: "custom",
      prompt,
      maxTokens: 400,
      apiKey,
    });
    
    return message.trim();
  } catch (e) {
    return `Hi ${lead.name},\n\nI came across your work${lead.company ? ` at ${lead.company}` : ""} and was impressed by what you're building.\n\nI help startups with technical development and AI integration. Given ${lead.painPoints[0] || "the challenges in our space"}, I thought there might be a fit.\n\nWould you be open to a brief conversation?\n\nBest regards`;
  }
}

// Analyze a lead's potential fit
export async function analyzeLeadFit(
  name: string,
  context: string,
  source: OutreachSource,
  apiKey?: string
): Promise<{ fitScore: number; painPoints: string[]; recommendedApproach: string }> {
  const founderContext = buildFounderContext();
  
  const prompt = `FOUNDER CONTEXT:
${founderContext}

LEAD TO ANALYZE:
Name: ${name}
Source: ${source}
Context: ${context}

Analyze this potential lead and provide:
1. Fit score (0-100) - how likely they need our services
2. 3-5 likely pain points they have
3. Recommended approach tone (casual/professional/warm)

Respond in JSON format:
{
  "fitScore": number,
  "painPoints": ["string"],
  "recommendedApproach": "casual" | "professional" | "warm"
}`;

  try {
    const response = await smartCall({
      task: "custom",
      prompt,
      maxTokens: 500,
      apiKey,
    });
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch { /* fallback below */ }
  
  return {
    fitScore: 50,
    painPoints: ["Technical challenges", "Need for automation", "Scaling issues"],
    recommendedApproach: "professional",
  };
}

// ── CAMPAIGN MANAGEMENT ───────────────────────────────────────────────────────

export function createCampaign(campaign: Omit<OutreachCampaign, "id" | "createdAt" | "leadsGenerated" | "messagesSent" | "responses" | "conversions">): OutreachCampaign {
  const newCampaign: OutreachCampaign = {
    ...campaign,
    id: `camp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    leadsGenerated: 0,
    messagesSent: 0,
    responses: 0,
    conversions: 0,
  };
  
  const campaigns = getOutreachCampaigns();
  campaigns.unshift(newCampaign);
  saveOutreachCampaigns(campaigns);
  
  return newCampaign;
}

export function updateCampaign(id: string, updates: Partial<OutreachCampaign>): void {
  const campaigns = getOutreachCampaigns();
  const idx = campaigns.findIndex(c => c.id === id);
  if (idx >= 0) {
    campaigns[idx] = { ...campaigns[idx], ...updates };
    saveOutreachCampaigns(campaigns);
  }
}

// ── STATS ─────────────────────────────────────────────────────────────────────

export function getOutreachStats(): OutreachStats {
  const leads = getOutreachLeads();
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;
  
  const byStatus: Record<OutreachStatus, number> = {
    discovered: 0, qualified: 0, message_drafted: 0, sent: 0,
    responded: 0, converted: 0, rejected: 0,
  };
  
  const bySource: Record<OutreachSource, number> = {
    linkedin: 0, twitter: 0, reddit: 0, hackernews: 0, manual: 0, ai_discovered: 0,
  };
  
  leads.forEach(lead => {
    byStatus[lead.status]++;
    bySource[lead.source]++;
  });
  
  const sent = leads.filter(l => ["sent", "responded", "converted"].includes(l.status));
  const responded = leads.filter(l => ["responded", "converted"].includes(l.status));
  
  return {
    totalLeads: leads.length,
    byStatus,
    bySource,
    responseRate: sent.length > 0 ? Math.round((responded.length / sent.length) * 100) : 0,
    conversionRate: sent.length > 0 ? Math.round((byStatus.converted / sent.length) * 100) : 0,
    thisWeek: leads.filter(l => new Date(l.discoveredAt).getTime() > weekAgo).length,
    thisMonth: leads.filter(l => new Date(l.discoveredAt).getTime() > monthAgo).length,
  };
}

// ── AUTONOMOUS ACTIONS ────────────────────────────────────────────────────────

// Get leads ready for next action
export function getLeadsReadyForAction(): OutreachLead[] {
  const leads = getOutreachLeads();
  const now = Date.now();
  
  return leads.filter(lead => {
    // Drafted messages ready to send
    if (lead.status === "message_drafted" && !lead.scheduledFor) return true;
    
    // Sent messages needing follow-up (after 5 days)
    if (lead.status === "sent") {
      const lastAction = new Date(lead.lastActionAt).getTime();
      return now - lastAction > 5 * 86400000;
    }
    
    // Scheduled messages ready to go
    if (lead.scheduledFor && new Date(lead.scheduledFor).getTime() <= now) {
      return true;
    }
    
    return false;
  });
}

// Schedule batch of messages
export function scheduleOutreachBatch(leadIds: string[], date: string): void {
  leadIds.forEach(id => {
    updateOutreachLead(id, { scheduledFor: date, status: "message_drafted" });
  });
}

// Mark messages as sent
export function markMessagesAsSent(leadIds: string[]): void {
  leadIds.forEach(id => {
    updateOutreachLead(id, { status: "sent", scheduledFor: undefined });
  });
  
  // Update campaign stats
  const campaigns = getOutreachCampaigns();
  if (campaigns.length > 0) {
    campaigns[0].messagesSent += leadIds.length;
    campaigns[0].lastRunAt = new Date().toISOString();
    saveOutreachCampaigns(campaigns);
  }
}

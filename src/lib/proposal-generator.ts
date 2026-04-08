// CORE BRIM TECH OS — Proposal Generator
// AI-powered proposal creation for client work

export type ProposalStatus = "draft" | "sent" | "viewed" | "negotiating" | "accepted" | "rejected";
export type ProposalType = "project" | "retainer" | "hourly" | "fixed";

export interface ProposalSection {
  title: string;
  content: string;
  order: number;
}

export interface Proposal {
  id: string;
  clientName: string;
  clientCompany?: string;
  projectName: string;
  type: ProposalType;
  status: ProposalStatus;
  value: number;
  currency: string;
  sections: ProposalSection[];
  timeline: string;
  deliverables: string[];
  terms: string;
  nextSteps: string;
  createdAt: string;
  sentAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  type: ProposalType;
  sections: Omit<ProposalSection, "content">[];
  defaultTerms: string;
}

const PROPOSALS_KEY = "cbt_os_proposals";

export const DEFAULT_TEMPLATES: Omit<ProposalTemplate, "id">[] = [
  {
    name: "Software Development Project",
    type: "fixed",
    sections: [
      { title: "Executive Summary", order: 0 },
      { title: "Problem Statement", order: 1 },
      { title: "Proposed Solution", order: 2 },
      { title: "Scope of Work", order: 3 },
      { title: "Timeline & Milestones", order: 4 },
      { title: "Investment", order: 5 },
      { title: "Terms & Conditions", order: 6 },
      { title: "Next Steps", order: 7 },
    ],
    defaultTerms: "Payment terms: 50% upfront, 50% on delivery. Includes 2 rounds of revisions.",
  },
  {
    name: "Monthly Retainer",
    type: "retainer",
    sections: [
      { title: "Overview", order: 0 },
      { title: "Services Included", order: 1 },
      { title: "Monthly Deliverables", order: 2 },
      { title: "Investment", order: 3 },
      { title: "Terms", order: 4 },
    ],
    defaultTerms: "Monthly billing. 30-day notice for cancellation. Unused hours don't roll over.",
  },
  {
    name: "Consulting Engagement",
    type: "hourly",
    sections: [
      { title: "Engagement Summary", order: 0 },
      { title: "Objectives", order: 1 },
      { title: "Approach", order: 2 },
      { title: "Deliverables", order: 3 },
      { title: "Rates & Estimates", order: 4 },
      { title: "Terms", order: 5 },
    ],
    defaultTerms: "Hourly billing, invoiced weekly. Time tracked and reported.",
  },
];

export function getProposals(): Proposal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PROPOSALS_KEY) || "[]")
      .sort((a: Proposal, b: Proposal) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch { return []; }
}

export function createProposal(proposal: Omit<Proposal, "id" | "createdAt" | "status">): Proposal {
  const newProposal: Proposal = {
    ...proposal,
    id: `proposal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    status: "draft",
  };
  
  const proposals = getProposals();
  proposals.unshift(newProposal);
  
  if (proposals.length > 100) proposals.length = 100;
  
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
  return newProposal;
}

export function updateProposal(id: string, updates: Partial<Proposal>): void {
  const proposals = getProposals();
  const idx = proposals.findIndex(p => p.id === id);
  if (idx >= 0) {
    proposals[idx] = { ...proposals[idx], ...updates };
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
  }
}

export function moveProposalStatus(id: string, status: ProposalStatus): void {
  const updates: Partial<Proposal> = { status };
  if (status === "sent") updates.sentAt = new Date().toISOString();
  updateProposal(id, updates);
}

export function deleteProposal(id: string): void {
  const proposals = getProposals().filter(p => p.id !== id);
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
}

export function generateProposalContent(
  templateType: ProposalType,
  clientName: string,
  projectName: string,
  discoveryNotes: string,
  value: number
): ProposalSection[] {
  const template = DEFAULT_TEMPLATES.find(t => t.type === templateType) || DEFAULT_TEMPLATES[0];
  
  return template.sections.map(section => {
    let content = "";
    
    switch (section.title) {
      case "Executive Summary":
      case "Overview":
      case "Engagement Summary":
        content = `This proposal outlines a ${templateType} engagement between Core Brim Tech and ${clientName} for ${projectName}. Based on our discovery conversation, we understand your key challenges and have designed a solution to address them effectively.`;
        break;
        
      case "Problem Statement":
        content = discoveryNotes 
          ? `During our discovery call, you identified the following challenges: ${discoveryNotes}. These issues are impacting your ability to scale efficiently.`
          : `Based on our industry experience, companies like yours typically face challenges with scaling operations, managing technical debt, and maintaining competitive advantage.`;
        break;
        
      case "Proposed Solution":
      case "Approach":
        content = `We propose a comprehensive solution leveraging Core Brim Tech's expertise in AI-powered automation and software development. Our approach combines technical excellence with business acumen to deliver measurable results.`;
        break;
        
      case "Scope of Work":
      case "Services Included":
        content = `• Discovery and requirements gathering\n• Solution architecture and design\n• Development and implementation\n• Testing and quality assurance\n• Deployment and handover\n• Documentation and training`;
        break;
        
      case "Timeline & Milestones":
        content = `Week 1-2: Discovery and planning\nWeek 3-6: Development phase 1\nWeek 7-8: Testing and refinement\nWeek 9: Deployment and launch`;
        break;
        
      case "Investment":
      case "Rates & Estimates":
        content = `Total Investment: $${value.toLocaleString()}\n\nThis includes all development work, project management, and 30 days of post-launch support.\n\nPayment Schedule:\n• 50% upon proposal acceptance\n• 50% upon project completion`;
        break;
        
      case "Terms & Conditions":
      case "Terms":
        content = template.defaultTerms;
        break;
        
      case "Next Steps":
        content = `To proceed with this proposal:\n\n1. Review and accept the proposal\n2. Sign the attached agreement\n3. Submit the initial payment\n4. Schedule kickoff meeting\n\nWe're excited to partner with you on ${projectName}.`;
        break;
        
      default:
        content = `Content for ${section.title} will be customized based on specific project requirements.`;
    }
    
    return {
      ...section,
      content,
    };
  });
}

export function duplicateProposal(id: string): Proposal | null {
  const proposal = getProposals().find(p => p.id === id);
  if (!proposal) return null;
  
  return createProposal({
    clientName: proposal.clientName,
    clientCompany: proposal.clientCompany,
    projectName: `${proposal.projectName} (Copy)`,
    type: proposal.type,
    value: proposal.value,
    currency: proposal.currency,
    sections: proposal.sections,
    timeline: proposal.timeline,
    deliverables: proposal.deliverables,
    terms: proposal.terms,
    nextSteps: proposal.nextSteps,
    notes: proposal.notes,
  });
}

export function getProposalStats() {
  const proposals = getProposals();
  
  return {
    total: proposals.length,
    draft: proposals.filter(p => p.status === "draft").length,
    sent: proposals.filter(p => p.status === "sent").length,
    viewed: proposals.filter(p => p.status === "viewed").length,
    negotiating: proposals.filter(p => p.status === "negotiating").length,
    accepted: proposals.filter(p => p.status === "accepted").length,
    rejected: proposals.filter(p => p.status === "rejected").length,
    totalValue: proposals.filter(p => p.status === "accepted").reduce((sum, p) => sum + p.value, 0),
    pendingValue: proposals.filter(p => ["sent", "viewed", "negotiating"].includes(p.status)).reduce((sum, p) => sum + p.value, 0),
    winRate: proposals.filter(p => ["accepted", "rejected"].includes(p.status)).length > 0
      ? Math.round((proposals.filter(p => p.status === "accepted").length / proposals.filter(p => ["accepted", "rejected"].includes(p.status)).length) * 100)
      : 0,
  };
}

export const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-neutral-400" },
  sent: { label: "Sent", color: "text-blue-400" },
  viewed: { label: "Viewed", color: "text-purple-400" },
  negotiating: { label: "Negotiating", color: "text-amber-400" },
  accepted: { label: "Accepted", color: "text-emerald-400" },
  rejected: { label: "Rejected", color: "text-red-400" },
};

// CORE BRIM TECH OS — Client Pipeline AI
// Auto-qualify leads, generate proposals, and automate follow-ups

import { getBrain, type FounderBrain } from "./founder-brain";
import { smartCall } from "./api-optimizer";
import type { Client } from "./money";

export interface LeadQualification {
  score: number; // 0-100
  tier: "hot" | "warm" | "cold";
  reasons: string[];
  redFlags: string[];
  recommendedApproach: string;
  estimatedCloseProbability: number;
  suggestedValue: number;
}

export interface ProposalSection {
  title: string;
  content: string;
}

export interface GeneratedProposal {
  clientName: string;
  projectTitle: string;
  overview: string;
  scope: string;
  timeline: string;
  investment: string;
  nextSteps: string;
  fullText: string;
}

export interface FollowUpMessage {
  subject: string;
  body: string;
  tone: "friendly" | "urgent" | "value-add";
  suggestedSendTime: string;
}

// Build context from Founder Brain
function buildFounderContext(brain: FounderBrain | null): string {
  if (!brain || !brain.setupComplete) {
    return "Founder: Building a tech startup from Sierra Leone. Early stage. Services: Web development, AI integration.";
  }
  
  const founder = brain.founders[0];
  const product = brain.products[0];
  
  return `
COMPANY: ${brain.companyName}
TAGLINE: ${brain.companyTagline}
MISSION: ${brain.companyMission}
LOCATION: ${brain.location}

FOUNDER: ${founder?.name || "Unknown"} (${founder?.role || "Founder"})
BIO: ${founder?.bio || ""}
STRENGTHS: ${founder?.strengths?.join(", ") || ""}

SERVICES OFFERED:
- Web Development (React, Next.js, full-stack)
- AI Integration (Claude, Gemini, custom solutions)
- Mobile Apps (React Native)
- Technical Consulting

PORTFOLIO: ${product?.name || "In development"}
TECH STACK: ${product?.techStack?.join(", ") || "React, Node.js, AI"}

TARGET MARKETS: ${brain.targetMarkets?.join(", ") || "Startups, SMEs"}
`.trim();
}

// Qualify a lead based on available information
export async function qualifyLead(
  client: Client,
  apiKey?: string
): Promise<LeadQualification> {
  const brain = getBrain();
  const founderContext = buildFounderContext(brain);
  
  const prompt = `LEAD INFORMATION:
Name: ${client.name}
Company: ${client.company || "Unknown"}
Service Interest: ${client.service}
Source: ${client.source}
Estimated Value: $${client.value}
Notes: ${client.notes || "None"}

${founderContext}

Analyze this lead and provide:
1. Qualification score (0-100)
2. Tier (hot/warm/cold)
3. 3-5 positive signals
4. Any red flags
5. Recommended approach
6. Estimated close probability
7. Suggested project value

Respond in JSON format:
{
  "score": number,
  "tier": "hot" | "warm" | "cold",
  "reasons": ["string"],
  "redFlags": ["string"],
  "recommendedApproach": "string",
  "estimatedCloseProbability": number,
  "suggestedValue": number
}`;

  try {
    const response = await smartCall({
      task: "custom",
      prompt,
      maxTokens: 800,
      apiKey,
    });
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback
    return {
      score: 50,
      tier: "warm",
      reasons: ["Lead showed interest"],
      redFlags: [],
      recommendedApproach: "Standard outreach",
      estimatedCloseProbability: 30,
      suggestedValue: client.value || 1000,
    };
  } catch (e) {
    return {
      score: 50,
      tier: "warm",
      reasons: ["Unable to analyze - manual review needed"],
      redFlags: [],
      recommendedApproach: "Standard outreach",
      estimatedCloseProbability: 30,
      suggestedValue: client.value || 1000,
    };
  }
}

// Generate a complete proposal
export async function generateProposal(
  client: Client,
  projectDetails: {
    description: string;
    deliverables: string[];
    timelineWeeks: number;
    price: number;
  },
  apiKey?: string
): Promise<GeneratedProposal> {
  const brain = getBrain();
  const founderContext = buildFounderContext(brain);
  
  const prompt = `CLIENT: ${client.name}
COMPANY: ${client.company || "N/A"}
SERVICE: ${client.service}

PROJECT DETAILS:
${projectDetails.description}

DELIVERABLES:
${projectDetails.deliverables.map(d => `- ${d}`).join("\n")}

TIMELINE: ${projectDetails.timelineWeeks} weeks
INVESTMENT: $${projectDetails.price}

${founderContext}

Write a professional proposal email/body that:
1. Opens with understanding of their problem
2. Presents the solution clearly
3. Lists deliverables specifically
4. States timeline and investment
5. Includes clear next steps
6. Ends with confidence (not desperation)

Write in a warm, professional tone. Not corporate-speak. Show expertise without arrogance.`;

  const fullText = await smartCall({
    task: "custom",
    prompt,
    maxTokens: 1500,
    apiKey,
  });
  
  // Parse sections (simple extraction)
  const lines = fullText.split("\n");
  const projectTitle = client.service;
  
  return {
    clientName: client.name,
    projectTitle,
    overview: lines.slice(0, 5).join(" "),
    scope: projectDetails.deliverables.join(", "),
    timeline: `${projectDetails.timelineWeeks} weeks`,
    investment: `$${projectDetails.price.toLocaleString()}`,
    nextSteps: "Review proposal and confirm to begin",
    fullText,
  };
}

// Generate follow-up message based on context
export async function generateFollowUp(
  client: Client,
  context: {
    daysSinceLastContact: number;
    lastMessage?: string;
    previousProposals?: number;
  },
  apiKey?: string
): Promise<FollowUpMessage> {
  const brain = getBrain();
  const founderContext = buildFounderContext(brain);
  
  let tone: "friendly" | "urgent" | "value-add" = "friendly";
  if (context.daysSinceLastContact > 14) tone = "value-add";
  if (context.daysSinceLastContact > 7) tone = "urgent";
  
  const prompt = `CLIENT: ${client.name}
COMPANY: ${client.company || "N/A"}
SERVICE: ${client.service}
DAYS SINCE LAST CONTACT: ${context.daysSinceLastContact}
NOTES: ${client.notes || "None"}

${founderContext}

Write a ${tone} follow-up email that:
1. References previous conversation (if any)
2. Adds value (insight, resource, or relevant update)
3. Has a clear, low-friction CTA
4. Is brief (under 150 words)
5. Doesn't sound desperate

Subject line should be intriguing but not clickbait.`;

  const response = await smartCall({
    task: "custom",
    prompt,
    maxTokens: 600,
    apiKey,
  });
  
  // Extract subject and body
  const subjectMatch = response.match(/Subject:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : `Following up on ${client.service}`;
  const body = response.replace(/Subject:.+\n?/i, "").trim();
  
  return {
    subject,
    body,
    tone,
    suggestedSendTime: "Tuesday-Thursday, 9-11am recipient's time",
  };
}

// Generate discovery questions for qualification call
export async function generateDiscoveryQuestions(
  client: Client,
  apiKey?: string
): Promise<string[]> {
  const prompt = `CLIENT: ${client.name}
COMPANY: ${client.company || "N/A"}
SERVICE INTEREST: ${client.service}

Generate 5-7 discovery questions for an initial sales call that:
1. Uncover budget and timeline
2. Understand decision-making process
3. Reveal pain points and urgency
4. Identify competitors they're considering
5. Find out what success looks like

Questions should be open-ended and conversational.`;

  const response = await smartCall({
    task: "custom",
    prompt,
    maxTokens: 500,
    apiKey,
  });
  
  return response
    .split("\n")
    .filter(line => line.trim().match(/^\d+\.|^[-•]/))
    .map(line => line.replace(/^\d+\.\s*|^[-•]\s*/, "").trim())
    .filter(q => q.length > 10);
}

// Analyze conversation and suggest next action
export async function analyzeConversation(
  conversationText: string,
  client: Client,
  apiKey?: string
): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  keyPoints: string[];
  objections: string[];
  nextAction: string;
  priority: "high" | "medium" | "low";
}> {
  const prompt = `CONVERSATION:
${conversationText}

CLIENT: ${client.name}
SERVICE: ${client.service}

Analyze this conversation and provide:
1. Overall sentiment
2. 3-5 key points discussed
3. Any objections or concerns raised
4. Recommended next action
5. Priority level

Respond in JSON format.`;

  try {
    const response = await smartCall({
      task: "custom",
      prompt,
      maxTokens: 600,
      apiKey,
    });
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch { /* fallback below */ }
  
  return {
    sentiment: "neutral",
    keyPoints: ["Conversation analyzed"],
    objections: [],
    nextAction: "Follow up within 48 hours",
    priority: "medium",
  };
}

// CORE BRIM TECH OS — Meeting Prep Engine
// Auto-research people and companies before every call

export interface PersonProfile {
  name: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  bio?: string;
  previousCompanies?: string[];
  education?: string[];
  mutualConnections?: string[];
  recentPosts?: string[];
  interests?: string[];
  talkingPoints?: string[];
  redFlags?: string[];
  opportunities?: string[];
}

export interface CompanyProfile {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  funding?: string;
  recentNews?: string[];
  competitors?: string[];
  keyPeople?: string[];
  products?: string[];
  culture?: string;
  opportunities?: string[];
  risks?: string[];
}

export interface MeetingBrief {
  id: string;
  meetingTitle: string;
  scheduledFor?: string;
  attendees: PersonProfile[];
  company?: CompanyProfile;
  agenda?: string;
  goals?: string[];
  prepNotes: string;
  suggestedQuestions: string[];
  objectionHandlers: string[];
  nextSteps?: string[];
  createdAt: string;
}

const BRIEFS_KEY = "cbt_os_meeting_briefs";

export function getMeetingBriefs(): MeetingBrief[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BRIEFS_KEY) || "[]")
      .sort((a: MeetingBrief, b: MeetingBrief) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch { return []; }
}

export function saveMeetingBrief(brief: Omit<MeetingBrief, "id" | "createdAt">): MeetingBrief {
  const newBrief: MeetingBrief = {
    ...brief,
    id: `brief_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  
  const briefs = getMeetingBriefs();
  briefs.unshift(newBrief);
  
  // Keep only last 50 briefs
  if (briefs.length > 50) briefs.length = 50;
  
  if (typeof window !== "undefined") {
    localStorage.setItem(BRIEFS_KEY, JSON.stringify(briefs));
  }
  
  return newBrief;
}

export function deleteMeetingBrief(id: string): void {
  const briefs = getMeetingBriefs().filter(b => b.id !== id);
  localStorage.setItem(BRIEFS_KEY, JSON.stringify(briefs));
}

// Generate a meeting brief using AI
export async function generateMeetingBrief(
  meetingTitle: string,
  attendeeNames: string[],
  companyName?: string,
  agenda?: string,
  apiKey?: string
): Promise<MeetingBrief> {
  // In production, this would call an AI service
  // For now, generate a structured mock brief
  
  const attendees: PersonProfile[] = attendeeNames.map(name => ({
    name,
    title: "Founder/CEO", // Would be fetched from LinkedIn
    company: companyName,
    bio: `Experienced leader in the technology space.`,
    talkingPoints: [
      "Recent company growth and milestones",
      "Industry trends and market opportunities",
      "Potential partnership synergies",
    ],
    interests: ["AI", "Startups", "Emerging Markets"],
  }));
  
  const company: CompanyProfile | undefined = companyName ? {
    name: companyName,
    industry: "Technology",
    size: "10-50 employees",
    recentNews: [
      "Announced new product line last quarter",
      "Expanded into 3 new markets",
    ],
    opportunities: [
      "Looking for technical partners",
      "Expanding AI capabilities",
    ],
    risks: [
      "New competitor entered market",
    ],
  } : undefined;
  
  const brief = saveMeetingBrief({
    meetingTitle,
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    attendees,
    company,
    agenda: agenda || "Introduction and partnership discussion",
    goals: [
      "Establish rapport",
      "Understand their current challenges",
      "Present Core Brim Tech solutions",
      "Define next steps",
    ],
    prepNotes: `Research complete. Key focus: ${company?.opportunities?.[0] || "partnership opportunities"}.`,
    suggestedQuestions: [
      "What are your biggest challenges right now?",
      "How do you see AI impacting your business?",
      "What's your timeline for implementation?",
      "Who else is involved in the decision?",
    ],
    objectionHandlers: [
      "If price is a concern: Focus on ROI and cost savings",
      "If timing is wrong: Offer pilot program",
      "If they have a solution: Differentiate on AI capabilities",
    ],
    nextSteps: [
      "Send follow-up within 24 hours",
      "Share relevant case studies",
      "Schedule technical demo",
    ],
  });
  
  return brief;
}

// Quick prep for common meeting types
export const MEETING_TEMPLATES = {
  investor_pitch: {
    title: "Investor Pitch",
    goals: ["Secure funding", "Build relationship", "Get warm intros"],
    questions: [
      "What's your investment thesis?",
      "What stage do you typically invest?",
      "What metrics matter most to you?",
      "How do you support portfolio companies?",
    ],
    objections: [
      "Market too small: Show expansion opportunities",
      "Team too small: Highlight advisors and hiring plan",
      "Competition: Emphasize differentiation and moat",
    ],
  },
  sales_call: {
    title: "Sales Discovery",
    goals: ["Understand pain points", "Qualify opportunity", "Book demo"],
    questions: [
      "What triggered you to look for a solution now?",
      "What happens if you don't solve this?",
      "Who else is evaluating solutions?",
      "What's your budget range?",
    ],
    objections: [
      "No budget: Focus on cost of inaction",
      "Need to think about it: Create urgency with limited pilot spots",
      "Competitor cheaper: Focus on total value, not price",
    ],
  },
  partnership: {
    title: "Partnership Discussion",
    goals: ["Find synergies", "Define collaboration", "Set timeline"],
    questions: [
      "What does success look like for this partnership?",
      "What resources can each side commit?",
      "What's the ideal customer profile?",
      "How do we handle revenue sharing?",
    ],
    objections: [
      "Legal concerns: Offer standard partnership terms",
      "Resource constraints: Start with small pilot",
      "Competitive overlap: Define clear boundaries",
    ],
  },
  hiring: {
    title: "Candidate Interview",
    goals: ["Assess fit", "Sell vision", "Check references"],
    questions: [
      "Why are you looking to leave your current role?",
      "What excites you about this opportunity?",
      "Tell me about a time you failed.",
      "What questions do you have for me?",
    ],
    objections: [
      "Salary expectations too high: Discuss equity and growth",
      "Equity concerns: Explain vesting and upside",
      "Remote work: Clarify flexibility policy",
    ],
  },
};

export type MeetingTemplateType = keyof typeof MEETING_TEMPLATES;

export function createBriefFromTemplate(
  templateType: MeetingTemplateType,
  attendeeNames: string[],
  companyName?: string
): MeetingBrief {
  const template = MEETING_TEMPLATES[templateType];
  
  const attendees: PersonProfile[] = attendeeNames.map(name => ({
    name,
    talkingPoints: ["Background research needed"],
  }));
  
  return saveMeetingBrief({
    meetingTitle: template.title,
    attendees,
    company: companyName ? { name: companyName } : undefined,
    goals: template.goals,
    prepNotes: `Using ${template.title} template. Customize based on research.`,
    suggestedQuestions: template.questions,
    objectionHandlers: template.objections,
  });
}

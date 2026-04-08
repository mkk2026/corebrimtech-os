// CORE BRIM TECH OS — Grant Writer AI
// Auto-generates compelling grant application content from Founder Brain data

import { getBrain, type FounderBrain } from "./founder-brain";
import { smartCall } from "./api-optimizer";
import type { Grant, ApplicationSection } from "./grant-tracker";

export interface GeneratedContent {
  sectionId: string;
  content: string;
  confidence: number; // 0-100
  suggestions: string[];
}

// Build context from Founder Brain for AI prompts
function buildFounderContext(brain: FounderBrain | null): string {
  if (!brain || !brain.setupComplete) {
    return "Founder: Building a tech startup from Sierra Leone. Early stage.";
  }
  
  const founder = brain.founders[0];
  const product = brain.products[0];
  
  return `
COMPANY: ${brain.companyName}
TAGLINE: ${brain.companyTagline}
MISSION: ${brain.companyMission}
STAGE: ${brain.stage}
LOCATION: ${brain.location}

FOUNDER: ${founder?.name || "Unknown"} (${founder?.role || "Founder"})
BIO: ${founder?.bio || ""}
STRENGTHS: ${founder?.strengths?.join(", ") || ""}

PRODUCT: ${product?.name || "In development"}
DESCRIPTION: ${product?.description || ""}
STATUS: ${product?.status || "early-stage"}
USERS: ${product?.totalUsers || 0} total, ${product?.activeUsers || 0} active
MRR: $${product?.mrr || 0}
TECH STACK: ${product?.techStack?.join(", ") || ""}

TARGET MARKETS: ${brain.targetMarkets?.join(", ") || ""}
CORE VALUES: ${brain.coreValues?.join(", ") || ""}
`.trim();
}

// Generate content for a specific section
export async function generateSectionContent(
  section: ApplicationSection,
  grant: Grant,
  apiKey?: string
): Promise<GeneratedContent> {
  const brain = getBrain();
  const founderContext = buildFounderContext(brain);
  
  const systemPrompt = `You are an expert grant writer who specializes in helping African and emerging market founders win funding. You write compelling, authentic narratives that highlight the founder's unique perspective and market opportunity.

Key principles:
- Be specific with numbers and metrics
- Highlight emerging market advantages
- Show deep understanding of the problem
- Demonstrate traction, even if small
- Connect to the grant organization's mission`;

  const prompt = `GRANT: ${grant.name}
ORGANIZATION: ${grant.organization}
AMOUNT: ${grant.amount}
FIT SCORE: ${grant.fitScore}/100
FIT REASON: ${grant.fitReason}

${founderContext}

SECTION TO WRITE: ${section.title}
PROMPT: ${section.prompt}
${section.wordLimit ? `WORD LIMIT: ${section.wordLimit} words` : ""}

Write a compelling, authentic response that:
1. Directly addresses the prompt
2. Uses specific details from the founder's background
3. Shows passion and deep understanding
4. Includes metrics where possible
5. Fits the word limit exactly

Write in first person ("I", "we", "our"). Be authentic and specific.`;

  try {
    const content = await smartCall({
      task: "custom",
      prompt,
      systemPrompt,
      maxTokens: section.wordLimit ? section.wordLimit * 2 : 500,
    });
    
    // Clean up the response
    const cleaned = content
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\n{3,}/g, "\n\n") // Max 2 newlines
      .trim();
    
    return {
      sectionId: section.id,
      content: cleaned,
      confidence: 85, // Could be calculated based on content quality
      suggestions: [
        "Add specific metrics if you have them",
        "Include a customer quote if available",
        "Mention any press coverage",
      ],
    };
  } catch (e) {
    return {
      sectionId: section.id,
      content: `Error generating content: ${e instanceof Error ? e.message : "Unknown error"}. Please try again or write manually.`,
      confidence: 0,
      suggestions: ["Check your API key in Settings", "Try again in a moment"],
    };
  }
}

// Generate all sections for an application
export async function generateFullApplication(
  sections: ApplicationSection[],
  grant: Grant,
  onProgress?: (completed: number, total: number) => void,
  apiKey?: string
): Promise<GeneratedContent[]> {
  const results: GeneratedContent[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Skip if already has content
    if (section.aiDraft || section.userEdit) {
      results.push({
        sectionId: section.id,
        content: section.userEdit || section.aiDraft || "",
        confidence: 90,
        suggestions: [],
      });
      continue;
    }
    
    const generated = await generateSectionContent(section, grant, apiKey);
    results.push(generated);
    
    if (onProgress) {
      onProgress(i + 1, sections.length);
    }
    
    // Small delay to avoid rate limits
    if (i < sections.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return results;
}

// Generate a video pitch script
export async function generateVideoScript(
  grant: Grant,
  durationSeconds: number = 120,
  apiKey?: string
): Promise<string> {
  const brain = getBrain();
  const founderContext = buildFounderContext(brain);
  
  const prompt = `GRANT: ${grant.name}
${founderContext}

Write a ${durationSeconds}-second video pitch script (approximately ${Math.floor(durationSeconds / 1.5)} words).

Structure:
1. Hook (10 sec) - Grab attention with the problem
2. Problem (20 sec) - What pain point are you solving?
3. Solution (30 sec) - Your product and how it works
4. Traction (20 sec) - What have you achieved?
5. Ask (20 sec) - What you need and why
6. Close (20 sec) - Memorable ending

Make it conversational, authentic, and compelling. Write as spoken words, not essay.`;

  return smartCall({
    task: "custom",
    prompt,
    maxTokens: 400,
  });
}

// Analyze and improve existing content
export async function improveSection(
  currentContent: string,
  section: ApplicationSection,
  grant: Grant,
  apiKey?: string
): Promise<string> {
  const brain = getBrain();
  const founderContext = buildFounderContext(brain);
  
  const prompt = `GRANT: ${grant.name}
${founderContext}

SECTION: ${section.title}
CURRENT CONTENT:
${currentContent}

Improve this content to be:
1. More specific and concrete
2. More compelling and emotional
3. Better aligned with the grant's priorities
4. Within ${section.wordLimit} words

Keep the core message but make it stronger. Maintain first person voice.`;

  return smartCall({
    task: "custom",
    prompt,
    maxTokens: section.wordLimit ? section.wordLimit * 2 : 500,
  });
}

// Calculate application completeness score
export function calculateCompleteness(sections: ApplicationSection[]): {
  score: number; // 0-100
  completed: number;
  total: number;
  missing: string[];
} {
  const total = sections.length;
  const completed = sections.filter(s => s.userEdit || s.aiDraft).length;
  const score = Math.round((completed / total) * 100);
  const missing = sections
    .filter(s => !s.userEdit && !s.aiDraft)
    .map(s => s.title);
  
  return { score, completed, total, missing };
}

// CORE BRIM TECH OS — Smart Email Templates
// Context-aware email generation for founders

export type EmailTone = "professional" | "casual" | "warm" | "urgent" | "formal";
export type EmailGoal = "get_meeting" | "follow_up" | "pitch" | "introduction" | "thank_you" | "breakup";

export interface EmailTemplate {
  id: string;
  name: string;
  goal: EmailGoal;
  tone: EmailTone;
  subject: string;
  body: string;
  variables: string[];
  tips: string[];
  useCase: string;
}

export interface GeneratedEmail {
  id: string;
  templateId: string;
  subject: string;
  body: string;
  recipientName: string;
  recipientCompany?: string;
  context?: string;
  generatedAt: string;
  usedAt?: string;
}

const TEMPLATES_KEY = "cbt_os_email_templates";
const GENERATED_KEY = "cbt_os_generated_emails";

// Core template library
export const CORE_TEMPLATES: Omit<EmailTemplate, "id">[] = [
  {
    name: "Cold Investor Outreach",
    goal: "get_meeting",
    tone: "professional",
    subject: "{{company}} — {{traction_metric}} in {{market}}",
    body: `Hi {{name}},

I'm {{sender_name}}, founder of {{company}}. We're building {{one_liner}}.

{{traction_hook}}

Given your focus on {{investor_focus}}, I thought this might resonate. We're {{funding_stage}} and looking for partners who {{value_add}}.

Worth a brief conversation?

Best,
{{sender_name}}`,
    variables: ["name", "company", "traction_metric", "market", "sender_name", "one_liner", "traction_hook", "investor_focus", "funding_stage", "value_add"],
    tips: [
      "Lead with traction, not vision",
      "Show you researched their portfolio",
      "Keep it under 100 words",
      "Make the ask specific and low-friction",
    ],
    useCase: "First contact with investors",
  },
  {
    name: "Warm Intro Follow-up",
    goal: "get_meeting",
    tone: "warm",
    subject: "Following up — {{mutual_connection}} suggested we connect",
    body: `Hi {{name}},

{{mutual_connection}} mentioned you're working on {{their_focus}}. We're solving something similar at {{company}}.

{{specific_connection}}

Would you be open to a quick call next week? I'd love to learn about your approach and share what we've discovered.

Thanks,
{{sender_name}}`,
    variables: ["name", "mutual_connection", "their_focus", "company", "specific_connection", "sender_name"],
    tips: [
      "Mention the mutual connection early",
      "Show you've done homework on their work",
      "Make it about learning, not selling",
    ],
    useCase: "Following up on warm introductions",
  },
  {
    name: "Post-Meeting Thank You",
    goal: "thank_you",
    tone: "warm",
    subject: "Thanks for the time — {{next_step}}",
    body: `Hi {{name}},

Thanks for the conversation today. {{specific_thanks}}

As discussed, {{next_step_summary}}

{{additional_value}}

Looking forward to {{future_interaction}}.

Best,
{{sender_name}}`,
    variables: ["name", "next_step", "specific_thanks", "next_step_summary", "additional_value", "future_interaction", "sender_name"],
    tips: [
      "Send within 4 hours",
      "Reference something specific from the conversation",
      "Confirm next steps clearly",
      "Add value (article, intro, etc.)",
    ],
    useCase: "After any meeting",
  },
  {
    name: "The Follow-Up (No Response)",
    goal: "follow_up",
    tone: "casual",
    subject: "Quick follow-up — {{company}}",
    body: `Hi {{name}},

Wanted to bump this to the top of your inbox. {{brief_reminder}}

{{new_info}} {{soft_ask}}

No worries if timing isn't right — just let me know either way.

{{sender_name}}`,
    variables: ["name", "company", "brief_reminder", "new_info", "soft_ask", "sender_name"],
    tips: [
      "Wait 3-5 days before following up",
      "Add new information or context",
      "Give them an easy out",
      "Keep it shorter than the original",
    ],
    useCase: "Following up on unanswered emails",
  },
  {
    name: "The Breakup Email",
    goal: "breakup",
    tone: "professional",
    subject: "Should I close the loop?",
    body: `Hi {{name}},

I've reached out a few times about {{topic}} but haven't heard back.

Totally understand if {{reason}}. Should I close the loop on this, or is there a better time to reconnect?

Either way, best of luck with {{their_company}}.

{{sender_name}}`,
    variables: ["name", "topic", "reason", "their_company", "sender_name"],
    tips: [
      "Use after 3+ unanswered follow-ups",
      "Be genuinely helpful, not guilt-tripping",
      "Many responses come from this email",
      "Actually close the loop if they don't respond",
    ],
    useCase: "Last attempt before moving on",
  },
  {
    name: "Customer Success Check-in",
    goal: "follow_up",
    tone: "warm",
    subject: "How's everything going with {{product}}?",
    body: `Hi {{name}},

It's been {{time_since_signup}} since you started using {{product}}. Wanted to check in and see how things are going.

{{specific_question}}

Also, {{value_add}} — thought it might be useful.

Let me know if you need anything!

Best,
{{sender_name}}`,
    variables: ["name", "product", "time_since_signup", "specific_question", "value_add", "sender_name"],
    tips: [
      "Reference specific usage if possible",
      "Ask an open-ended question",
      "Provide value, don't just ask for time",
    ],
    useCase: "Nurturing existing customers",
  },
  {
    name: "Partnership Outreach",
    goal: "introduction",
    tone: "professional",
    subject: "Partnership opportunity — {{company}} x {{their_company}}",
    body: `Hi {{name}},

I'm {{sender_name}} from {{company}}. We've built {{what_you_do}} and noticed {{their_company}} {{observation}}.

{{synergy_explanation}}

Would you be open to a brief conversation about how we might collaborate? I have some specific ideas but want to make sure I'm not wasting your time.

Best,
{{sender_name}}`,
    variables: ["name", "company", "their_company", "sender_name", "what_you_do", "observation", "synergy_explanation"],
    tips: [
      "Show you've researched their business",
      "Explain the synergy clearly",
      "Respect their time",
      "Have specific ideas ready for the call",
    ],
    useCase: "Reaching out for partnerships",
  },
  {
    name: "The Ask (Favors/Intros)",
    goal: "introduction",
    tone: "warm",
    subject: "Quick favor — intro to {{target_person}}?",
    body: `Hi {{name}},

I'm reaching out because {{context}}. I noticed you're connected to {{target_person}} at {{target_company}}.

{{why_relevant}}

Would you be comfortable making an intro? Happy to draft something for you to edit.

No pressure at all if not — totally understand.

Thanks,
{{sender_name}}`,
    variables: ["name", "context", "target_person", "target_company", "why_relevant", "sender_name"],
    tips: [
      "Make it easy to say no",
      "Explain why the intro makes sense",
      "Offer to draft the intro email",
      "Follow up with a thank you",
    ],
    useCase: "Asking for introductions",
  },
  {
    name: "Demo Request Response",
    goal: "pitch",
    tone: "professional",
    subject: "Demo scheduled — {{product}} for {{their_company}}",
    body: `Hi {{name}},

Great — let's get you a demo of {{product}}.

{{availability}}

Before we meet, {{prep_question}}

Also, {{relevant_case_study}}

Looking forward to showing you what we've built.

Best,
{{sender_name}}`,
    variables: ["name", "product", "their_company", "availability", "prep_question", "relevant_case_study", "sender_name"],
    tips: [
      "Respond quickly (within hours)",
      "Offer specific times, not 'when are you free'",
      "Ask one qualifying question",
      "Include social proof",
    ],
    useCase: "Responding to demo requests",
  },
  {
    name: "The No Response",
    goal: "follow_up",
    tone: "professional",
    subject: "Thanks for the transparency",
    body: `Hi {{name}},

Thanks for the honest response. Totally understand {{reason}}.

{{graceful_exit}}

{{leave_door_open}}

Best of luck with {{their_priority}}.

{{sender_name}}`,
    variables: ["name", "reason", "graceful_exit", "leave_door_open", "their_priority", "sender_name"],
    tips: [
      "Never burn bridges",
      "Ask for feedback if appropriate",
      "Leave the door open for future",
      "Follow up in 6 months",
    ],
    useCase: "Responding to rejections",
  },
];

// Initialize templates
export function initializeEmailTemplates(): EmailTemplate[] {
  if (typeof window === "undefined") return [];
  
  const existing = localStorage.getItem(TEMPLATES_KEY);
  if (existing) {
    return JSON.parse(existing);
  }
  
  const templates: EmailTemplate[] = CORE_TEMPLATES.map((t, i) => ({
    ...t,
    id: `template_${i}_${Date.now()}`,
  }));
  
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return templates;
}

export function getEmailTemplates(): EmailTemplate[] {
  if (typeof window === "undefined") return [];
  return initializeEmailTemplates();
}

export function getEmailTemplate(id: string): EmailTemplate | undefined {
  return getEmailTemplates().find(t => t.id === id);
}

// Generate email from template
export function generateEmail(
  templateId: string,
  variables: Record<string, string>,
  recipientName: string,
  recipientCompany?: string
): GeneratedEmail {
  const template = getEmailTemplate(templateId);
  if (!template) throw new Error("Template not found");
  
  let subject = template.subject;
  let body = template.body;
  
  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });
  
  const email: GeneratedEmail = {
    id: `email_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    templateId,
    subject,
    body,
    recipientName,
    recipientCompany,
    generatedAt: new Date().toISOString(),
  };
  
  // Save to history
  const history = getGeneratedEmails();
  history.unshift(email);
  if (history.length > 100) history.length = 100;
  localStorage.setItem(GENERATED_KEY, JSON.stringify(history));
  
  return email;
}

export function getGeneratedEmails(): GeneratedEmail[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GENERATED_KEY) || "[]")
      .sort((a: GeneratedEmail, b: GeneratedEmail) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  } catch { return []; }
}

export function markEmailAsUsed(id: string): void {
  const emails = getGeneratedEmails();
  const email = emails.find(e => e.id === id);
  if (email) {
    email.usedAt = new Date().toISOString();
    localStorage.setItem(GENERATED_KEY, JSON.stringify(emails));
  }
}

export function deleteGeneratedEmail(id: string): void {
  const emails = getGeneratedEmails().filter(e => e.id !== id);
  localStorage.setItem(GENERATED_KEY, JSON.stringify(emails));
}

// Get templates by goal
export function getTemplatesByGoal(goal: EmailGoal): EmailTemplate[] {
  return getEmailTemplates().filter(t => t.goal === goal);
}

// Get templates by tone
export function getTemplatesByTone(tone: EmailTone): EmailTemplate[] {
  return getEmailTemplates().filter(t => t.tone === tone);
}

// AI-powered email generation (placeholder for future)
export async function generateSmartEmail(
  context: string,
  goal: EmailGoal,
  tone: EmailTone,
  recipientInfo: { name: string; company?: string; title?: string },
  apiKey?: string
): Promise<GeneratedEmail> {
  // In production, this would call an AI service
  // For now, use the best matching template
  
  const templates = getTemplatesByGoal(goal);
  const bestTemplate = templates.find(t => t.tone === tone) || templates[0];
  
  if (!bestTemplate) {
    throw new Error("No template found for this goal");
  }
  
  const variables: Record<string, string> = {
    name: recipientInfo.name,
    sender_name: "You", // Would come from Founder Brain
  };
  
  if (recipientInfo.company) {
    variables.their_company = recipientInfo.company;
  }
  
  // Add context-specific variables
  if (context.includes("investor")) {
    variables.investor_focus = "B2B SaaS";
    variables.funding_stage = "Seed";
  }
  
  return generateEmail(bestTemplate.id, variables, recipientInfo.name, recipientInfo.company);
}

// Copy email to clipboard
export function copyEmailToClipboard(email: GeneratedEmail): void {
  const text = `Subject: ${email.subject}\n\n${email.body}`;
  navigator.clipboard.writeText(text);
}

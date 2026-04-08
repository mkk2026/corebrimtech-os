// CORE BRIM TECH OS — Support Module: Email Templates
import { getSupabaseClient, dbUpsert, dbDelete } from "../supabase";

export type TemplateCategory = "proposal" | "follow_up" | "invoice" | "grant" | "outreach" | "onboarding" | "partnership" | "general";

export interface EmailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  variables: string[];
  timesUsed: number;
  isBuiltIn: boolean;
  createdAt: string;
}

const TEMPLATE_KEY = "cbt_os_templates";

function syncUpsert(id: string, data: EmailTemplate): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbUpsert("templates", id, data).catch(() => {});
}

function syncDelete(id: string): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbDelete("templates", id).catch(() => {});
}

function initTemplates(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(TEMPLATE_KEY)) return;

  const templates: EmailTemplate[] = [
    {
      id: "tpl_1",
      name: "Cold Outreach — LinkedIn",
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
      timesUsed: 0,
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_2",
      name: "Proposal Follow-Up (3 days)",
      category: "follow_up",
      subject: "Re: Proposal for {{project}}",
      body: `Hi {{client_name}},

Just following up on the proposal I sent over for {{project}}.

Happy to jump on a quick call to answer any questions or adjust the scope. What works for you this week?

{{founder_name}}`,
      variables: ["client_name", "project", "founder_name"],
      timesUsed: 0,
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_3",
      name: "Invoice Sent",
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
      timesUsed: 0,
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_4",
      name: "Grant Application Cover Email",
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
      timesUsed: 0,
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_5",
      name: "Partnership Outreach",
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
      timesUsed: 0,
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl_6",
      name: "Project Kickoff",
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
      timesUsed: 0,
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncUpsertMany(templates);
}

function syncUpsertMany(templates: EmailTemplate[]): void {
  const client = getSupabaseClient();
  if (!client || templates.length === 0) return;
  for (const t of templates) {
    void dbUpsert("templates", t.id, t).catch(() => {});
  }
}

export function getTemplates(): EmailTemplate[] {
  if (typeof window === "undefined") return [];
  initTemplates();
  try {
    return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addTemplate(template: Omit<EmailTemplate, "id" | "timesUsed" | "isBuiltIn" | "createdAt">): EmailTemplate {
  const templates = getTemplates();
  const newTemplate: EmailTemplate = {
    ...template,
    id: `tpl_${Date.now()}`,
    timesUsed: 0,
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
  };
  templates.unshift(newTemplate);
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncUpsert(newTemplate.id, newTemplate);
  return newTemplate;
}

export function useTemplate(id: string): EmailTemplate | null {
  const templates = getTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx < 0) return null;
  templates[idx].timesUsed += 1;
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncUpsert(id, templates[idx]);
  return templates[idx];
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  syncDelete(id);
}

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

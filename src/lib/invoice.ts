// CORE BRIM TECH OS — Invoice Generator
// Professional invoices. Collect your money.

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
  paymentInstructions?: string;
  createdAt: string;
  paidAt?: string;
  sentAt?: string;
}

const KEY = "cbt_os_invoices";
const COUNTER_KEY = "cbt_os_invoice_counter";

function load(): Invoice[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function persist(data: Invoice[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

function nextInvoiceNumber(): string {
  if (typeof window === "undefined") return "INV-001";
  const count = parseInt(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  localStorage.setItem(COUNTER_KEY, String(count));
  return `INV-${String(count).padStart(3, "0")}`;
}

export function calcTotals(items: InvoiceItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function getInvoices(): Invoice[] {
  return load().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getInvoice(id: string): Invoice | null {
  return load().find(i => i.id === id) || null;
}

export function createInvoice(data: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "subtotal" | "taxAmount" | "total">): Invoice {
  const invoices = load();
  const { subtotal, taxAmount, total } = calcTotals(data.items, data.taxRate);
  const invoice: Invoice = {
    ...data,
    id: `inv_${Date.now()}`,
    invoiceNumber: nextInvoiceNumber(),
    subtotal,
    taxAmount,
    total,
    createdAt: new Date().toISOString(),
  };
  invoices.unshift(invoice);
  persist(invoices);
  return invoice;
}

export function updateInvoice(id: string, updates: Partial<Invoice>): void {
  const invoices = load();
  const idx = invoices.findIndex(i => i.id === id);
  if (idx >= 0) {
    const updated = { ...invoices[idx], ...updates };
    if (updates.items || updates.taxRate !== undefined) {
      const { subtotal, taxAmount, total } = calcTotals(
        updates.items || invoices[idx].items,
        updates.taxRate ?? invoices[idx].taxRate
      );
      Object.assign(updated, { subtotal, taxAmount, total });
    }
    if (updates.status === "paid" && !invoices[idx].paidAt) updated.paidAt = new Date().toISOString();
    if (updates.status === "sent" && !invoices[idx].sentAt) updated.sentAt = new Date().toISOString();
    invoices[idx] = updated;
    persist(invoices);
  }
}

export function deleteInvoice(id: string): void {
  persist(load().filter(i => i.id !== id));
}

export function getInvoiceStats() {
  const invoices = load();
  const paid = invoices.filter(i => i.status === "paid");
  const outstanding = invoices.filter(i => ["sent", "draft"].includes(i.status));
  const overdue = invoices.filter(i => {
    if (i.status !== "sent") return false;
    return new Date(i.dueDate) < new Date();
  });
  return {
    total: invoices.length,
    draft: invoices.filter(i => i.status === "draft").length,
    sent: invoices.filter(i => i.status === "sent").length,
    paid: paid.length,
    overdue: overdue.length,
    totalPaid: paid.reduce((s, i) => s + i.total, 0),
    totalOutstanding: outstanding.reduce((s, i) => s + i.total, 0),
    totalOverdue: overdue.reduce((s, i) => s + i.total, 0),
  };
}

// ── INVOICE CHASER ────────────────────────────────────────────────────────────

export interface ChaserMessage {
  id: string;
  invoiceId: string;
  type: "reminder" | "overdue" | "final" | "paid_thanks";
  tone: "friendly" | "firm" | "urgent";
  subject: string;
  body: string;
  generatedAt: string;
  sentAt?: string;
  status: "draft" | "sent" | "scheduled";
  scheduledFor?: string;
}

const CHASER_KEY = "cbt_os_chaser_messages";

export function getChaserMessages(invoiceId?: string): ChaserMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(CHASER_KEY) || "[]");
    if (invoiceId) return all.filter((m: ChaserMessage) => m.invoiceId === invoiceId);
    return all.sort((a: ChaserMessage, b: ChaserMessage) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  } catch { return []; }
}

function saveChaserMessages(messages: ChaserMessage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHASER_KEY, JSON.stringify(messages));
}

export function generateChaserMessage(
  invoice: Invoice,
  type: ChaserMessage["type"],
  tone: ChaserMessage["tone"] = "friendly"
): ChaserMessage {
  const daysOverdue = Math.floor(
    (Date.now() - new Date(invoice.dueDate).getTime()) / 86400000
  );
  
  let subject = "";
  let body = "";
  
  const amount = `${invoice.currency} ${invoice.total.toFixed(2)}`;
  const invoiceNum = invoice.invoiceNumber;
  
  switch (type) {
    case "reminder":
      subject = `Friendly reminder: Invoice ${invoiceNum} due ${daysOverdue > 0 ? `was due ${daysOverdue} days ago` : "soon"}`;
      body = `Hi ${invoice.clientName.split(" ")[0]},

I hope you're doing well. I wanted to send a quick reminder about invoice ${invoiceNum} for ${amount}.

${daysOverdue > 0 
  ? `This was due on ${new Date(invoice.dueDate).toLocaleDateString()}. If you've already sent payment, please disregard this message.` 
  : `This is due on ${new Date(invoice.dueDate).toLocaleDateString()}.`}

Please let me know if you have any questions or need anything from me.

Best regards`;
      break;
      
    case "overdue":
      subject = `Invoice ${invoiceNum} - Payment Overdue`;
      body = `Hi ${invoice.clientName.split(" ")[0]},

I'm following up on invoice ${invoiceNum} for ${amount}, which was due on ${new Date(invoice.dueDate).toLocaleDateString()} (${daysOverdue} days ago).

Could you please confirm when payment will be processed? If there's an issue or you need to discuss payment terms, I'm happy to talk.

Invoice details: ${invoiceNum}
Amount: ${amount}
Due date: ${new Date(invoice.dueDate).toLocaleDateString()}

Thank you for your attention to this.`;
      break;
      
    case "final":
      subject = `URGENT: Final notice - Invoice ${invoiceNum}`;
      body = `Hi ${invoice.clientName.split(" ")[0]},

This is a final notice regarding invoice ${invoiceNum} for ${amount}, which is now ${daysOverdue} days overdue.

To avoid further action, please arrange payment within 48 hours. If you're experiencing difficulties, please contact me immediately so we can discuss options.

I value our working relationship and hope to resolve this amicably.

Invoice: ${invoiceNum}
Amount: ${amount}
Days overdue: ${daysOverdue}`;
      break;
      
    case "paid_thanks":
      subject = `Thank you for your payment!`;
      body = `Hi ${invoice.clientName.split(" ")[0]},

Thank you for your payment of ${amount} for invoice ${invoiceNum}. 

I really enjoyed working with you on this project. If you ever need anything in the future, please don't hesitate to reach out.

Best regards`;
      break;
  }
  
  const message: ChaserMessage = {
    id: `chaser_${Date.now()}`,
    invoiceId: invoice.id,
    type,
    tone,
    subject,
    body,
    generatedAt: new Date().toISOString(),
    status: "draft",
  };
  
  const messages = getChaserMessages();
  messages.unshift(message);
  saveChaserMessages(messages);
  
  return message;
}

export function markChaserSent(messageId: string): void {
  const messages = getChaserMessages();
  const msg = messages.find(m => m.id === messageId);
  if (msg) {
    msg.status = "sent";
    msg.sentAt = new Date().toISOString();
    saveChaserMessages(messages);
  }
}

export function scheduleChaser(messageId: string, date: string): void {
  const messages = getChaserMessages();
  const msg = messages.find(m => m.id === messageId);
  if (msg) {
    msg.status = "scheduled";
    msg.scheduledFor = date;
    saveChaserMessages(messages);
  }
}

export function deleteChaser(messageId: string): void {
  const messages = getChaserMessages().filter(m => m.id !== messageId);
  saveChaserMessages(messages);
}

// Get overdue invoices that need chasing
export function getOverdueInvoicesNeedingChaser(): Invoice[] {
  const invoices = getInvoices();
  const chasers = getChaserMessages();
  
  return invoices.filter(inv => {
    if (inv.status !== "sent") return false;
    const daysOverdue = Math.floor(
      (Date.now() - new Date(inv.dueDate).getTime()) / 86400000
    );
    if (daysOverdue < 3) return false; // Only chase after 3 days
    
    // Check if already chased recently
    const recentChaser = chasers.find(c => 
      c.invoiceId === inv.id && 
      c.status === "sent" &&
      new Date(c.sentAt || c.generatedAt).getTime() > Date.now() - 7 * 86400000
    );
    
    return !recentChaser;
  });
}

// Generate printable HTML for an invoice
export function generateInvoiceHTML(invoice: Invoice, companyName: string, companyEmail: string, location: string): string {
  const fmt = (n: number) => `${invoice.currency} ${n.toFixed(2)}`;
  const itemRows = invoice.items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${item.description}</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(item.rate)}</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold;">${fmt(item.total)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#111;margin:0;padding:40px;max-width:800px;margin:0 auto;}
  .header{display:flex;justify-content:space-between;align-items:start;margin-bottom:48px;}
  .logo{font-size:20px;font-weight:900;letter-spacing:-0.5px;}
  .badge{background:#fbbf24;color:#000;font-weight:800;font-size:11px;padding:4px 10px;border-radius:20px;}
  .invoice-meta{text-align:right;}
  .invoice-num{font-size:28px;font-weight:900;color:#111;}
  .section{margin-bottom:32px;}
  .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px;}
  table{width:100%;border-collapse:collapse;margin-top:16px;}
  th{background:#f9f9f9;padding:10px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#666;border-bottom:2px solid #eee;}
  th:last-child,th:nth-child(2),th:nth-child(3){text-align:right;}
  th:nth-child(2){text-align:center;}
  .totals{display:flex;justify-content:flex-end;margin-top:24px;}
  .totals-box{width:280px;}
  .totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;border-bottom:1px solid #f0f0f0;}
  .totals-total{display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:900;border-top:2px solid #111;margin-top:4px;}
  .status-badge{display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;}
  .status-paid{background:#dcfce7;color:#166534;}
  .status-sent{background:#fef9c3;color:#854d0e;}
  .status-draft{background:#f3f4f6;color:#374151;}
  .notes{background:#f9f9f9;border-radius:8px;padding:16px;font-size:13px;color:#555;margin-top:24px;}
  .footer{margin-top:48px;padding-top:24px;border-top:1px solid #eee;font-size:12px;color:#aaa;text-align:center;}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">${companyName}</div>
    <div style="font-size:13px;color:#666;margin-top:4px;">${location}</div>
    <div style="font-size:13px;color:#666;">${companyEmail}</div>
  </div>
  <div class="invoice-meta">
    <div class="invoice-num">${invoice.invoiceNumber}</div>
    <div style="margin-top:8px;"><span class="status-badge status-${invoice.status}">${invoice.status}</span></div>
    <div style="font-size:13px;color:#666;margin-top:8px;">Issued: ${invoice.issueDate}</div>
    <div style="font-size:13px;color:#666;">Due: ${invoice.dueDate}</div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px;">
  <div class="section">
    <div class="label">Bill To</div>
    <div style="font-weight:700;font-size:16px;">${invoice.clientName}</div>
    ${invoice.clientCompany ? `<div style="color:#555;">${invoice.clientCompany}</div>` : ""}
    ${invoice.clientEmail ? `<div style="color:#555;">${invoice.clientEmail}</div>` : ""}
    ${invoice.clientAddress ? `<div style="color:#555;">${invoice.clientAddress}</div>` : ""}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Description</th>
      <th style="text-align:center;">Qty</th>
      <th style="text-align:right;">Rate</th>
      <th style="text-align:right;">Amount</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals">
  <div class="totals-box">
    <div class="totals-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
    ${invoice.taxRate > 0 ? `<div class="totals-row"><span>Tax (${invoice.taxRate}%)</span><span>${fmt(invoice.taxAmount)}</span></div>` : ""}
    <div class="totals-total"><span>Total Due</span><span>${fmt(invoice.total)}</span></div>
  </div>
</div>

${invoice.paymentInstructions ? `<div class="notes"><strong>Payment Instructions:</strong><br>${invoice.paymentInstructions}</div>` : ""}
${invoice.notes ? `<div class="notes" style="margin-top:12px;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ""}

<div class="footer">
  ${companyName} · Thank you for your business · Generated by CBT OS
</div>
</body>
</html>`;
}

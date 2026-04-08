"use client";

import { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, Download, CheckCircle,
  Clock, AlertCircle, DollarSign, Send, Eye, X, Bell
} from "lucide-react";
import {
  getInvoices, createInvoice, updateInvoice, deleteInvoice,
  getInvoiceStats, generateInvoiceHTML, getOverdueInvoicesNeedingChaser,
  type Invoice, type InvoiceItem
} from "@/lib/invoice";
import { getBrain } from "@/lib/founder-brain";
import { getClients } from "@/lib/money";
import InvoiceChaser from "./InvoiceChaser";

const STATUS_CONFIG = {
  draft:     { label: "Draft",     color: "text-neutral-400 bg-neutral-800 border-neutral-700" },
  sent:      { label: "Sent",      color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  paid:      { label: "Paid ✓",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  overdue:   { label: "Overdue",   color: "text-red-400 bg-red-400/10 border-red-400/20" },
  cancelled: { label: "Cancelled", color: "text-neutral-600 bg-neutral-900 border-neutral-800" },
};

function fmt(n: number, currency = "USD") { return `${currency} ${n.toFixed(2)}`; }

function InvoicePreview({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const brain = getBrain();
  const html = generateInvoiceHTML(
    invoice,
    brain?.companyName || "Core Brim Tech",
    brain?.founders[0]?.email || "hello@corebrimtech.com",
    brain?.location || "Freetown, Sierra Leone"
  );

  function handlePrint() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
          <span className="text-sm font-bold text-neutral-800">Invoice Preview — {invoice.invoiceNumber}</span>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 bg-neutral-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors">
              <Download className="w-3 h-3" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <iframe srcDoc={html} className="w-full h-full min-h-[600px]" title="Invoice Preview" />
        </div>
      </div>
    </div>
  );
}

function NewInvoiceForm({ onDone }: { onDone: () => void }) {
  const clients = getClients().filter(c => c.status === "won");
  const brain = getBrain();

  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientCompany: "", clientAddress: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    currency: "USD", taxRate: 0, notes: "",
    paymentInstructions: brain?.founders[0]?.email ? `Bank transfer or mobile money. Contact ${brain.founders[0].email} for details.` : "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "item_1", description: "", quantity: 1, rate: 0, total: 0 },
  ]);

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: typeof value === "string" ? value : Number(value) };
      if (field === "quantity" || field === "rate") updated.total = updated.quantity * updated.rate;
      return updated;
    }));
  }

  function addItem() {
    setItems(prev => [...prev, { id: `item_${Date.now()}`, description: "", quantity: 1, rate: 0, total: 0 }]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function fillFromClient(clientId: string) {
    const client = clients.find(c => c.id === clientId);
    if (client) setForm(f => ({ ...f, clientName: client.name, clientEmail: client.email || "", clientCompany: client.company || "" }));
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = subtotal * (form.taxRate / 100);
  const total = subtotal + tax;

  function handleCreate() {
    if (!form.clientName || items.every(i => !i.description)) return;
    createInvoice({ ...form, items, status: "draft", clientId: undefined });
    onDone();
  }

  return (
    <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-6 space-y-5">
      <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">New Invoice</div>

      {clients.length > 0 && (
        <div>
          <label className="text-xs text-neutral-500 block mb-1.5">Fill from Client Pipeline</label>
          <select onChange={e => fillFromClient(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors">
            <option value="">— Select a client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `— ${c.company}` : ""}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-500 block mb-1.5">Client Name *</label>
          <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="John Smith" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1.5">Client Email</label>
          <input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="client@email.com" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1.5">Company</label>
          <input value={form.clientCompany} onChange={e => setForm(f => ({ ...f, clientCompany: e.target.value }))} placeholder="Company name" className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1.5">Currency</label>
          <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors">
            {["USD", "GBP", "EUR", "SLL", "NGN", "GHS", "KES"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1.5">Issue Date</label>
          <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1.5">Due Date</label>
          <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-neutral-500 uppercase tracking-widest font-mono">Line Items</label>
          <button onClick={addItem} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="Service description" className="col-span-6 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors" />
              <input value={item.quantity} onChange={e => updateItem(item.id, "quantity", e.target.value)} type="number" min="1" className="col-span-2 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 text-center transition-colors" />
              <input value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} type="number" min="0" placeholder="Rate" className="col-span-2 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors" />
              <div className="col-span-1 text-xs font-mono text-neutral-400 text-right">{item.total.toFixed(0)}</div>
              <button onClick={() => removeItem(item.id)} className="col-span-1 text-neutral-700 hover:text-red-400 transition-colors flex justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span className="font-mono">{fmt(subtotal, form.currency)}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 text-xs">Tax %</span>
            <input value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))} type="number" min="0" max="100" className="w-16 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 text-center transition-colors" />
            <span className="text-neutral-600 text-xs ml-auto font-mono">{fmt(tax, form.currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-neutral-200 pt-2 border-t border-neutral-700">
            <span>Total</span><span className="font-mono text-emerald-400">{fmt(total, form.currency)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500 block mb-1.5">Payment Instructions</label>
        <textarea value={form.paymentInstructions} onChange={e => setForm(f => ({ ...f, paymentInstructions: e.target.value }))} rows={2} placeholder="Bank details, mobile money, etc." className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
      </div>

      <div>
        <label className="text-xs text-neutral-500 block mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any additional notes..." className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleCreate} className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
          Create Invoice
        </button>
        <button onClick={onDone} className="text-neutral-500 text-sm px-4 py-2.5 hover:text-neutral-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice, onUpdate }: { invoice: Invoice; onUpdate: () => void }) {
  const [previewing, setPreviewing] = useState(false);
  const statusCfg = STATUS_CONFIG[invoice.status];
  const isOverdue = invoice.status === "sent" && new Date(invoice.dueDate) < new Date();

  return (
    <>
      {previewing && <InvoicePreview invoice={invoice} onClose={() => setPreviewing(false)} />}
      <div className={`bg-neutral-900 border rounded-xl p-5 flex items-center gap-4 ${isOverdue ? "border-red-400/20" : "border-neutral-800"}`}>
        <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-neutral-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-bold text-neutral-200 font-mono">{invoice.invoiceNumber}</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusCfg.color}`}>{statusCfg.label}</span>
            {isOverdue && <span className="text-xs text-red-400 font-mono">OVERDUE</span>}
          </div>
          <p className="text-xs text-neutral-500">{invoice.clientName}{invoice.clientCompany ? ` — ${invoice.clientCompany}` : ""}</p>
          <p className="text-xs text-neutral-700 font-mono">Due: {invoice.dueDate}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-neutral-200 font-mono">{fmt(invoice.total, invoice.currency)}</p>
          <p className="text-xs text-neutral-600">{invoice.items.length} item{invoice.items.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setPreviewing(true)} className="text-neutral-600 hover:text-amber-400 p-1.5 transition-colors" title="Preview">
            <Eye className="w-4 h-4" />
          </button>
          {invoice.status === "draft" && (
            <button onClick={() => { updateInvoice(invoice.id, { status: "sent" }); onUpdate(); }} className="text-neutral-600 hover:text-blue-400 p-1.5 transition-colors" title="Mark Sent">
              <Send className="w-4 h-4" />
            </button>
          )}
          {invoice.status === "sent" && (
            <button onClick={() => { updateInvoice(invoice.id, { status: "paid" }); onUpdate(); }} className="text-neutral-600 hover:text-emerald-400 p-1.5 transition-colors" title="Mark Paid">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => { deleteInvoice(invoice.id); onUpdate(); }} className="text-neutral-700 hover:text-red-400 p-1.5 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function InvoiceGenerator() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState(getInvoiceStats());
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"all" | Invoice["status"]>("all");
  const [showChaser, setShowChaser] = useState(false);
  const [overdueNeedingChaser, setOverdueNeedingChaser] = useState(0);

  useEffect(() => { refresh(); }, []);
  function refresh() { 
    setInvoices(getInvoices()); 
    setStats(getInvoiceStats()); 
    setOverdueNeedingChaser(getOverdueInvoicesNeedingChaser().length);
  }

  const filtered = invoices.filter(i => filter === "all" || i.status === filter);

  if (showChaser) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <InvoiceChaser onBack={() => { setShowChaser(false); refresh(); }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Invoice Generator</div>
            <h2 className="text-xl font-bold text-neutral-100">Get Paid. Professionally.</h2>
            <p className="text-sm text-neutral-500 mt-1">Create, track, and download invoices. Collect every dollar you earn.</p>
          </div>
          <button 
            onClick={() => setShowChaser(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Bell className="w-4 h-4" />
            Chaser
            {overdueNeedingChaser > 0 && (
              <span className="bg-blue-400/30 text-blue-100 text-xs px-2 py-0.5 rounded-full">
                {overdueNeedingChaser}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Paid",       value: `$${stats.totalPaid.toFixed(0)}`,       color: "text-emerald-400" },
            { label: "Outstanding",      value: `$${stats.totalOutstanding.toFixed(0)}`, color: "text-amber-400" },
            { label: "Overdue",          value: stats.overdue,                            color: "text-red-400" },
            { label: "Total Invoices",   value: stats.total,                              color: "text-neutral-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-neutral-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(["all", "draft", "sent", "paid", "overdue"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${filter === f ? "border-amber-400/40 text-amber-400 bg-amber-400/10" : "border-neutral-800 text-neutral-600 hover:text-neutral-300"}`}>{f}</button>
            ))}
          </div>
          <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>

        {showNew && <NewInvoiceForm onDone={() => { refresh(); setShowNew(false); }} />}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-neutral-800 mx-auto mb-3" />
              <p className="text-sm text-neutral-600">No invoices yet. Create your first one to start getting paid properly.</p>
            </div>
          ) : filtered.map(invoice => (
            <InvoiceRow key={invoice.id} invoice={invoice} onUpdate={refresh} />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Check, Clock, AlertTriangle, Trash2, Copy, Mail, Calendar, ChevronLeft, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getInvoices, 
  getChaserMessages, 
  generateChaserMessage, 
  markChaserSent, 
  scheduleChaser,
  deleteChaser,
  getOverdueInvoicesNeedingChaser,
  type Invoice,
  type ChaserMessage,
} from "@/lib/invoice";

interface InvoiceChaserProps {
  onBack?: () => void;
}

const TYPE_LABELS: Record<ChaserMessage["type"], { label: string; color: string; icon: typeof Bell }> = {
  reminder: { label: "Reminder", color: "text-blue-400", icon: Bell },
  overdue: { label: "Overdue", color: "text-amber-400", icon: AlertTriangle },
  final: { label: "Final Notice", color: "text-red-400", icon: AlertTriangle },
  paid_thanks: { label: "Thank You", color: "text-emerald-400", icon: Check },
};

const STATUS_LABELS: Record<ChaserMessage["status"], { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-neutral-500" },
  scheduled: { label: "Scheduled", color: "text-amber-400" },
  sent: { label: "Sent", color: "text-emerald-400" },
};

export default function InvoiceChaser({ onBack }: InvoiceChaserProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [chasers, setChasers] = useState<ChaserMessage[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedChaser, setSelectedChaser] = useState<ChaserMessage | null>(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setInvoices(getInvoices());
    setChasers(getChaserMessages());
    setOverdueCount(getOverdueInvoicesNeedingChaser().length);
  }

  function handleGenerateChaser(invoice: Invoice, type: ChaserMessage["type"]) {
    const chaser = generateChaserMessage(invoice, type);
    refresh();
    setSelectedChaser(chaser);
    setSelectedInvoice(null);
  }

  function handleMarkSent(chaserId: string) {
    markChaserSent(chaserId);
    refresh();
    setSelectedChaser(null);
  }

  function handleSchedule(chaserId: string) {
    if (scheduleDate) {
      scheduleChaser(chaserId, scheduleDate);
      refresh();
      setShowScheduleModal(false);
      setScheduleDate("");
      setSelectedChaser(null);
    }
  }

  function handleDelete(chaserId: string) {
    if (confirm("Delete this chaser message?")) {
      deleteChaser(chaserId);
      refresh();
      setSelectedChaser(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function getDaysOverdue(invoice: Invoice): number {
    return Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / 86400000
    );
  }

  // Detail view for a specific chaser
  if (selectedChaser) {
    const invoice = invoices.find(i => i.id === selectedChaser.invoiceId);
    const typeConfig = TYPE_LABELS[selectedChaser.type];
    const TypeIcon = typeConfig.icon;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedChaser(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Chaser Message</h2>
            <p className="text-sm text-neutral-500">{invoice?.clientName} · {invoice?.invoiceNumber}</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center ${typeConfig.color}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base text-neutral-200">{selectedChaser.subject}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs ${STATUS_LABELS[selectedChaser.status].color}`}>
                    {STATUS_LABELS[selectedChaser.status].label}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {new Date(selectedChaser.generatedAt).toLocaleDateString()}
                  </span>
                  {selectedChaser.scheduledFor && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedChaser.scheduledFor).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedChaser.body)} className="text-neutral-500">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedChaser.id)} className="text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans bg-neutral-950 p-4 rounded-lg">
              {selectedChaser.body}
            </pre>
          </CardContent>
        </Card>

        {selectedChaser.status === "draft" && (
          <div className="flex gap-3">
            <Button onClick={() => handleMarkSent(selectedChaser.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
              <Send className="w-4 h-4 mr-2" />
              Mark as Sent
            </Button>
            <Button onClick={() => setShowScheduleModal(true)} variant="outline" className="border-amber-600 text-amber-400">
              <Clock className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          </div>
        )}

        {showScheduleModal && (
          <Card className="bg-neutral-900 border-amber-600/30">
            <CardContent className="p-4 space-y-3">
              <label className="text-sm text-neutral-400">Schedule for:</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200"
              />
              <div className="flex gap-2">
                <Button onClick={() => handleSchedule(selectedChaser.id)} className="flex-1 bg-amber-600 hover:bg-amber-500">
                  Confirm Schedule
                </Button>
                <Button onClick={() => setShowScheduleModal(false)} variant="ghost" className="text-neutral-500">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Invoice selection view
  if (selectedInvoice) {
    const daysOverdue = getDaysOverdue(selectedInvoice);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Generate Chaser</h2>
            <p className="text-sm text-neutral-500">{selectedInvoice.clientName} · {selectedInvoice.invoiceNumber}</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-200">{selectedInvoice.invoiceNumber}</div>
                <div className="text-xs text-neutral-500">
                  Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">
                  {selectedInvoice.currency} {selectedInvoice.total.toFixed(2)}
                </div>
                {daysOverdue > 0 && (
                  <div className="text-xs text-red-400">{daysOverdue} days overdue</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400">Select message type:</h3>
          
          {[
            { type: "reminder" as const, title: "Friendly Reminder", desc: "Gentle nudge for upcoming or slightly overdue invoices" },
            { type: "overdue" as const, title: "Overdue Notice", desc: "More direct for invoices 7+ days overdue" },
            { type: "final" as const, title: "Final Notice", desc: "Urgent message for significantly overdue invoices" },
            { type: "paid_thanks" as const, title: "Thank You", desc: "Send after receiving payment" },
          ].map(({ type, title, desc }) => {
            const config = TYPE_LABELS[type];
            const Icon = config.icon;
            return (
              <Card 
                key={type}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                onClick={() => handleGenerateChaser(selectedInvoice, type)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-200">{title}</div>
                    <div className="text-xs text-neutral-500">{desc}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Invoice Chaser</h2>
            <p className="text-sm text-neutral-500">Automated payment reminders</p>
          </div>
        </div>
        {overdueCount > 0 && (
          <div className="bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-1.5">
            <span className="text-sm text-red-400">{overdueCount} need chasing</span>
          </div>
        )}
      </div>

      {/* Overdue alerts */}
      {overdueCount > 0 && (
        <Card className="bg-red-950/20 border-red-900/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="flex-1">
                <div className="font-medium text-red-400">{overdueCount} overdue invoices</div>
                <div className="text-xs text-red-400/70">These haven't been chased in the last 7 days</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unsent invoices */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-400">Unpaid Invoices</h3>
        {invoices.filter(i => i.status === "sent").length === 0 ? (
          <div className="text-center py-8 text-neutral-600 text-sm">
            No unpaid invoices
          </div>
        ) : (
          invoices
            .filter(i => i.status === "sent")
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map(invoice => {
              const daysOverdue = getDaysOverdue(invoice);
              const hasChaser = chasers.some(c => c.invoiceId === invoice.id && c.status !== "sent");
              
              return (
                <Card 
                  key={invoice.id}
                  className={`bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors ${daysOverdue > 0 ? "border-l-2 border-l-red-400" : ""}`}
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-neutral-200">{invoice.clientName}</div>
                        <div className="text-xs text-neutral-500">
                          {invoice.invoiceNumber} · Due {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          {invoice.currency} {invoice.total.toFixed(2)}
                        </div>
                        {daysOverdue > 0 ? (
                          <div className="text-xs text-red-400">{daysOverdue} days overdue</div>
                        ) : (
                          <div className="text-xs text-neutral-600">
                            {hasChaser ? "Chaser drafted" : "No chaser yet"}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      {/* Recent chasers */}
      {chasers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400">Recent Messages</h3>
          {chasers.slice(0, 10).map(chaser => {
            const invoice = invoices.find(i => i.id === chaser.invoiceId);
            const config = TYPE_LABELS[chaser.type];
            const Icon = config.icon;
            
            return (
              <Card 
                key={chaser.id}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
                onClick={() => setSelectedChaser(chaser)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-200 truncate">{chaser.subject}</div>
                      <div className="text-xs text-neutral-500">
                        {invoice?.clientName} · {STATUS_LABELS[chaser.status].label}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

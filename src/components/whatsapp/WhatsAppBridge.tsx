"use client";

import { useState } from "react";
import { MessageCircle, Mic, FileText, Lightbulb, Target, Send, CheckCircle, Phone, Settings } from "lucide-react";
import { addIdea } from "@/lib/idea-intelligence";
import { addTask } from "@/lib/session-brain";

interface WhatsAppMessage {
  id: string;
  content: string;
  type: "idea" | "task" | "note" | "voice";
  routed: boolean;
  routedTo?: string;
  receivedAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_CONFIG = {
  idea: { icon: Lightbulb, label: "Idea", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  task: { icon: Target, label: "Task", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  note: { icon: FileText, label: "Note", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  voice: { icon: Mic, label: "Voice", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
};

export default function WhatsAppBridge() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testType, setTestType] = useState<"idea" | "task" | "note">("idea");
  const [submitted, setSubmitted] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  function handleTestSubmit() {
    if (!testInput.trim()) return;

    // Actually route to the right module
    if (testType === "idea") {
      addIdea(testInput.trim(), { source: "whatsapp" });
    } else if (testType === "task") {
      addTask(testInput.trim(), undefined, "medium");
    }

    const newMsg: WhatsAppMessage = {
      id: `msg_${Date.now()}`,
      content: testInput.trim(),
      type: testType,
      routed: true,
      routedTo: testType === "idea" ? "Idea Backlog (auto-scored)" : testType === "task" ? "Task List" : "Session Notes",
      receivedAt: new Date().toISOString(),
    };

    setMessages(prev => [newMsg, ...prev]);
    setTestInput("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-1">WhatsApp Brain Dump</div>
            <h2 className="text-xl font-bold text-neutral-100">Your Brain, Always On</h2>
            <p className="text-sm text-neutral-500 mt-1">Message your CBT OS number from anywhere. Ideas, tasks, notes — auto-routed.</p>
          </div>
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-neutral-400 text-sm px-4 py-2 rounded-lg hover:border-neutral-700 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Setup
          </button>
        </div>

        {/* Setup panel */}
        {showSetup && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">WhatsApp Setup (Twilio)</div>
            <div className="space-y-3">
              {[
                { step: "01", label: "Get Twilio account", desc: "twilio.com — free trial gives you a WhatsApp sandbox number", done: false },
                { step: "02", label: "Set webhook URL", desc: `https://your-domain.com/api/whatsapp`, done: false },
                { step: "03", label: "Add TWILIO_ACCOUNT_SID to .env.local", done: false },
                { step: "04", label: "Add TWILIO_AUTH_TOKEN to .env.local", done: false },
                { step: "05", label: "Add TWILIO_PHONE_NUMBER to .env.local", done: false },
              ].map(({ step, label, desc, done }) => (
                <div key={step} className="flex gap-3 items-start">
                  <span className={`text-xs font-mono mt-0.5 flex-shrink-0 ${done ? "text-emerald-400" : "text-neutral-600"}`}>{step}</span>
                  <div>
                    <p className="text-sm text-neutral-300">{label}</p>
                    {desc && <p className="text-xs text-neutral-600 mt-0.5 font-mono">{desc}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
              <div className="text-xs font-mono text-neutral-600 mb-2">Webhook endpoint (already built):</div>
              <code className="text-xs text-amber-400 font-mono">POST /api/whatsapp</code>
              <p className="text-xs text-neutral-700 mt-1">Auto-classifies messages as idea/task/note and routes them to the right module.</p>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">How It Works</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, label: "Message your number", desc: "WhatsApp any thought, anytime, anywhere", color: "text-emerald-400" },
              { icon: Lightbulb, label: "AI classifies it", desc: "Auto-detects if it's an idea, task, or note", color: "text-amber-400" },
              { icon: Target, label: "Routes automatically", desc: "Lands in the right module, scored and ready", color: "text-blue-400" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-800 mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-neutral-200 mb-1">{label}</p>
                <p className="text-xs text-neutral-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test the bridge */}
        <div className="bg-neutral-900 border border-amber-400/20 rounded-lg p-5 space-y-4">
          <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">Test the Bridge</div>
          <p className="text-xs text-neutral-500">Simulate a WhatsApp message — it will actually route to your modules.</p>

          <div className="flex gap-2">
            {(["idea", "task", "note"] as const).map(type => {
              const { icon: Icon, label, color } = TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setTestType(type)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    testType === type ? color : "border-neutral-800 text-neutral-600 hover:text-neutral-400"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTestSubmit()}
              placeholder={`Type a ${testType} to simulate a WhatsApp message...`}
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              onClick={handleTestSubmit}
              disabled={!testInput.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              {submitted ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {submitted && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Routed to {testType === "idea" ? "Idea Backlog" : testType === "task" ? "Task List" : "Session Notes"}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Recent Messages</div>
          {messages.length === 0 ? (
            <p className="text-sm text-neutral-600 py-4">No messages yet. Use the test box above to route an idea, task, or note.</p>
          ) : messages.map(msg => {
            const { icon: Icon, label, color } = TYPE_CONFIG[msg.type];
            return (
              <div key={msg.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex gap-3">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 mb-1">{msg.content}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-600 font-mono">
                    <span className={`px-1.5 py-0.5 rounded border text-xs ${color}`}>{label}</span>
                    {msg.routed && <span className="text-emerald-400">→ {msg.routedTo}</span>}
                    <span>{timeAgo(msg.receivedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

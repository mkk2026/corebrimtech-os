"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";
import { getMessages, getThinking, subscribeCoFounder, type CoFounderMessage } from "@/lib/cofounder/cofounder-store";
import { askCoFounderLive } from "@/lib/cofounder/engine";

/**
 * The "paperclip" — a persistent floating co-founder dock. Collapsed to a launcher button;
 * expands to a chat panel that reads the conversation store and sends via askCoFounderLive.
 */
export default function CoFounderDock() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<readonly CoFounderMessage[]>(() => getMessages());
  const [thinking, setThinkingState] = useState(() => getThinking());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeCoFounder(() => {
    setMessages(getMessages());
    setThinkingState(getThinking());
  }), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  const send = useCallback(() => {
    const q = draft.trim();
    if (!q || thinking) return;
    setDraft("");
    void askCoFounderLive(q);
  }, [draft, thinking]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open co-founder"
        className="fixed bottom-5 right-5 z-[55] w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg hover:bg-amber-300 transition-colors"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-[55] w-[min(92vw,380px)] h-[min(70vh,540px)] flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-bold text-neutral-200">Your Co-Founder</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-neutral-600 hover:text-neutral-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto px-4 py-3 space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-600 text-center mt-8">
            Ask me anything about your startup — runway, deals, what to focus on next.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-amber-400 text-black"
                  : m.error
                    ? "bg-red-950/60 border border-red-500/30 text-red-200"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm bg-neutral-900 border border-neutral-800 text-neutral-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 border-t border-neutral-800 flex-shrink-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask your co-founder…"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-amber-400/40 transition-colors"
        />
        <button
          type="button"
          onClick={send}
          disabled={thinking}
          aria-label="Send"
          className="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Co-founder reactive chat engine.
 *
 * Pure + dependency-injected (mirrors auto-research.ts) so the persona, context grounding, and
 * error/rescue logic are unit-testable without network. Production wiring lives in
 * askCoFounderLive, which threads the real LLM + context + conversation store.
 */

import { complete, getActiveProvider } from "@/lib/llm";
import { buildFounderContext, renderContextPrompt, type FounderContext } from "./context";
import { addMessage, setThinking } from "./cofounder-store";

export interface AskDeps {
  hasKey: () => boolean;
  buildContext: () => FounderContext;
  renderContext: (ctx: FounderContext) => string;
  complete: (opts: { prompt: string; systemPrompt?: string; maxTokens?: number }) => Promise<string>;
}

export type AskResult =
  | { ok: true; answer: string }
  | { ok: false; reason: string; needsKey?: boolean };

const PERSONA =
  "You are the founder's AI co-founder and CTO. You know their startup intimately. Be direct, " +
  "specific, and action-oriented — a sharp thinking partner, not a generic assistant. Reference " +
  "their real numbers when relevant. Keep answers tight (a few sentences unless asked for depth). " +
  "If you lack data to answer well, say so and tell them which module to fill in.";

export async function askCoFounder(question: string, deps: AskDeps): Promise<AskResult> {
  if (!question.trim()) {
    return { ok: false, reason: "Ask me something about your startup." };
  }
  if (!deps.hasKey()) {
    return { ok: false, reason: "Add your AI key in Settings to chat with your co-founder.", needsKey: true };
  }

  const context = deps.renderContext(deps.buildContext());
  const systemPrompt = `${PERSONA}\n\nWhat you know about this startup:\n${context}`;

  try {
    const raw = await deps.complete({ prompt: question, systemPrompt, maxTokens: 1000 });
    const answer = raw.trim();
    if (!answer) {
      return { ok: false, reason: "I didn't get a response — try rephrasing." };
    }
    return { ok: true, answer };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "Something went wrong. Try again.";
    return { ok: false, reason };
  }
}

/** Production entrypoint: drives the conversation store with a real, grounded answer. */
export async function askCoFounderLive(question: string): Promise<void> {
  const trimmed = question.trim();
  if (!trimmed) return;

  addMessage({ role: "user", text: trimmed });
  setThinking(true);

  const result = await askCoFounder(trimmed, {
    hasKey: () => getActiveProvider() !== null,
    buildContext: buildFounderContext,
    renderContext: renderContextPrompt,
    complete,
  });

  setThinking(false);
  if (result.ok) {
    addMessage({ role: "cofounder", text: result.answer });
  } else {
    addMessage({ role: "cofounder", text: result.reason, error: true });
  }
}

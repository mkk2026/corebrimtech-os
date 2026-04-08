import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 min for long AI calls

/**
 * Server-side AI proxy — keeps API keys off the client.
 *
 * POST /api/ai
 * Body: { provider: "claude"|"google", model, messages, system?, max_tokens? }
 *
 * The route reads keys from env vars (ANTHROPIC_API_KEY, GOOGLE_API_KEY).
 * Client never sees or sends any API key.
 */

interface AIRequestBody {
  provider?: "claude" | "google";
  model?: string;
  messages?: { role: string; content: string }[];
  system?: string;
  max_tokens?: number;
  prompt?: string; // convenience: single prompt → messages
  tools?: unknown[]; // Claude tools (e.g. web_search)
  anthropic_beta?: string; // Beta feature flags
}

export async function POST(req: NextRequest) {
  try {
    const body: AIRequestBody = await req.json();
    const provider = body.provider ?? "claude";

    if (provider === "google") {
      return handleGoogle(body);
    }
    return handleClaude(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

// ── CLAUDE HANDLER ────────────────────────────────────────────────────────────

async function handleClaude(body: AIRequestBody): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_claude_api_key") {
    return NextResponse.json(
      { error: { message: "ANTHROPIC_API_KEY not configured on server" } },
      { status: 503 }
    );
  }

  const model = body.model ?? "claude-sonnet-4-20250514";
  const maxTokens = body.max_tokens ?? 2000;

  // Support both messages array and simple prompt
  const messages = body.messages ?? (body.prompt
    ? [{ role: "user", content: body.prompt }]
    : []);

  if (messages.length === 0) {
    return NextResponse.json(
      { error: { message: "No messages or prompt provided" } },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages,
  };
  if (body.system) payload.system = body.system;
  if (body.tools?.length) payload.tools = body.tools;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };
  if (body.anthropic_beta) headers["anthropic-beta"] = body.anthropic_beta;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error ?? { message: `Anthropic API ${res.status}` } },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}

// ── GOOGLE HANDLER ────────────────────────────────────────────────────────────

async function handleGoogle(body: AIRequestBody): Promise<NextResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key") {
    return NextResponse.json(
      { error: { message: "GOOGLE_API_KEY not configured on server" } },
      { status: 503 }
    );
  }

  const model = body.model ?? "gemini-2.0-flash";
  const maxTokens = body.max_tokens ?? 2000;

  // Build prompt from messages or direct prompt
  let fullPrompt = body.prompt ?? "";
  if (!fullPrompt && body.messages?.length) {
    fullPrompt = body.messages.map(m => m.content).join("\n\n");
  }
  if (body.system) {
    fullPrompt = `${body.system}\n\n${fullPrompt}`;
  }

  if (!fullPrompt.trim()) {
    return NextResponse.json(
      { error: { message: "No prompt provided" } },
      { status: 400 }
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error ?? { message: `Google API ${res.status}` } },
      { status: res.status }
    );
  }

  // Normalize Google response to match Claude-like shape
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return NextResponse.json({
    content: [{ type: "text", text }],
    model,
    usage: { input_tokens: 0, output_tokens: 0 }, // Google doesn't always return this
  });
}

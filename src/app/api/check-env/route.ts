import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const anthropicConfigured =
    !!process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "your_claude_api_key" &&
    process.env.ANTHROPIC_API_KEY.length > 10;

  return NextResponse.json({ anthropicConfigured });
}

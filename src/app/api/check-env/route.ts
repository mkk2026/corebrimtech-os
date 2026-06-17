import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const anthropicConfigured =
    !!process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "your_claude_api_key" &&
    process.env.ANTHROPIC_API_KEY.length > 10;

  const googleConfigured =
    !!process.env.GOOGLE_API_KEY &&
    process.env.GOOGLE_API_KEY !== "your_gemini_api_key" &&
    process.env.GOOGLE_API_KEY.length > 10;

  const nvidiaConfigured =
    !!process.env.NVIDIA_API_KEY &&
    process.env.NVIDIA_API_KEY !== "your_nvidia_api_key" &&
    process.env.NVIDIA_API_KEY.length > 10;

  const proxySecretConfigured = !!process.env.API_PROXY_SECRET;

  return NextResponse.json({ anthropicConfigured, googleConfigured, nvidiaConfigured, proxySecretConfigured });
}

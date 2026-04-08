// CORE BRIM TECH OS — Environment Validation with Zod
// Validates environment variables at runtime

import { z } from "zod";

const envSchema = z.object({
  // Supabase (optional but recommended)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  
  // AI Providers (at least one required for AI features)
  ANTHROPIC_API_KEY: z.string().optional().or(z.literal("")),
  GOOGLE_API_KEY: z.string().optional().or(z.literal("")),
  
  // Telegram (optional)
  TELEGRAM_BOT_TOKEN: z.string().optional().or(z.literal("")),
  TELEGRAM_CHAT_ID: z.string().optional().or(z.literal("")),
  
  // Vercel Analytics (optional)
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional().or(z.literal("")),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    NEXT_PUBLIC_VERCEL_ANALYTICS_ID: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = parseEnv();
  return cachedEnv;
}

export function isSupabaseConfigured(): boolean {
  const env = getEnv();
  return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isAnthropicConfigured(): boolean {
  return !!getEnv().ANTHROPIC_API_KEY;
}

export function isGoogleConfigured(): boolean {
  return !!getEnv().GOOGLE_API_KEY;
}

export function isAIConfigured(): boolean {
  const env = getEnv();
  return !!(env.ANTHROPIC_API_KEY || env.GOOGLE_API_KEY);
}

export function isTelegramConfigured(): boolean {
  const env = getEnv();
  return !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
}

export function getEnvStatus() {
  const env = getEnv();
  return {
    supabase: isSupabaseConfigured(),
    anthropic: isAnthropicConfigured(),
    google: isGoogleConfigured(),
    ai: isAIConfigured(),
    telegram: isTelegramConfigured(),
    missing: {
      supabase: !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anthropic: !env.ANTHROPIC_API_KEY,
      google: !env.GOOGLE_API_KEY,
      telegram: !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID,
    },
  };
}

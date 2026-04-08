"use client";

import { useState, useEffect } from "react";
import {
  Settings, Database, Key, Check, X, RefreshCw,
  Upload, Download, AlertCircle, CheckCircle, Loader2,
  Shield, Zap, Eye, EyeOff, ExternalLink
} from "lucide-react";
import {
  isSupabaseConfigured, syncFromSupabase,
  pushLocalToSupabase, getSyncStatus, setSyncStatus
} from "@/lib/supabase";
import {
  getPreferredProvider, setPreferredProvider, getStoredGoogleKey,
  type AIProvider
} from "@/lib/llm";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <div className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-400" : "bg-neutral-700"}`} />
  );
}

function EnvRow({ label, envKey, value, secret = false }: {
  label: string; envKey: string; value?: string; secret?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isSet = !!value && value !== "your_supabase_url" && value !== "your_claude_api_key";
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-800 last:border-0">
      <StatusDot ok={isSet} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-neutral-400">{envKey}</p>
        <p className="text-xs text-neutral-600">{label}</p>
      </div>
      {isSet ? (
        <div className="flex items-center gap-2">
          {secret ? (
            <span className="text-xs font-mono text-neutral-500">
              {show ? value : `${value!.slice(0, 8)}...${value!.slice(-4)}`}
            </span>
          ) : (
            <span className="text-xs font-mono text-neutral-500 truncate max-w-48">{value}</span>
          )}
          {secret && (
            <button onClick={() => setShow(!show)} className="text-neutral-700 hover:text-neutral-400 transition-colors">
              {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </div>
      ) : (
        <span className="text-xs font-mono text-red-400/70">NOT SET</span>
      )}
    </div>
  );
}

export default function SettingsPanel() {
  const [syncStatus, setSyncStatusState] = useState(getSyncStatus());
  const [syncing, setSyncing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; pushed: number } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; tablesSync: Record<string, number> } | null>(null);

  const supabaseConfigured = isSupabaseConfigured();
  const [anthropicConfigured, setAnthropicConfigured] = useState<boolean | null>(null);
  const [storedKeyExists, setStoredKeyExists] = useState(false);
  const [anthropicInput, setAnthropicInput] = useState("");
  const [googleInput, setGoogleInput] = useState("");
  const [storedGoogleKeyExists, setStoredGoogleKeyExists] = useState(false);
  const [preferredProvider, setPreferredProviderState] = useState<AIProvider>("claude");

  const ANTHROPIC_STORAGE_KEY = "cbt_os_anthropic_api_key";
  const GOOGLE_STORAGE_KEY = "cbt_os_google_api_key";

  // Env vars (only NEXT_PUBLIC_ ones are available client-side)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    fetch("/api/check-env")
      .then((res) => res.json())
      .then((data) => setAnthropicConfigured(data.anthropicConfigured === true))
      .catch(() => setAnthropicConfigured(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = localStorage.getItem(ANTHROPIC_STORAGE_KEY);
    setStoredKeyExists(!!(k && k.trim() && k !== "your_claude_api_key"));
    const g = localStorage.getItem(GOOGLE_STORAGE_KEY);
    setStoredGoogleKeyExists(!!(g && g.trim()));
    setPreferredProviderState(getPreferredProvider());
  }, []);

  function handleSaveAnthropicKey() {
    const v = anthropicInput.trim();
    if (typeof window === "undefined") return;
    if (v) {
      localStorage.setItem(ANTHROPIC_STORAGE_KEY, v);
      setStoredKeyExists(true);
      setAnthropicInput("");
    } else {
      localStorage.removeItem(ANTHROPIC_STORAGE_KEY);
      setStoredKeyExists(false);
    }
  }

  function handleSaveGoogleKey() {
    const v = googleInput.trim();
    if (typeof window === "undefined") return;
    if (v) {
      localStorage.setItem(GOOGLE_STORAGE_KEY, v);
      setStoredGoogleKeyExists(true);
      setGoogleInput("");
    } else {
      localStorage.removeItem(GOOGLE_STORAGE_KEY);
      setStoredGoogleKeyExists(false);
    }
  }

  function handleProviderChange(provider: AIProvider) {
    setPreferredProvider(provider);
    setPreferredProviderState(provider);
  }

  async function handleSyncFromCloud() {
    setSyncing(true);
    const result = await syncFromSupabase();
    setSyncResult(result as { success: boolean; tablesSync: Record<string, number> });
    setSyncStatusState(getSyncStatus());
    setSyncing(false);
  }

  async function handlePushToCloud() {
    setPushing(true);
    setPushResult(null);
    const result = await pushLocalToSupabase();
    setPushResult(result);
    setPushing(false);
  }

  const totalTablesSynced = syncResult
    ? Object.values(syncResult.tablesSync).reduce((s, v) => s + v, 0) : 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1">Settings</div>
          <h2 className="text-xl font-bold text-neutral-100">Environment & Connections</h2>
          <p className="text-sm text-neutral-500 mt-1">Configure your API keys and manage data sync.</p>
        </div>

        {/* .env.local instructions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-neutral-200">Environment Variables</span>
            <span className="text-xs font-mono text-neutral-600 ml-auto">~/Desktop/corebrimtech-os/.env.local</span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4 font-mono text-xs">
            <p className="text-neutral-600 mb-2"># Supabase — get from: supabase.com → Project → Settings → API</p>
            <p className="text-emerald-400">NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co</p>
            <p className="text-emerald-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...</p>
            <p className="text-neutral-600 mt-3 mb-2"># Anthropic — get from: console.anthropic.com → API Keys</p>
            <p className="text-blue-400">ANTHROPIC_API_KEY=sk-ant-...</p>
          </div>

          <div className="text-xs text-neutral-600 bg-amber-400/5 border border-amber-400/15 rounded-lg p-3">
            ⚠️ After editing .env.local — restart your dev server: <code className="text-amber-400">npm run dev</code>
          </div>

          {/* Current status */}
          <div className="mt-4">
            <EnvRow
              label="Supabase Project URL"
              envKey="NEXT_PUBLIC_SUPABASE_URL"
              value={supabaseUrl}
            />
            <EnvRow
              label="Supabase Anon Key"
              envKey="NEXT_PUBLIC_SUPABASE_ANON_KEY"
              value={supabaseKey}
              secret
            />
            <EnvRow
              label="Anthropic Claude API Key"
              envKey="ANTHROPIC_API_KEY or pasted below"
              value={anthropicConfigured === true || storedKeyExists ? "configured" : undefined}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800">
            <p className="text-xs font-bold text-neutral-400 mb-2">Or paste key here (stored in this browser only)</p>
            <p className="text-xs text-neutral-600 mb-2">Use Claude and/or Google (Gemini). Google has a free tier — pick your preferred provider below.</p>

            <div className="mb-4">
              <p className="text-xs font-bold text-neutral-400 mb-2">Preferred AI provider</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleProviderChange("claude")}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors ${preferredProvider === "claude" ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-neutral-700 text-neutral-500 hover:text-neutral-300"}`}
                >
                  Claude (Anthropic)
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange("google")}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors ${preferredProvider === "google" ? "border-blue-400 bg-blue-400/10 text-blue-400" : "border-neutral-700 text-neutral-500 hover:text-neutral-300"}`}
                >
                  Google (Gemini)
                </button>
              </div>
            </div>

            <p className="text-xs font-mono text-neutral-500 mb-1">Claude — paste key (or use .env.local)</p>
            <div className="flex gap-2 mb-4">
              <input
                type="password"
                value={anthropicInput}
                onChange={(e) => setAnthropicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveAnthropicKey()}
                placeholder={storedKeyExists ? "Key saved — enter new to replace" : "sk-ant-..."}
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 font-mono focus:outline-none focus:border-amber-400"
                aria-label="Claude API key"
              />
              <button
                type="button"
                onClick={handleSaveAnthropicKey}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-sm font-bold rounded-lg transition-colors"
              >
                {anthropicInput.trim() ? "Save" : storedKeyExists ? "Clear" : "Save"}
              </button>
            </div>

            <p className="text-xs font-mono text-neutral-500 mb-1">Google (Gemini) — free tier at aistudio.google.com</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={googleInput}
                onChange={(e) => setGoogleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveGoogleKey()}
                placeholder={storedGoogleKeyExists ? "Key saved — enter new to replace" : "AIza..."}
                className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 font-mono focus:outline-none focus:border-blue-400"
                aria-label="Google Gemini API key"
              />
              <button
                type="button"
                onClick={handleSaveGoogleKey}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-lg transition-colors"
              >
                {googleInput.trim() ? "Save" : storedGoogleKeyExists ? "Clear" : "Save"}
              </button>
            </div>

            {(anthropicConfigured === true || storedKeyExists || storedGoogleKeyExists) && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {preferredProvider === "google" ? "Google (Gemini)" : "Claude"} will be used for Skills and Cost Optimizer. Research / Hackathon / Scout need Claude.
              </p>
            )}
          </div>
        </div>

        {/* Supabase Sync */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-neutral-200">Supabase Sync</span>
            <div className="ml-auto flex items-center gap-2">
              <StatusDot ok={supabaseConfigured} />
              <span className={`text-xs font-mono ${supabaseConfigured ? "text-emerald-400" : "text-neutral-600"}`}>
                {supabaseConfigured ? "Connected" : "Not configured"}
              </span>
            </div>
          </div>

          {syncStatus.lastSync && (
            <p className="text-xs text-neutral-600 font-mono">
              Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
              {syncStatus.tablesSync && (
                <span className="ml-2">·
                  {Object.values(syncStatus.tablesSync as Record<string, number>).reduce((s, v) => s + v, 0)} records
                </span>
              )}
            </p>
          )}

          {!supabaseConfigured ? (
            <div className="bg-amber-400/5 border border-amber-400/15 rounded-lg p-4 space-y-2">
              <p className="text-xs font-bold text-amber-400">Setup Required</p>
              <p className="text-xs text-neutral-500">Add your Supabase credentials to .env.local then restart the dev server.</p>
              <p className="text-xs text-neutral-600">Also run the SQL schema first:</p>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Open Supabase Dashboard
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Push local → cloud */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                <p className="text-xs font-bold text-neutral-300 mb-1">↑ Push Local to Cloud</p>
                <p className="text-xs text-neutral-600 mb-3">Upload all localStorage data to Supabase. Run this once after setup.</p>
                {pushResult && (
                  <div className={`text-xs mb-3 p-2 rounded ${pushResult.success ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                    {pushResult.success ? `✓ Pushed ${pushResult.pushed} records` : "Push failed — check console"}
                  </div>
                )}
                <button onClick={handlePushToCloud} disabled={pushing}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                  {pushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {pushing ? "Pushing..." : "Push to Supabase"}
                </button>
              </div>

              {/* Pull cloud → local */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                <p className="text-xs font-bold text-neutral-300 mb-1">↓ Pull Cloud to Local</p>
                <p className="text-xs text-neutral-600 mb-3">Download latest data from Supabase. Run when switching devices.</p>
                {syncResult && (
                  <div className={`text-xs mb-3 p-2 rounded ${syncResult.success ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                    {syncResult.success ? `✓ Synced ${totalTablesSynced} records` : "Sync failed — check console"}
                  </div>
                )}
                <button onClick={handleSyncFromCloud} disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
                  {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {syncing ? "Syncing..." : "Pull from Supabase"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How sync works */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">How Sync Works</p>
          <div className="space-y-3">
            {[
              { icon: Zap, color: "text-amber-400", title: "Write-through cache", desc: "Every save writes to localStorage instantly (fast) AND Supabase (persistent)" },
              { icon: RefreshCw, color: "text-blue-400", title: "Pull on new device", desc: "On a new machine, hit Pull to download everything from Supabase" },
              { icon: Shield, color: "text-emerald-400", title: "Never lose data", desc: "Even if you clear your browser, everything is safe in Supabase" },
              { icon: Database, color: "text-purple-400", title: "Team ready", desc: "When you add a co-founder, they pull the same data — instant access" },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-3">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-xs font-bold text-neutral-300">{title}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supabase setup steps */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Setup Checklist</p>
          <div className="space-y-2">
            {[
              "Create project at supabase.com",
              "Go to SQL Editor → New Query → paste supabase-schema.sql → Run",
              "Copy Project URL + anon key from Settings → API",
              "Add to .env.local file in your project root",
              "Restart dev server: npm run dev",
              "Come back here → Push to Supabase (migrate existing data)",
              "Done — all future saves go to Supabase automatically",
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono text-amber-400 w-4 flex-shrink-0">{i + 1}.</span>
                <p className="text-xs text-neutral-400">{step}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

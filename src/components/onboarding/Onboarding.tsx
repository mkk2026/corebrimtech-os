"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, ArrowLeft, Rocket, User, Building2, Target, Check, KeyRound, Loader2, Sparkles } from "lucide-react";
import { getBrain, getDefaultBrain, saveBrain } from "@/lib/founder-brain";
import type { FounderBrain } from "@/lib/founder-brain";
import { getStoredAnthropicKey, setStoredAnthropicKey } from "@/lib/llm";
import { seedAutoResearchLive } from "@/lib/auto-research";
import { getSeedStatus, subscribeSeedStatus, type SeedStatus } from "@/lib/seed-scan-store";

interface OnboardingProps {
  onComplete: () => void;
}

type Step = "welcome" | "founder" | "company" | "stage" | "connect" | "ready";

const STAGES: { value: FounderBrain["stage"]; label: string; desc: string }[] = [
  { value: "pre-idea",        label: "Pre-Idea",        desc: "Exploring what to build" },
  { value: "idea",            label: "Idea",            desc: "Have a concept, validating it" },
  { value: "mvp",             label: "MVP",             desc: "Building the first version" },
  { value: "early-traction",  label: "Early Traction",  desc: "First users or revenue" },
  { value: "growth",          label: "Growth",          desc: "Scaling what works" },
  { value: "scale",           label: "Scale",           desc: "Expanding markets or team" },
];

const STEPS: Step[] = ["welcome", "founder", "company", "stage", "connect", "ready"];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [founderName, setFounderName] = useState("");
  const [founderRole, setFounderRole] = useState("CEO & Founder");
  const [founderEmail, setFounderEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTagline, setCompanyTagline] = useState("");
  const [companyMission, setCompanyMission] = useState("");
  const [stage, setStage] = useState<FounderBrain["stage"]>("mvp");
  const [apiKey, setApiKey] = useState(() => getStoredAnthropicKey() ?? "");
  const [launching, setLaunching] = useState(false);
  const [seedStatus, setSeedStatus] = useState<SeedStatus>(() => getSeedStatus());

  useEffect(() => subscribeSeedStatus(setSeedStatus), []);

  // Persist onboarding state into FounderBrain immutably.
  const persistBrain = useCallback((complete: boolean) => {
    const brain = getBrain() || getDefaultBrain();
    const next: FounderBrain = {
      ...brain,
      companyName: companyName || brain.companyName,
      companyTagline,
      companyMission,
      stage,
      setupComplete: complete,
    };
    if (founderName) {
      const existing = next.founders[0];
      next.founders = existing
        ? [{ ...existing, name: founderName, role: founderRole, email: founderEmail || existing.email }, ...next.founders.slice(1)]
        : [{
            id: `founder_${Date.now()}`,
            name: founderName,
            role: founderRole,
            location: "",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            bio: "",
            skills: [],
            strengths: [],
            workStyle: "",
            email: founderEmail,
          }];
    }
    saveBrain(next);
  }, [companyName, companyTagline, companyMission, stage, founderName, founderRole, founderEmail]);

  // Persist the API key as the founder types it (local-only storage).
  const handleKeyChange = useCallback((value: string) => {
    setApiKey(value);
    setStoredAnthropicKey(value);
  }, []);

  // Entering the ready step persists context and kicks off the background seed scan.
  const goToReady = useCallback(() => {
    persistBrain(false);
    void seedAutoResearchLive();
    setStep("ready");
  }, [persistBrain]);

  const handleFinish = useCallback(() => {
    if (launching) return; // guard double-click
    setLaunching(true);
    persistBrain(true);
    onComplete();
  }, [launching, persistBrain, onComplete]);

  const handleSkip = useCallback(() => {
    // Mark complete with a sparse profile — FounderBrainNudge will gently prompt later.
    persistBrain(true);
    onComplete();
  }, [persistBrain, onComplete]);

  const currentIdx = STEPS.indexOf(step);
  const goBack = () => setStep(STEPS[currentIdx - 1]);

  function readyMessage(): { icon: "spin" | "spark" | "key" | null; text: string } | null {
    switch (seedStatus.phase) {
      case "researching": return { icon: "spin", text: seedStatus.message };
      case "found": {
        const parts = [
          seedStatus.competitors > 0 && `${seedStatus.competitors} competitor${seedStatus.competitors === 1 ? "" : "s"}`,
          seedStatus.gaps > 0 && `${seedStatus.gaps} market gap${seedStatus.gaps === 1 ? "" : "s"}`,
        ].filter(Boolean);
        return parts.length
          ? { icon: "spark", text: `I found ${parts.join(" and ")} in your space while you set up.` }
          : { icon: "spark", text: "Market research complete." };
      }
      case "needs-key": return { icon: "key", text: "Add an AI key anytime to unlock auto-research." };
      case "failed": return { icon: null, text: "Couldn't reach research just now — retry from the dashboard." };
      default: return null;
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-neutral-950 flex items-center justify-center p-4">
      {/* Progress dots */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= currentIdx ? "bg-amber-400 w-6" : "bg-neutral-800 w-1.5"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* ── Welcome ── */}
        {step === "welcome" && (
          <div className="text-center space-y-8 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto">
              <span className="text-black font-black text-xl">CBT</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-100">Welcome to your OS.</h1>
              <p className="text-neutral-500 mt-3 text-lg leading-relaxed">
                CoreBrimTech OS is your startup&apos;s brain — research, build, track money, and grow. All in one place.
              </p>
            </div>
            <p className="text-sm text-neutral-600">
              Let&apos;s set up in under 60 seconds.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("founder")}
                className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-8 py-3 rounded-xl hover:bg-amber-300 transition-colors text-sm"
              >
                Let&apos;s go <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Founder ── */}
        {step === "founder" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-100">Who are you?</h2>
                <p className="text-sm text-neutral-500">The OS adapts to you.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="onb-name" className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">Your name</label>
                <input
                  id="onb-name"
                  type="text"
                  value={founderName}
                  onChange={(e) => setFounderName(e.target.value)}
                  placeholder="e.g. Momodu Kamara"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-amber-400/40 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="onb-role" className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">Your role</label>
                <input
                  id="onb-role"
                  type="text"
                  value={founderRole}
                  onChange={(e) => setFounderRole(e.target.value)}
                  placeholder="e.g. CEO & Founder"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-amber-400/40 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="onb-email" className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">Email</label>
                <input
                  id="onb-email"
                  type="email"
                  value={founderEmail}
                  onChange={(e) => setFounderEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-amber-400/40 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep("company")}
                className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-amber-300 transition-colors text-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Company ── */}
        {step === "company" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-100">Your company</h2>
                <p className="text-sm text-neutral-500">Every module uses this context.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="onb-company" className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">Company name</label>
                <input
                  id="onb-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Core Brim Tech"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-amber-400/40 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="onb-tagline" className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">One-line tagline</label>
                <input
                  id="onb-tagline"
                  type="text"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value)}
                  placeholder="e.g. The operating system for founders"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-amber-400/40 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="onb-mission" className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">Mission (optional)</label>
                <textarea
                  id="onb-mission"
                  value={companyMission}
                  onChange={(e) => setCompanyMission(e.target.value)}
                  placeholder="What problem are you solving and for whom?"
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-amber-400/40 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep("stage")}
                className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-amber-300 transition-colors text-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Stage ── */}
        {step === "stage" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-100">What stage are you at?</h2>
                <p className="text-sm text-neutral-500">This helps the OS prioritize what matters.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STAGES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStage(s.value)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    stage === s.value
                      ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-neutral-600 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep("connect")}
                className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-amber-300 transition-colors text-sm"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Connect AI ── */}
        {step === "connect" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-100">Connect your AI brain</h2>
                <p className="text-sm text-neutral-500">Powers research, proposals, and more. Stored only on this device.</p>
              </div>
            </div>

            <div>
              <label htmlFor="onb-key" className="text-xs font-mono text-neutral-500 uppercase tracking-widest block mb-1.5">Anthropic API key</label>
              <input
                id="onb-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-purple-400/40 transition-colors font-mono"
                autoFocus
              />
              <p className="text-xs text-neutral-600 mt-2">
                With a key, the OS researches your market in the background as you finish.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={goToReady} className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors">
                  I&apos;ll add it later
                </button>
                <button
                  type="button"
                  onClick={goToReady}
                  className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl hover:bg-amber-300 transition-colors text-sm"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Ready ── */}
        {step === "ready" && (() => {
          const msg = readyMessage();
          return (
            <div className="text-center space-y-8 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-neutral-100">
                  {companyName ? `${companyName} is ready.` : "You're ready."}
                </h2>
                <p className="text-neutral-500 mt-3 leading-relaxed">
                  Your OS is configured. Start with the <strong className="text-neutral-300">Command Center</strong> for an overview,
                  or dive into <strong className="text-neutral-300">Founder Brain</strong> to add more detail later.
                </p>
              </div>

              {msg && (
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 max-w-md mx-auto">
                  {msg.icon === "spin" && <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />}
                  {msg.icon === "spark" && <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {msg.icon === "key" && <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="space-y-2 text-left max-w-sm mx-auto">
                {[
                  founderName && `Founder: ${founderName}`,
                  companyName && `Company: ${companyName}`,
                  companyTagline && `"${companyTagline}"`,
                  `Stage: ${STAGES.find(s => s.value === stage)?.label}`,
                ].filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-neutral-400">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={launching}
                  className="inline-flex items-center gap-2 bg-amber-400 text-black font-bold px-8 py-3 rounded-xl hover:bg-amber-300 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Launch my OS <Rocket className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

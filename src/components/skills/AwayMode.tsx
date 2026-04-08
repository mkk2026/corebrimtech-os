"use client";

import { useState, useEffect } from "react";
import {
  Plane, Shield, Play, Pause, Bot, Bell, CheckCircle,
  Clock, Zap, DollarSign, Eye, Loader2, AlertCircle,
  Sun, Moon, Coffee, Smartphone, Wifi, WifiOff, RefreshCw
} from "lucide-react";
import {
  getSkill, updateSkill, executeSkill, getSkillRuns,
  getPendingActions, approveAction, type SkillRun
} from "@/lib/skill-engine";
import { getRevenueStats } from "@/lib/money";
import { getGrantStats } from "@/lib/grant-tracker";
import { getScoutStats } from "@/lib/hackathon-scout";

function timeOfDay(): { label: string; icon: React.ElementType } {
  const h = new Date().getHours();
  if (h < 6)  return { label: "Night mode", icon: Moon };
  if (h < 12) return { label: "Morning run", icon: Sun };
  if (h < 17) return { label: "Afternoon run", icon: Coffee };
  return { label: "Evening run", icon: Moon };
}

function ActivityFeed({ runs }: { runs: SkillRun[] }) {
  if (runs.length === 0) return (
    <div className="text-center py-8">
      <Bot className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
      <p className="text-xs text-neutral-600">No activity yet. Activate Away Mode to start.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {runs.slice(0, 10).map(run => (
        <div key={run.id} className="flex items-start gap-3 py-2.5 border-b border-neutral-800 last:border-0">
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
            run.status === "success" ? "bg-emerald-400" :
            run.status === "running" ? "bg-amber-400 animate-pulse" : "bg-red-400"
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-300">{run.output || "Running..."}</p>
            {run.actions && run.actions.length > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">{run.actions.length} action(s) created</p>
            )}
          </div>
          <span className="text-xs font-mono text-neutral-700 flex-shrink-0">
            {new Date(run.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AwayMode() {
  const [awaySkill, setAwaySkill] = useState(getSkill("skill_away_mode"));
  const [isActive, setIsActive] = useState(false);
  const [activating, setActivating] = useState(false);
  const [runs, setRuns] = useState<SkillRun[]>([]);
  const [pendingActions, setPendingActions] = useState(getPendingActions());
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [showTelegramSetup, setShowTelegramSetup] = useState(false);
  const [revenueStats] = useState(getRevenueStats());
  const [grantStats] = useState(getGrantStats());
  const [scoutStats] = useState(getScoutStats());
  const { label: timeLabel, icon: TimeIcon } = timeOfDay();

  useEffect(() => {
    refresh();
    // Check if away mode was previously active
    const stored = localStorage.getItem("cbt_os_away_mode_active");
    setIsActive(stored === "true");
  }, []);

  function refresh() {
    setAwaySkill(getSkill("skill_away_mode"));
    setRuns(getSkillRuns());
    setPendingActions(getPendingActions());
  }

  async function handleActivate() {
    setActivating(true);
    localStorage.setItem("cbt_os_away_mode_active", "true");
    setIsActive(true);

    // Run away mode immediately
    await executeSkill("skill_away_mode", undefined, telegramToken, telegramChatId);
    refresh();
    setActivating(false);
  }

  function handleDeactivate() {
    localStorage.setItem("cbt_os_away_mode_active", "false");
    setIsActive(false);
    updateSkill("skill_away_mode", { status: "paused" });
    refresh();
  }

  const AUTONOMOUS_SKILLS = [
    { id: "skill_opportunity_scanner", label: "Opportunity Scanner",   icon: Eye,        desc: "Scans for new hackathons & grants daily" },
    { id: "skill_competitor_monitor",  label: "Competitor Monitor",    icon: Shield,     desc: "Watches competitors for changes" },
    { id: "skill_grant_drafter",       label: "Grant Drafter",         icon: DollarSign, desc: "Drafts applications before deadlines" },
    { id: "skill_hackathon_auto_builder", label: "Hackathon Builder",  icon: Zap,        desc: "Auto-builds 90%+ fit hackathons" },
    { id: "skill_weekly_report",       label: "Weekly Reporter",       icon: Bell,       desc: "Sends Sunday briefing to Telegram" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Away Mode</div>
          <h2 className="text-xl font-bold text-neutral-100">The OS Runs. You Rest.</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Activate and every skill runs autonomously. The system scouts, drafts, monitors, and alerts you — whether you're on a beach in Freetown or sleeping at 3am.
          </p>
        </div>

        <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl p-4">
          <p className="text-xs text-neutral-400">Runs only while the app is open. Keep this tab open for autonomous runs. Background execution (e.g. serverless cron) is not set up yet.</p>
        </div>

        {/* Big status card */}
        <div className={`rounded-2xl border p-8 text-center transition-all ${
          isActive
            ? "bg-emerald-400/5 border-emerald-400/30"
            : "bg-neutral-900 border-neutral-800"
        }`}>
          {isActive ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-400/15 border-2 border-emerald-400/40 flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black text-emerald-400 mb-1">Away Mode Active</h3>
              <p className="text-sm text-neutral-500 mb-2">CBT OS is running autonomously. Go live your life.</p>
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400/70 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All systems operational · {timeLabel}
              </div>
              <button onClick={handleDeactivate}
                className="flex items-center gap-2 mx-auto text-sm text-neutral-400 hover:text-neutral-200 bg-neutral-800 border border-neutral-700 px-5 py-2.5 rounded-lg transition-colors">
                <Pause className="w-4 h-4" />
                Deactivate Away Mode
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-xl font-black text-neutral-400 mb-1">Away Mode Inactive</h3>
              <p className="text-sm text-neutral-600 mb-6">Activate to let the OS work while you're away.</p>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="flex items-center gap-2 mx-auto bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/40 text-black font-black text-base px-8 py-3 rounded-xl transition-colors"
              >
                {activating
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Plane className="w-5 h-5" />
                }
                {activating ? "Activating..." : "Activate Away Mode"}
              </button>
            </>
          )}
        </div>

        {/* What runs autonomously */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">What Runs While You're Away</div>
          <div className="space-y-3">
            {AUTONOMOUS_SKILLS.map(({ id, label, icon: Icon, desc }) => {
              const skill = getSkill(id);
              const isOn = skill?.status === "active";
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isOn ? "bg-emerald-400/10 border border-emerald-400/20" : "bg-neutral-800 border border-neutral-700"
                  }`}>
                    <Icon className={`w-4 h-4 ${isOn ? "text-emerald-400" : "text-neutral-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isOn ? "text-neutral-200" : "text-neutral-600"}`}>{label}</p>
                    <p className="text-xs text-neutral-600">{desc}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-mono flex-shrink-0 ${isOn ? "text-emerald-400" : "text-neutral-700"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isOn ? "bg-emerald-400" : "bg-neutral-700"}`} />
                    {isOn ? "On" : "Off"}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-neutral-700 mt-4 font-mono">
            Toggle skills on/off in the Skill Engine module
          </p>
        </div>

        {/* Telegram setup */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-neutral-200">Telegram Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${telegramChatId ? "bg-emerald-400" : "bg-neutral-700"}`} />
              <span className={`text-xs font-mono ${telegramChatId ? "text-emerald-400" : "text-neutral-600"}`}>
                {telegramChatId ? "Connected" : "Not set"}
              </span>
            </div>
          </div>

          {!showTelegramSetup ? (
            <>
              <p className="text-xs text-neutral-500 mb-3">
                Get daily briefings, opportunity alerts, and approval requests sent directly to your Telegram — even when you're away from your computer.
              </p>
              <button onClick={() => setShowTelegramSetup(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Set up Telegram →
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-500 space-y-1.5">
                <p className="font-bold text-neutral-400">Setup steps:</p>
                <p>1. Open Telegram → search <span className="text-amber-400">@BotFather</span></p>
                <p>2. Send <span className="text-amber-400">/newbot</span> → follow instructions → copy the token</p>
                <p>3. Start your bot → send a message</p>
                <p>4. Visit: <span className="text-amber-400">https://api.telegram.org/bot[TOKEN]/getUpdates</span> → copy the chat_id</p>
              </div>
              <input
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                placeholder="Bot Token (123456:ABC-DEF...)"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              />
              <input
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                placeholder="Chat ID (e.g. 123456789)"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (telegramToken && telegramChatId) {
                      updateSkill("skill_away_mode", {
                        config: { ...awaySkill?.config, telegramChatId, telegramToken }
                      });
                      setShowTelegramSetup(false);
                      refresh();
                    }
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button onClick={() => setShowTelegramSetup(false)} className="text-neutral-600 text-xs px-3 py-2 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pending approvals */}
        {pendingActions.length > 0 && (
          <div className="bg-neutral-900 border border-amber-400/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">
                {pendingActions.length} Approval{pendingActions.length > 1 ? "s" : ""} Waiting
              </span>
            </div>
            <p className="text-xs text-neutral-500">The OS prepared these while running. Review and approve to execute.</p>
            {pendingActions.map((action, i) => (
              <div key={i} className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-200">{action.title}</p>
                  <p className="text-xs text-neutral-500">{action.description}</p>
                  <p className="text-xs font-mono text-neutral-700 mt-0.5">from: {action.skillName}</p>
                </div>
                <button
                  onClick={() => { approveAction(action.runId, action.title); refresh(); }}
                  className="flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <CheckCircle className="w-3 h-3" />
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Activity feed */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Activity Log</span>
            <button onClick={refresh} className="text-neutral-600 hover:text-neutral-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <ActivityFeed runs={runs} />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-emerald-400">${revenueStats.thisMonth}</div>
            <div className="text-xs text-neutral-600 font-mono mt-1">This Month</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-amber-400">{grantStats.applying}</div>
            <div className="text-xs text-neutral-600 font-mono mt-1">Grants Active</div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-blue-400">{scoutStats.highFit}</div>
            <div className="text-xs text-neutral-600 font-mono mt-1">High-Fit Hackathons</div>
          </div>
        </div>

      </div>
    </div>
  );
}

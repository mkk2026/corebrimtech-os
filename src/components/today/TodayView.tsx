"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, Target, Bell, ArrowRight, Trophy, AlertTriangle } from "lucide-react";
import { getGrants } from "@/lib/grant-tracker";
import { getClients } from "@/lib/money";
import { getGoals } from "@/lib/goals";
import { getNotifications } from "@/lib/support";
import type { Grant } from "@/lib/grant-tracker";
import type { Client } from "@/lib/money";
import type { Goal } from "@/lib/goals";
import type { Notification } from "@/lib/support";

interface TodayViewProps {
  onNavigate: (module: string) => void;
}

export default function TodayView({ onNavigate }: TodayViewProps) {
  const [dueGrants, setDueGrants] = useState<Grant[]>([]);
  const [staleLeads, setStaleLeads] = useState<Client[]>([]);
  const [atRiskGoals, setAtRiskGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const now = Date.now();
    const dayMs = 86400000;

    const grants = getGrants().filter((g) => {
      if (!g.deadline || ["won", "rejected", "missed", "submitted"].includes(g.status)) return false;
      const deadline = new Date(g.deadline).getTime();
      const daysLeft = Math.ceil((deadline - now) / dayMs);
      return daysLeft >= 0 && daysLeft <= 14;
    });
    setDueGrants(grants.slice(0, 5));

    const clients = getClients().filter((c) => {
      if (c.status !== "contacted") return false;
      const updated = new Date(c.updatedAt).getTime();
      const daysSince = Math.floor((now - updated) / dayMs);
      return daysSince >= 5;
    });
    setStaleLeads(clients.slice(0, 5));

    const goals = getGoals().filter((g) => g.status === "active" && g.progress < 20);
    setAtRiskGoals(goals.slice(0, 5));

    setNotifications(getNotifications(true).slice(0, 8));
  }, []);

  const hasAny = dueGrants.length > 0 || staleLeads.length > 0 || atRiskGoals.length > 0 || notifications.length > 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-1">Focus</div>
          <h2 className="text-xl font-bold text-neutral-100">What needs your attention today</h2>
          <p className="text-sm text-neutral-500 mt-1">Grants due soon, leads to follow up, goals at risk, and recent alerts.</p>
        </div>

        {!hasAny && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
            <p className="text-neutral-500 text-sm">Nothing urgent. Check Command Center for a full overview.</p>
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="mt-4 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Go to Command Center
            </button>
          </div>
        )}

        {dueGrants.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => onNavigate("grants")}
              className="w-full flex items-center justify-between text-left rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 hover:bg-amber-400/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Grants due soon</h3>
                  <p className="text-xs text-neutral-500">{dueGrants.length} grant{dueGrants.length !== 1 ? "s" : ""} with deadline in the next 14 days</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </button>
            <ul className="mt-2 space-y-1.5">
              {dueGrants.map((g) => {
                const days = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null;
                return (
                  <li key={g.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-neutral-900/50">
                    <span className="text-neutral-300 truncate">{g.name}</span>
                    {days !== null && (
                      <span className={`text-xs font-mono flex-shrink-0 ${days <= 3 ? "text-red-400" : "text-amber-400/80"}`}>
                        {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {staleLeads.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => onNavigate("revenue")}
              className="w-full flex items-center justify-between text-left rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 hover:bg-blue-400/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Follow up with leads</h3>
                  <p className="text-xs text-neutral-500">{staleLeads.length} lead{staleLeads.length !== 1 ? "s" : ""} with no contact in 5+ days</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </button>
            <ul className="mt-2 space-y-1.5">
              {staleLeads.map((c) => (
                <li key={c.id} className="text-sm px-3 py-2 rounded-lg bg-neutral-900/50 text-neutral-300 truncate">
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {atRiskGoals.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => onNavigate("goals")}
              className="w-full flex items-center justify-between text-left rounded-xl border border-red-400/20 bg-red-400/5 p-4 hover:bg-red-400/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Goals at risk</h3>
                  <p className="text-xs text-neutral-500">{atRiskGoals.length} active goal{atRiskGoals.length !== 1 ? "s" : ""} under 20% progress</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </button>
            <ul className="mt-2 space-y-1.5">
              {atRiskGoals.map((g) => (
                <li key={g.id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-neutral-900/50">
                  <span className="text-neutral-300 truncate">{g.title}</span>
                  <span className="text-xs font-mono text-red-400/80 flex-shrink-0">{g.progress}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {notifications.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => onNavigate("notifications")}
              className="w-full flex items-center justify-between text-left rounded-xl border border-neutral-700 bg-neutral-900/50 p-4 hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">Notifications</h3>
                  <p className="text-xs text-neutral-500">{notifications.length} alert{notifications.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            </button>
            <ul className="mt-2 space-y-1.5">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="text-sm px-3 py-2 rounded-lg bg-neutral-900/50 text-neutral-400">
                  <span className="font-medium text-neutral-300">{n.title}</span>
                  {n.message && <span className="block text-xs text-neutral-500 truncate mt-0.5">{n.message}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

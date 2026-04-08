"use client";

import {
  Home, Shield, Search, Code2, Clock, Lightbulb, Zap,
  BarChart2, Users, DollarSign, Trophy, Cpu, TrendingUp,
  Settings, Target, Radar, LineChart, Bot, Plane,
  FileText, BookOpen, ClipboardList, Bell, Calendar,
  Mail, Download, Star, ScanLine, Briefcase, BookOpen as JournalIcon,
  Flame, Activity, FileText as ProposalIcon, CalendarDays, Bot as BotIcon
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  soon?: boolean;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "",
    items: [
      { id: "today",         label: "Today",             icon: Calendar },
      { id: "home",          label: "Command Center",    icon: Home },
      { id: "notifications", label: "Notifications",     icon: Bell },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { id: "brain",         label: "Founder Brain",     icon: Cpu },
      { id: "competitor",    label: "Intel Engine",       icon: Shield },
      { id: "marketgaps",    label: "Market Gaps",        icon: ScanLine, highlight: true },
      { id: "research",      label: "Deep Research",      icon: Search },
      { id: "knowledge",     label: "Knowledge Base",     icon: BookOpen },
    ],
  },
  {
    title: "BUILD",
    items: [
      { id: "hackathon",     label: "Hackathon Builder",  icon: Code2 },
      { id: "scout",         label: "Auto-Scout",         icon: Radar },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "goals",         label: "Goals & OKRs",       icon: Target },
      { id: "session",       label: "Session Brain",      icon: Clock },
      { id: "ideas",         label: "Idea Intelligence",  icon: Lightbulb },
      { id: "focus",         label: "Focus Mode",         icon: Zap },
      { id: "meetings",      label: "Meeting Prep",       icon: Briefcase, highlight: true },
      { id: "sops",          label: "SOPs & Playbooks",   icon: ClipboardList },
    ],
  },
  {
    title: "FOUNDER TOOLS",
    items: [
      { id: "decisions",     label: "Decision Journal",   icon: JournalIcon, highlight: true },
      { id: "burnrate",      label: "Burn Rate",          icon: Flame, highlight: true },
      { id: "pipeline",      label: "Deal Pipeline",      icon: TrendingUp, highlight: true },
      { id: "proposals",     label: "Proposals",          icon: ProposalIcon, highlight: true },
      { id: "energy",        label: "Energy Tracker",     icon: Activity, highlight: true },
      { id: "weeklyreview",  label: "Weekly Review",      icon: CalendarDays, highlight: true },
    ],
  },
  {
    title: "AUTONOMOUS",
    items: [
      { id: "revenueagent",  label: "Revenue Agent",      icon: BotIcon, highlight: true },
    ],
  },
  {
    title: "MONEY",
    items: [
      { id: "revenue",       label: "Revenue & Clients",  icon: DollarSign },
      { id: "grants",        label: "Grant Tracker",      icon: Trophy },
      { id: "invoices",      label: "Invoices",           icon: FileText },
    ],
  },
  {
    title: "AUTONOMOUS",
    items: [
      { id: "skills",        label: "Skill Engine",       icon: Bot,      highlight: true },
      { id: "outreach",      label: "Auto-Outreach",      icon: Mail,     highlight: true },
      { id: "away",          label: "Away Mode",          icon: Plane,    highlight: true },
      { id: "scheduler",     label: "Scheduler",          icon: Calendar, highlight: true },
    ],
  },
  {
    title: "PORTFOLIO",
    items: [
      { id: "portfolio",     label: "Wins & Portfolio",   icon: Star },
      { id: "templates",     label: "Email Templates",    icon: Mail },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { id: "reports",       label: "Weekly Report",      icon: BarChart2 },
      { id: "investor",      label: "Investor View",      icon: LineChart },
      { id: "optimizer",     label: "Cost Optimizer",     icon: TrendingUp },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { id: "team",          label: "Team",               icon: Users, soon: true },
      { id: "export",        label: "Data Export",        icon: Download },
      { id: "settings",      label: "Settings",           icon: Settings },
    ],
  },
];

interface SidebarProps {
  activeModule: string;
  onModuleChange: (id: string) => void;
  unreadNotifications?: number;
}

export default function Sidebar({ activeModule, onModuleChange, unreadNotifications = 0 }: SidebarProps) {
  return (
    <div className="w-52 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full flex-shrink-0">
      <div className="px-4 py-5 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-xs">CBT</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-neutral-200 leading-tight">CORE BRIM TECH</div>
            <div className="text-xs text-neutral-600 font-mono">OS v4.0</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.title && (
              <div className="text-xs font-mono text-neutral-700 tracking-widest uppercase px-2 mb-1.5">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.soon && onModuleChange(item.id)}
                    disabled={item.soon}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-amber-400/10 border border-amber-400/20 text-amber-400"
                        : item.soon
                        ? "text-neutral-700 cursor-not-allowed"
                        : item.highlight
                        ? "text-neutral-400 hover:text-amber-400 hover:bg-amber-400/5"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-amber-400" : item.highlight && !isActive ? "text-amber-400/50" : ""}`} />
                    <span className="text-xs font-medium flex-1 truncate">{item.label}</span>
                    {item.id === "notifications" && unreadNotifications > 0 && (
                      <span className="text-[10px] font-mono bg-red-500/20 text-red-400 rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    )}
                    {item.soon && <span className="text-xs font-mono text-neutral-800 flex-shrink-0">soon</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-neutral-800">
        <div className="text-xs text-neutral-700 font-mono">Freetown, SL 🇸🇱</div>
      </div>
    </div>
  );
}

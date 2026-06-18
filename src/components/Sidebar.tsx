"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home, Shield, Search, Code2, Clock, Lightbulb, Zap,
  BarChart2, Users, DollarSign, Trophy, Cpu, TrendingUp,
  Settings, Target, Radar, LineChart, Bot, Plane,
  FileText, BookOpen, ClipboardList, Bell, Calendar,
  Mail, Download, Star, ScanLine, Briefcase, BookOpen as JournalIcon,
  Flame, Activity, FileText as ProposalIcon, CalendarDays, Bot as BotIcon,
  Menu, X, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft
} from "lucide-react";
import { getBrain } from "@/lib/founder-brain";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  soon?: boolean;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  key: string;
  items: NavItem[];
}

// A focused founder OS: the few surfaces a founder actually needs day one. The AI co-founder
// (floating dock) is the hub; these are the data surfaces it reasons over.
const NAV_SECTIONS: NavSection[] = [
  {
    title: "",
    key: "core",
    items: [
      { id: "home",     label: "Command Center", icon: Home },
      { id: "brain",    label: "Founder Brain",  icon: Cpu },
      { id: "goals",    label: "Goals & OKRs",   icon: Target },
    ],
  },
  {
    title: "MONEY",
    key: "money",
    items: [
      { id: "burnrate", label: "Burn Rate & Runway", icon: Flame },
      { id: "pipeline", label: "Deal Pipeline",      icon: TrendingUp },
    ],
  },
  {
    title: "MARKET",
    key: "market",
    items: [
      { id: "research", label: "Research", icon: Search },
    ],
  },
  {
    title: "SYSTEM",
    key: "system",
    items: [
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

// Everything is shown by default — the whole OS now fits without collapsing.
const DEFAULT_EXPANDED = ["core", "money", "market", "system"];

// Find which section contains the active module
function findSectionForModule(moduleId: string): string | null {
  for (const section of NAV_SECTIONS) {
    if (section.items.some(item => item.id === moduleId)) {
      return section.key;
    }
  }
  return null;
}

interface SidebarProps {
  activeModule: string;
  onModuleChange: (id: string) => void;
  unreadNotifications?: number;
}

export default function Sidebar({ activeModule, onModuleChange, unreadNotifications = 0 }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const activeSection = findSectionForModule(activeModule);
    // Daily-core sections expanded by default, plus whichever section holds the active module.
    const initial = new Set(DEFAULT_EXPANDED);
    if (activeSection) initial.add(activeSection);
    return initial;
  });

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [activeModule]);

  // Close mobile drawer on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Close the mobile drawer when the viewport grows to the desktop breakpoint,
  // so a drawer opened on mobile doesn't get stuck after a resize/rotate.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    function handleChange(e: MediaQueryListEvent) {
      if (e.matches) setMobileOpen(false);
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Expand the section containing the active module
  useEffect(() => {
    const section = findSectionForModule(activeModule);
    if (section && !expandedSections.has(section)) {
      setExpandedSections(prev => new Set([...prev, section]));
    }
  }, [activeModule]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = useCallback((key: string) => {
    if (key === "core") return; // Core is always open
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleNavigate = useCallback((id: string) => {
    onModuleChange(id);
    setMobileOpen(false);
  }, [onModuleChange]);

  function renderNav(isCollapsedView: boolean) {
    return (
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {NAV_SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.key);
          const hasActiveItem = section.items.some(item => item.id === activeModule);

          return (
            <div key={section.key} className={section.key !== "core" ? "mt-3" : ""}>
              {section.title && (
                <button
                  type="button"
                  onClick={() => !isCollapsedView && toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-2 mb-1 group ${
                    isCollapsedView ? "justify-center" : ""
                  }`}
                >
                  {!isCollapsedView && (
                    <>
                      <span className={`text-xs font-mono tracking-widest uppercase transition-colors ${
                        hasActiveItem ? "text-amber-400/60" : "text-neutral-700 group-hover:text-neutral-500"
                      }`}>
                        {section.title}
                      </span>
                      {isExpanded
                        ? <ChevronDown className="w-3 h-3 text-neutral-700 group-hover:text-neutral-500" />
                        : <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:text-neutral-500" />
                      }
                    </>
                  )}
                  {isCollapsedView && (
                    <div className="w-8 border-t border-neutral-800 my-1" />
                  )}
                </button>
              )}
              {(isExpanded || isCollapsedView || !section.title) && (
                <div className="space-y-0.5">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !item.soon && handleNavigate(item.id)}
                        disabled={item.soon}
                        title={isCollapsedView ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all ${
                          isCollapsedView ? "justify-center" : ""
                        } ${
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
                        {!isCollapsedView && (
                          <span className="text-xs font-medium flex-1 truncate">{item.label}</span>
                        )}
                        {!isCollapsedView && item.id === "notifications" && unreadNotifications > 0 && (
                          <span className="text-[10px] font-mono bg-red-500/20 text-red-400 rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                          </span>
                        )}
                        {isCollapsedView && item.id === "notifications" && unreadNotifications > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                        {!isCollapsedView && item.soon && <span className="text-xs font-mono text-neutral-800 flex-shrink-0">soon</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Collapsed: show dot indicator if section has active item but is collapsed */}
              {!isExpanded && !isCollapsedView && section.title && hasActiveItem && (
                <div className="flex justify-center py-1">
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  const brandBlock = (showText: boolean) => (
    <div className={`px-4 py-5 border-b border-neutral-800 ${!showText ? "px-2 flex justify-center" : ""}`}>
      <div className={`flex items-center ${showText ? "gap-2.5" : "justify-center"}`}>
        <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
          <span className="text-black font-black text-xs">CBT</span>
        </div>
        {showText && (
          <div className="min-w-0">
            <div className="text-xs font-black text-neutral-200 leading-tight">CORE BRIM TECH</div>
            <div className="text-xs text-neutral-600 font-mono">OS v4.0</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1 -ml-1"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-[8px]">CBT</span>
          </div>
          <span className="text-xs font-black text-neutral-200">CORE BRIM TECH OS</span>
        </div>
        {unreadNotifications > 0 && (
          <button
            type="button"
            onClick={() => handleNavigate("notifications")}
            className="relative p-1"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-neutral-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
              {unreadNotifications > 9 ? "9" : unreadNotifications}
            </span>
          </button>
        )}
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col transform transition-transform duration-200 ease-out ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-xs">CBT</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-neutral-200 leading-tight">CORE BRIM TECH</div>
              <div className="text-xs text-neutral-600 font-mono">OS v4.0</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-1"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderNav(false)}
        {getBrain()?.location && (
          <div className="px-4 py-3 border-t border-neutral-800">
            <div className="text-xs text-neutral-700 font-mono">{getBrain()?.location}</div>
          </div>
        )}
      </div>

      {/* ── Desktop sidebar ── */}
      <div className={`hidden lg:flex flex-col h-full flex-shrink-0 bg-neutral-950 border-r border-neutral-800 transition-all duration-200 ${
        collapsed ? "w-14" : "w-52"
      }`}>
        {brandBlock(!collapsed)}
        {renderNav(collapsed)}
        <div className="px-2 py-2 border-t border-neutral-800 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setCollapsed(prev => !prev)}
            className="text-neutral-600 hover:text-neutral-400 transition-colors p-1.5 rounded-lg hover:bg-neutral-900"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          {!collapsed && getBrain()?.location && (
            <span className="text-xs text-neutral-700 font-mono ml-2 flex-1 truncate">{getBrain()?.location}</span>
          )}
        </div>
      </div>
    </>
  );
}

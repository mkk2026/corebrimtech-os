// CORE BRIM TECH OS — Support Module: Notification Center
import { getSupabaseClient, dbUpsert, dbUpsertMany } from "../supabase";

export type NotificationType = "deadline" | "opportunity" | "approval" | "win" | "alert" | "reminder" | "system";
export type NotificationPriority = "urgent" | "high" | "medium" | "low";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  module?: string;
  read: boolean;
  dismissed: boolean;
  actionLabel?: string;
  createdAt: string;
  expiresAt?: string;
}

const NOTIF_KEY = "cbt_os_notifications";

function syncUpsert(id: string, data: Notification): void {
  const client = getSupabaseClient();
  if (!client) return;
  void dbUpsert("notifications", id, data).catch(() => {});
}

function syncUpsertMany(records: Notification[]): void {
  const client = getSupabaseClient();
  if (!client || records.length === 0) return;
  void dbUpsertMany("notifications", records.map(r => ({ id: r.id, data: r }))).catch(() => {});
}

export function getNotifications(includeRead = false): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
    return all
      .filter(n => !n.dismissed && (includeRead || !n.read))
      .filter(n => !n.expiresAt || new Date(n.expiresAt) > new Date())
      .sort((a, b) => {
        const pOrder: NotificationPriority[] = ["urgent", "high", "medium", "low"];
        return (
          pOrder.indexOf(a.priority) - pOrder.indexOf(b.priority) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  } catch {
    return [];
  }
}

let notifCounter = 0;

export function addNotification(notif: Omit<Notification, "id" | "read" | "dismissed" | "createdAt">): Notification {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  notifCounter++;
  const newNotif: Notification = {
    ...notif,
    id: `notif_${Date.now()}_${notifCounter}`,
    read: false,
    dismissed: false,
    createdAt: new Date().toISOString(),
  };
  all.unshift(newNotif);
  const trimmed = all.slice(0, 20);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(trimmed));
  syncUpsert(newNotif.id, newNotif);
  return newNotif;
}

export function markRead(id: string): void {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  const n = all.find(n => n.id === id);
  if (n) {
    n.read = true;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    syncUpsert(id, n);
  }
}

export function markAllRead(): void {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  all.forEach(n => (n.read = true));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  syncUpsertMany(all);
}

export function dismissNotification(id: string): void {
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  const n = all.find(n => n.id === id);
  if (n) {
    n.dismissed = true;
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    syncUpsert(id, n);
  }
}

export function getUnreadCount(): number {
  return getNotifications(false).length;
}

export function clearAllNotifications(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIF_KEY, "[]");
  notifCounter = 0;
}

export function deduplicateNotifications(): void {
  if (typeof window === "undefined") return;
  const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];
  const seen = new Set<string>();
  const unique = all.filter(n => {
    const sig = `${n.type}-${n.title}-${n.message}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
  localStorage.setItem(NOTIF_KEY, JSON.stringify(unique));
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.includes("T");
}

export function generateSystemNotifications(): void {
  if (typeof window === "undefined") return;

  try {
    const grants = JSON.parse(localStorage.getItem("cbt_os_grants") || "[]");
    const clients = JSON.parse(localStorage.getItem("cbt_os_clients") || "[]");
    const goals = JSON.parse(localStorage.getItem("cbt_os_goals") || "[]");
    const listings = JSON.parse(localStorage.getItem("cbt_os_hackathon_listings") || "[]");
    const existing = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]") as Notification[];

    const existingSignatures = new Set(existing.map(n => `${n.type}-${n.title}-${n.message}`));
    const toAdd: Omit<Notification, "id" | "read" | "dismissed" | "createdAt">[] = [];

    const hasRealData = grants.length > 0 || clients.length > 0 || goals.length > 0 || listings.length > 0;
    if (!hasRealData) return;

    grants.forEach((g: { id?: string; deadline?: string; status: string; name: string; isBuiltIn?: boolean }) => {
      if (g.isBuiltIn || !g.deadline || g.status === "won" || g.status === "rejected") return;
      if (!isValidDate(g.deadline)) return;

      const days = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000);
      if (days > 0 && days <= 7) {
        const sig = `deadline-Grant deadline in ${days} day${days === 1 ? "" : "s"}-${g.name}`;
        if (!existingSignatures.has(sig)) {
          toAdd.push({
            type: "deadline",
            priority: days <= 3 ? "urgent" : "high",
            title: `Grant deadline in ${days} day${days === 1 ? "" : "s"}`,
            message: `${g.name} — don't miss this.`,
            module: "grants",
            actionLabel: "Open Grant Tracker",
            expiresAt: g.deadline,
          });
        }
      }
    });

    listings
      .filter((l: { fitScore: number; status: string }) => l.fitScore >= 90 && l.status === "new")
      .forEach((l: { title: string; prizeDisplay: string; fitScore: number }) => {
        const sig = `opportunity-High-fit hackathon found-${l.title}`;
        if (!existingSignatures.has(sig)) {
          toAdd.push({
            type: "opportunity",
            priority: "high",
            title: `High-fit hackathon found`,
            message: `${l.title} — ${l.prizeDisplay} · ${l.fitScore}% fit`,
            module: "scout",
            actionLabel: "View in Scout",
          });
        }
      });

    clients
      .filter((c: { status: string; updatedAt: string; name: string }) => c.status === "contacted")
      .forEach((c: { updatedAt: string; name: string }) => {
        const daysSince = Math.floor((Date.now() - new Date(c.updatedAt).getTime()) / 86400000);
        if (daysSince >= 7) {
          const sig = `reminder-Follow up with ${c.name}`;
          if (!existingSignatures.has(sig)) {
            toAdd.push({
              type: "reminder",
              priority: "medium",
              title: `Follow up with ${c.name}`,
              message: `No activity in ${daysSince} days — send a follow-up now.`,
              module: "revenue",
              actionLabel: "Open Pipeline",
            });
          }
        }
      });

    goals
      .filter((g: { status: string; progress: number; title: string }) => g.status === "active" && g.progress < 20)
      .forEach((g: { title: string }) => {
        const sig = `alert-Goal at risk-${g.title}`;
        if (!existingSignatures.has(sig)) {
          toAdd.push({
            type: "alert",
            priority: "medium",
            title: `Goal at risk`,
            message: `"${g.title}" is under 20% progress.`,
            module: "goals",
            actionLabel: "View Goals",
          });
        }
      });

    toAdd.slice(0, 5).forEach(n => addNotification(n));
  } catch {
    // silently fail
  }
}

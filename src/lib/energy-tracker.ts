// CORE BRIM TECH OS — Energy Tracker
// Understand when you're most productive and what drains you

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type ActivityType = "deep_work" | "meetings" | "admin" | "creative" | "learning" | "exercise" | "rest" | "social";

export interface EnergyEntry {
  id: string;
  date: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  energyLevel: EnergyLevel;
  activity: ActivityType;
  activityName: string;
  duration: number; // minutes
  notes?: string;
  mood?: "terrible" | "bad" | "neutral" | "good" | "great";
  productivity?: "low" | "medium" | "high";
  tags: string[];
}

export interface EnergyPattern {
  timeOfDay: string;
  avgEnergy: number;
  bestActivities: ActivityType[];
  worstActivities: ActivityType[];
}

export interface EnergyStats {
  totalEntries: number;
  avgEnergy: number;
  bestTimeOfDay: string;
  worstTimeOfDay: string;
  mostProductiveActivity: ActivityType | null;
  energyDrains: ActivityType[];
  energyBoosts: ActivityType[];
  streak: number; // days with entries
}

const ENERGY_KEY = "cbt_os_energy";

export function getEnergyEntries(): EnergyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ENERGY_KEY) || "[]")
      .sort((a: EnergyEntry, b: EnergyEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch { return []; }
}

export function addEnergyEntry(entry: Omit<EnergyEntry, "id">): EnergyEntry {
  const newEntry: EnergyEntry = {
    ...entry,
    id: `energy_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
  
  const entries = getEnergyEntries();
  entries.unshift(newEntry);
  
  if (entries.length > 1000) entries.length = 1000;
  
  localStorage.setItem(ENERGY_KEY, JSON.stringify(entries));
  return newEntry;
}

export function deleteEnergyEntry(id: string): void {
  const entries = getEnergyEntries().filter(e => e.id !== id);
  localStorage.setItem(ENERGY_KEY, JSON.stringify(entries));
}

export function getEnergyStats(): EnergyStats {
  const entries = getEnergyEntries();
  
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      avgEnergy: 0,
      bestTimeOfDay: "Unknown",
      worstTimeOfDay: "Unknown",
      mostProductiveActivity: null,
      energyDrains: [],
      energyBoosts: [],
      streak: 0,
    };
  }
  
  // Average energy
  const avgEnergy = entries.reduce((sum, e) => sum + e.energyLevel, 0) / entries.length;
  
  // Best/worst time of day
  const timeOfDayEnergy: Record<string, number[]> = {};
  entries.forEach(e => {
    if (!timeOfDayEnergy[e.timeOfDay]) timeOfDayEnergy[e.timeOfDay] = [];
    timeOfDayEnergy[e.timeOfDay].push(e.energyLevel);
  });
  
  const timeOfDayAvg = Object.entries(timeOfDayEnergy).map(([time, levels]) => ({
    time,
    avg: levels.reduce((a, b) => a + b, 0) / levels.length,
  }));
  
  timeOfDayAvg.sort((a, b) => b.avg - a.avg);
  
  // Activity analysis
  const activityEnergy: Record<ActivityType, number[]> = {} as Record<ActivityType, number[]>;
  entries.forEach(e => {
    if (!activityEnergy[e.activity]) activityEnergy[e.activity] = [];
    activityEnergy[e.activity].push(e.energyLevel);
  });
  
  const activityAvg = Object.entries(activityEnergy).map(([activity, levels]) => ({
    activity: activity as ActivityType,
    avg: levels.reduce((a, b) => a + b, 0) / levels.length,
  }));
  
  activityAvg.sort((a, b) => b.avg - a.avg);
  
  // Productivity analysis
  const activityProductivity: Record<ActivityType, { high: number; total: number }> = {} as Record<ActivityType, { high: number; total: number }>;
  entries.filter(e => e.productivity).forEach(e => {
    if (!activityProductivity[e.activity]) activityProductivity[e.activity] = { high: 0, total: 0 };
    activityProductivity[e.activity].total++;
    if (e.productivity === "high") activityProductivity[e.activity].high++;
  });
  
  const productivityRates = Object.entries(activityProductivity)
    .map(([activity, stats]) => ({
      activity: activity as ActivityType,
      rate: stats.high / stats.total,
    }))
    .sort((a, b) => b.rate - a.rate);
  
  // Calculate streak
  const dates = [...new Set(entries.map(e => e.date.split("T")[0]))].sort();
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i];
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - (dates.length - 1 - i));
    
    if (date === expectedDate.toISOString().split("T")[0] || (i === dates.length - 1 && date === today)) {
      streak++;
    } else {
      break;
    }
  }
  
  return {
    totalEntries: entries.length,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    bestTimeOfDay: timeOfDayAvg[0]?.time || "Unknown",
    worstTimeOfDay: timeOfDayAvg[timeOfDayAvg.length - 1]?.time || "Unknown",
    mostProductiveActivity: productivityRates[0]?.activity || null,
    energyBoosts: activityAvg.filter(a => a.avg >= 4).map(a => a.activity),
    energyDrains: activityAvg.filter(a => a.avg <= 2.5).map(a => a.activity),
    streak,
  };
}

export function getEnergyByTimeOfDay(): EnergyPattern[] {
  const entries = getEnergyEntries();
  const times: ("morning" | "afternoon" | "evening" | "night")[] = ["morning", "afternoon", "evening", "night"];
  
  return times.map(time => {
    const timeEntries = entries.filter(e => e.timeOfDay === time);
    const avgEnergy = timeEntries.length > 0
      ? timeEntries.reduce((sum, e) => sum + e.energyLevel, 0) / timeEntries.length
      : 0;
    
    // Activity analysis for this time
    const activityEnergy: Record<ActivityType, number[]> = {} as Record<ActivityType, number[]>;
    timeEntries.forEach(e => {
      if (!activityEnergy[e.activity]) activityEnergy[e.activity] = [];
      activityEnergy[e.activity].push(e.energyLevel);
    });
    
    const activityAvg = Object.entries(activityEnergy)
      .map(([activity, levels]) => ({
        activity: activity as ActivityType,
        avg: levels.reduce((a, b) => a + b, 0) / levels.length,
      }))
      .sort((a, b) => b.avg - a.avg);
    
    return {
      timeOfDay: time,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      bestActivities: activityAvg.slice(0, 3).map(a => a.activity),
      worstActivities: activityAvg.slice(-3).map(a => a.activity),
    };
  });
}

export function getTodayEntries(): EnergyEntry[] {
  const today = new Date().toISOString().split("T")[0];
  return getEnergyEntries().filter(e => e.date.startsWith(today));
}

export function getWeeklyReport(): { date: string; avgEnergy: number; totalActivities: number }[] {
  const entries = getEnergyEntries();
  const days: Record<string, EnergyEntry[]> = {};
  
  entries.forEach(e => {
    const date = e.date.split("T")[0];
    if (!days[date]) days[date] = [];
    days[date].push(e);
  });
  
  return Object.entries(days)
    .map(([date, dayEntries]) => ({
      date,
      avgEnergy: Math.round((dayEntries.reduce((sum, e) => sum + e.energyLevel, 0) / dayEntries.length) * 10) / 10,
      totalActivities: dayEntries.length,
    }))
    .slice(0, 7);
}

// Activity labels
export const ACTIVITY_LABELS: Record<ActivityType, { label: string; icon: string; color: string }> = {
  deep_work: { label: "Deep Work", icon: "🎯", color: "text-purple-400" },
  meetings: { label: "Meetings", icon: "👥", color: "text-blue-400" },
  admin: { label: "Admin", icon: "📋", color: "text-neutral-400" },
  creative: { label: "Creative", icon: "✨", color: "text-pink-400" },
  learning: { label: "Learning", icon: "📚", color: "text-amber-400" },
  exercise: { label: "Exercise", icon: "💪", color: "text-emerald-400" },
  rest: { label: "Rest", icon: "😴", color: "text-cyan-400" },
  social: { label: "Social", icon: "🎉", color: "text-orange-400" },
};

export const TIME_LABELS: Record<EnergyEntry["timeOfDay"], string> = {
  morning: "Morning (6am-12pm)",
  afternoon: "Afternoon (12pm-5pm)",
  evening: "Evening (5pm-9pm)",
  night: "Night (9pm-6am)",
};

export const ENERGY_LABELS: Record<EnergyLevel, { label: string; color: string; emoji: string }> = {
  1: { label: "Exhausted", color: "text-red-500", emoji: "😫" },
  2: { label: "Low", color: "text-orange-400", emoji: "😔" },
  3: { label: "Okay", color: "text-yellow-400", emoji: "😐" },
  4: { label: "Good", color: "text-lime-400", emoji: "🙂" },
  5: { label: "Peak", color: "text-emerald-400", emoji: "🤩" },
};


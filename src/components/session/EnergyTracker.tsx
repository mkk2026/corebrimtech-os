"use client";

import { useState, useEffect } from "react";
import { Activity, Plus, Flame, Sun, Sunset, Moon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getEnergyEntries,
  getEnergyStats,
  getEnergyByTimeOfDay,
  addEnergyEntry,
  deleteEnergyEntry,
  ACTIVITY_LABELS,
  TIME_LABELS,
  ENERGY_LABELS,
  type EnergyLevel,
  type ActivityType,
  type EnergyEntry,
} from "@/lib/energy-tracker";

export default function EnergyTracker() {
  const [entries, setEntries] = useState<EnergyEntry[]>([]);
  const [stats, setStats] = useState(getEnergyStats());
  const [patterns, setPatterns] = useState(getEnergyByTimeOfDay());
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<{
    timeOfDay: EnergyEntry["timeOfDay"];
    energyLevel: EnergyLevel;
    activity: ActivityType;
    activityName: string;
    duration: number;
  }>({
    timeOfDay: "morning",
    energyLevel: 3,
    activity: "deep_work",
    activityName: "",
    duration: 60,
  });

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setEntries(getEnergyEntries().slice(0, 20));
    setStats(getEnergyStats());
    setPatterns(getEnergyByTimeOfDay());
  }

  function handleAdd() {
    addEnergyEntry({
      ...newEntry,
      date: new Date().toISOString(),
      tags: [],
    });
    refresh();
    setIsAdding(false);
  }

  const TimeIcon = { morning: Sun, afternoon: Sun, evening: Sunset, night: Moon }[newEntry.timeOfDay];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-neutral-100">Energy Tracker</h2>
        <p className="text-sm text-neutral-500">Understand when you're most productive</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-neutral-300">{stats.avgEnergy}</div>
          <div className="text-xs text-neutral-600">Avg Energy</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400 capitalize">{stats.bestTimeOfDay.slice(0, 3)}</div>
          <div className="text-xs text-neutral-600">Best Time</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.streak}</div>
          <div className="text-xs text-neutral-600">Day Streak</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalEntries}</div>
          <div className="text-xs text-neutral-600">Entries</div>
        </div>
      </div>

      {/* Patterns */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-sm text-neutral-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Energy by Time of Day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {patterns.map(p => (
            <div key={p.timeOfDay} className="flex items-center gap-3">
              <span className="text-sm text-neutral-400 w-20 capitalize">{p.timeOfDay}</span>
              <div className="flex-1 h-8 bg-neutral-950 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${p.avgEnergy >= 4 ? "bg-emerald-400" : p.avgEnergy >= 3 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ width: `${(p.avgEnergy / 5) * 100}%` }}
                />
              </div>
              <span className={`text-sm font-bold w-8 text-right ${p.avgEnergy >= 4 ? "text-emerald-400" : p.avgEnergy >= 3 ? "text-yellow-400" : "text-red-400"}`}>
                {p.avgEnergy}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Entry */}
      {isAdding ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4 space-y-4">
            {/* Time of Day */}
            <div className="flex gap-2">
              {(["morning", "afternoon", "evening", "night"] as const).map(time => {
                const Icon = { morning: Sun, afternoon: Sun, evening: Sunset, night: Moon }[time];
                return (
                  <button
                    key={time}
                    onClick={() => setNewEntry({ ...newEntry, timeOfDay: time })}
                    className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                      newEntry.timeOfDay === time 
                        ? "border-blue-400/40 bg-blue-400/10 text-blue-400" 
                        : "border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs capitalize">{time}</span>
                  </button>
                );
              })}
            </div>

            {/* Energy Level */}
            <div>
              <div className="text-xs text-neutral-500 mb-2">Energy Level</div>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as EnergyLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setNewEntry({ ...newEntry, energyLevel: level })}
                    className={`flex-1 p-3 rounded-lg border text-center transition-all ${
                      newEntry.energyLevel === level 
                        ? "border-blue-400/40 bg-blue-400/10" 
                        : "border-neutral-800"
                    }`}
                  >
                    <span className="text-2xl">{ENERGY_LABELS[level].emoji}</span>
                    <div className={`text-xs mt-1 ${ENERGY_LABELS[level].color}`}>{ENERGY_LABELS[level].label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div>
              <div className="text-xs text-neutral-500 mb-2">Activity</div>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(activity => (
                  <button
                    key={activity}
                    onClick={() => setNewEntry({ ...newEntry, activity, activityName: ACTIVITY_LABELS[activity].label })}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      newEntry.activity === activity 
                        ? "border-blue-400/40 bg-blue-400/10" 
                        : "border-neutral-800"
                    }`}
                  >
                    <span className="text-lg">{ACTIVITY_LABELS[activity].icon}</span>
                    <div className="text-xs text-neutral-400 mt-1">{ACTIVITY_LABELS[activity].label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="text-xs text-neutral-500 mb-2">Duration: {newEntry.duration} minutes</div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={newEntry.duration}
                onChange={e => setNewEntry({ ...newEntry, duration: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1 bg-blue-600">Log Entry</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Log Energy
        </Button>
      )}

      {/* Recent Entries */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-sm text-neutral-400">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {entries.slice(0, 10).map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-2 bg-neutral-950 rounded">
              <div className="flex items-center gap-3">
                <span className="text-lg">{ENERGY_LABELS[entry.energyLevel].emoji}</span>
                <div>
                  <div className="text-sm text-neutral-300">{entry.activityName}</div>
                  <div className="text-xs text-neutral-500 capitalize">{entry.timeOfDay} • {entry.duration}min</div>
                </div>
              </div>
              <button onClick={() => { deleteEnergyEntry(entry.id); refresh(); }} className="text-red-400 hover:text-red-300">
                <Flame className="w-4 h-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

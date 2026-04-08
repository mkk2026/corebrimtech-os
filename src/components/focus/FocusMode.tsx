"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Play, Pause, RotateCcw, Check, ChevronRight, Target, Brain } from "lucide-react";
import { getPendingTasks, toggleTask, type Task } from "@/lib/session-brain";
import { getTopIdeas } from "@/lib/idea-intelligence";

const FOCUS_DURATIONS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusMode() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [duration, setDuration] = useState(FOCUS_DURATIONS[0].seconds);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const topIdeas = getTopIdeas(3);

  useEffect(() => {
    const pending = getPendingTasks();
    setTasks(pending);
    if (pending.length > 0 && !focusTask) setFocusTask(pending[0]);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false);
            setDone(true);
            setSessions(s => s + 1);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function handleStart() {
    setDone(false);
    setRunning(true);
  }

  function handlePause() { setRunning(false); }

  function handleReset() {
    setRunning(false);
    setDone(false);
    setTimeLeft(duration);
  }

  function handleDurationChange(secs: number) {
    setDuration(secs);
    setTimeLeft(secs);
    setRunning(false);
    setDone(false);
  }

  function handleCompleteTask() {
    if (!focusTask) return;
    toggleTask(focusTask.id);
    const remaining = getPendingTasks();
    setTasks(remaining);
    setFocusTask(remaining[0] || null);
    handleReset();
  }

  const progress = ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-2">Focus Mode</div>
          <p className="text-sm text-neutral-500">One task. Full attention. No distractions.</p>
        </div>

        {/* Focus task selector */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">
            Working on
          </div>
          {focusTask ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-neutral-950 border border-amber-400/20 rounded-lg">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-neutral-100 flex-1">{focusTask.text}</span>
                {focusTask.project && (
                  <span className="text-xs font-mono text-neutral-600">{focusTask.project}</span>
                )}
              </div>
              {tasks.length > 1 && (
                <div className="space-y-1">
                  {tasks.slice(1, 4).map(task => (
                    <button
                      key={task.id}
                      onClick={() => setFocusTask(task)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-all text-left"
                    >
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      {task.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-neutral-600">
              <Target className="w-5 h-5" />
              <p className="text-sm">No pending tasks — add tasks in Session Brain first.</p>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 flex flex-col items-center gap-6">
          {/* Duration selector */}
          <div className="flex gap-2">
            {FOCUS_DURATIONS.map(({ label, seconds }) => (
              <button
                key={seconds}
                onClick={() => handleDurationChange(seconds)}
                disabled={running}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  duration === seconds
                    ? "border-amber-400/40 text-amber-400 bg-amber-400/10"
                    : "border-neutral-800 text-neutral-600 hover:text-neutral-400 disabled:opacity-40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Circle timer */}
          <div className="relative">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r="54" fill="none" stroke="#1f1f2e" strokeWidth="8" />
              <circle
                cx="70" cy="70" r="54" fill="none"
                stroke={done ? "#10b981" : running ? "#f5a623" : "#374151"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * progress) / 100}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {done ? (
                <Check className="w-8 h-8 text-emerald-400" />
              ) : (
                <span className="text-3xl font-bold font-mono text-neutral-100">
                  {formatTimer(timeLeft)}
                </span>
              )}
              {sessions > 0 && (
                <span className="text-xs text-neutral-600 font-mono mt-1">{sessions} done today</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!running && !done && (
              <button
                onClick={handleStart}
                disabled={!focusTask}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                {timeLeft === duration ? "Start Focus" : "Resume"}
              </button>
            )}
            {running && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {done && focusTask && (
              <button
                onClick={handleCompleteTask}
                className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark Done & Next
              </button>
            )}
            {(running || timeLeft < duration) && (
              <button
                onClick={handleReset}
                className="p-3 text-neutral-600 hover:text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {done && (
            <div className="text-center">
              <p className="text-sm text-emerald-400 font-semibold">Session complete! 🔥</p>
              <p className="text-xs text-neutral-600 mt-1">Take a 5-min break, then keep going.</p>
            </div>
          )}
        </div>

        {/* Top ideas reminder */}
        {topIdeas.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                Top Ideas to Build Next
              </span>
            </div>
            <div className="space-y-2">
              {topIdeas.map((idea, i) => (
                <div key={idea.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-neutral-700 w-4">{i + 1}.</span>
                  <span className="text-sm text-neutral-400 flex-1">{idea.title}</span>
                  <span className="text-xs font-mono text-amber-400">{idea.totalScore}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

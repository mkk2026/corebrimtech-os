"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle, TrendingUp, Zap, Target, Plus, ChevronRight, Flame, Star, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  getWeeklyReviews,
  getOrCreateCurrentReview,
  updateWeeklyReview,
  completeReview,
  generateReviewInsights,
  getWeeklyReviewStats,
  getReviewStreak,
  type WeeklyReview,
} from "@/lib/weekly-review";

export default function WeeklyReview() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);
  const [stats, setStats] = useState(getWeeklyReviewStats());
  const [streak, setStreak] = useState(getReviewStreak());
  const [isEditing, setIsEditing] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    setReviews(getWeeklyReviews());
    const current = getOrCreateCurrentReview();
    setCurrentReview(current);
    setStats(getWeeklyReviewStats());
    setStreak(getReviewStreak());
    setInsights(generateReviewInsights(current));
  }

  function handleUpdate(updates: Partial<WeeklyReview>) {
    if (!currentReview) return;
    updateWeeklyReview(currentReview.id, updates);
    refresh();
  }

  function handleComplete() {
    if (!currentReview) return;
    completeReview(currentReview.id);
    refresh();
    setIsEditing(false);
  }

  function addItem(field: "wins" | "challenges" | "lessonsLearned" | "prioritiesNextWeek", value: string) {
    if (!currentReview || !value.trim()) return;
    handleUpdate({ [field]: [...currentReview[field], value.trim()] });
  }

  function removeItem(field: "wins" | "challenges" | "lessonsLearned" | "prioritiesNextWeek", index: number) {
    if (!currentReview) return;
    const newArray = [...currentReview[field]];
    newArray.splice(index, 1);
    handleUpdate({ [field]: newArray });
  }

  if (!currentReview) return null;

  const weekStart = new Date(currentReview.weekStarting);
  const isCompleted = !!currentReview.completedAt;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-100">Weekly Review</h2>
          <p className="text-sm text-neutral-500">
            Week of {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {isCompleted && <span className="text-emerald-400 ml-2">✓ Completed</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-amber-400">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{streak}</span>
              <span className="text-xs text-neutral-500">week streak</span>
            </div>
          )}
          {!isCompleted && (
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="border-neutral-700">
              {isEditing ? "Done Editing" : "Edit Review"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{stats.completionRate}%</div>
          <div className="text-xs text-neutral-600">Completion</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{stats.avgEnergy}</div>
          <div className="text-xs text-neutral-600">Avg Energy</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.avgFocus}</div>
          <div className="text-xs text-neutral-600">Avg Focus</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{stats.totalWins}</div>
          <div className="text-xs text-neutral-600">Total Wins</div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="bg-blue-950/20 border-blue-900/30">
          <CardHeader>
            <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-blue-400/80">• {insight}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-4 pr-4">
          {/* Wins */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Wins This Week
              </CardTitle>
              <span className="text-xs text-neutral-500">{currentReview.wins.length}</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentReview.wins.map((win, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-neutral-950 rounded">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-sm text-neutral-300 flex-1">{win}</span>
                  {isEditing && (
                    <button onClick={() => removeItem("wins", i)} className="text-red-400 text-xs">×</button>
                  )}
                </div>
              ))}
              {isEditing && (
                <form onSubmit={e => { e.preventDefault(); const input = e.currentTarget.elements.namedItem("win") as HTMLInputElement; addItem("wins", input.value); input.value = ""; }} className="flex gap-2">
                  <input name="win" placeholder="Add a win..." className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200" />
                  <Button type="submit" size="sm"><Plus className="w-4 h-4" /></Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Challenges */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentReview.challenges.map((challenge, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-neutral-950 rounded">
                  <span className="text-red-400 mt-0.5">!</span>
                  <span className="text-sm text-neutral-300 flex-1">{challenge}</span>
                  {isEditing && (
                    <button onClick={() => removeItem("challenges", i)} className="text-red-400 text-xs">×</button>
                  )}
                </div>
              ))}
              {isEditing && (
                <form onSubmit={e => { e.preventDefault(); const input = e.currentTarget.elements.namedItem("challenge") as HTMLInputElement; addItem("challenges", input.value); input.value = ""; }} className="flex gap-2">
                  <input name="challenge" placeholder="Add a challenge..." className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200" />
                  <Button type="submit" size="sm"><Plus className="w-4 h-4" /></Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Lessons Learned
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentReview.lessonsLearned.map((lesson, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-neutral-950 rounded">
                  <span className="text-amber-400 mt-0.5">💡</span>
                  <span className="text-sm text-neutral-300 flex-1">{lesson}</span>
                  {isEditing && (
                    <button onClick={() => removeItem("lessonsLearned", i)} className="text-red-400 text-xs">×</button>
                  )}
                </div>
              ))}
              {isEditing && (
                <form onSubmit={e => { e.preventDefault(); const input = e.currentTarget.elements.namedItem("lesson") as HTMLInputElement; addItem("lessonsLearned", input.value); input.value = ""; }} className="flex gap-2">
                  <input name="lesson" placeholder="Add a lesson..." className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200" />
                  <Button type="submit" size="sm"><Plus className="w-4 h-4" /></Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Energy & Focus */}
          {isEditing && (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-sm text-neutral-400">How was your week?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-2">Energy Level: {currentReview.energyLevel}/5</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        onClick={() => handleUpdate({ energyLevel: level as 1|2|3|4|5 })}
                        className={`flex-1 py-2 rounded-lg border transition-all ${
                          currentReview.energyLevel === level 
                            ? "border-blue-400/40 bg-blue-400/10 text-blue-400" 
                            : "border-neutral-800 text-neutral-500"
                        }`}
                      >
                        {level === 1 ? "😫" : level === 2 ? "😔" : level === 3 ? "😐" : level === 4 ? "🙂" : "🤩"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-2">Focus Level: {currentReview.focusLevel}/5</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        onClick={() => handleUpdate({ focusLevel: level as 1|2|3|4|5 })}
                        className={`flex-1 py-2 rounded-lg border transition-all ${
                          currentReview.focusLevel === level 
                            ? "border-blue-400/40 bg-blue-400/10 text-blue-400" 
                            : "border-neutral-800 text-neutral-500"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Week */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Priorities Next Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentReview.prioritiesNextWeek.map((priority, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-neutral-950 rounded">
                  <span className="text-blue-400 mt-0.5">→</span>
                  <span className="text-sm text-neutral-300 flex-1">{priority}</span>
                  {isEditing && (
                    <button onClick={() => removeItem("prioritiesNextWeek", i)} className="text-red-400 text-xs">×</button>
                  )}
                </div>
              ))}
              {isEditing && (
                <form onSubmit={e => { e.preventDefault(); const input = e.currentTarget.elements.namedItem("priority") as HTMLInputElement; addItem("prioritiesNextWeek", input.value); input.value = ""; }} className="flex gap-2">
                  <input name="priority" placeholder="Add priority for next week..." className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200" />
                  <Button type="submit" size="sm"><Plus className="w-4 h-4" /></Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Complete Button */}
          {!isCompleted && (
            <Button onClick={handleComplete} className="w-full bg-emerald-600 hover:bg-emerald-500">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Weekly Review
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

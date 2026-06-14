// CORE BRIM TECH OS — Weekly Review
// Automated reflection and planning system

export interface WeeklyReview {
  id: string;
  weekStarting: string;
  completedAt?: string;
  
  // Reflection
  wins: string[];
  challenges: string[];
  lessonsLearned: string[];
  energyLevel: 1 | 2 | 3 | 4 | 5;
  focusLevel: 1 | 2 | 3 | 4 | 5;
  
  // Metrics
  goalsProgress: { goalId: string; goalTitle: string; progress: number }[];
  dealsMoved: number;
  proposalsSent: number;
  meetingsHeld: number;
  energyEntries: number;
  decisionsMade: number;
  
  // Planning
  prioritiesNextWeek: string[];
  goalsForNextWeek: string[];
  blockersToRemove: string[];
  
  // Insights (auto-generated)
  aiInsights?: string[];
  suggestedFocus?: string;
}

const REVIEWS_KEY = "cbt_os_weekly_reviews";

export function getWeeklyReviews(): WeeklyReview[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]")
      .sort((a: WeeklyReview, b: WeeklyReview) => new Date(b.weekStarting).getTime() - new Date(a.weekStarting).getTime());
  } catch { return []; }
}

export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export function getOrCreateCurrentReview(): WeeklyReview {
  const weekStart = getCurrentWeekStart();
  const reviews = getWeeklyReviews();
  const existing = reviews.find(r => r.weekStarting === weekStart);
  
  if (existing) return existing;
  
  const newReview: WeeklyReview = {
    id: `review_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    weekStarting: weekStart,
    wins: [],
    challenges: [],
    lessonsLearned: [],
    energyLevel: 3,
    focusLevel: 3,
    goalsProgress: [],
    dealsMoved: 0,
    proposalsSent: 0,
    meetingsHeld: 0,
    energyEntries: 0,
    decisionsMade: 0,
    prioritiesNextWeek: [],
    goalsForNextWeek: [],
    blockersToRemove: [],
  };
  
  reviews.unshift(newReview);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  return newReview;
}

export function updateWeeklyReview(id: string, updates: Partial<WeeklyReview>): void {
  const reviews = getWeeklyReviews();
  const idx = reviews.findIndex(r => r.id === id);
  if (idx >= 0) {
    reviews[idx] = { ...reviews[idx], ...updates };
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }
}

export function completeReview(id: string): void {
  updateWeeklyReview(id, { completedAt: new Date().toISOString() });
}

export function generateReviewInsights(review: WeeklyReview): string[] {
  const insights: string[] = [];
  
  // Energy analysis
  if (review.energyLevel <= 2) {
    insights.push("Your energy was low this week. Consider what activities drained you and how to reduce them.");
  } else if (review.energyLevel >= 4) {
    insights.push("Great energy this week! Identify what contributed to this and try to replicate it.");
  }
  
  // Productivity analysis
  if (review.focusLevel <= 2) {
    insights.push("Focus was a challenge. Try time-blocking or reducing distractions next week.");
  }
  
  // Wins analysis
  if (review.wins.length === 0) {
    insights.push("No wins recorded this week. Take time to celebrate small victories - they matter!");
  } else if (review.wins.length >= 3) {
    insights.push(`Excellent week with ${review.wins.length} wins! You're building momentum.`);
  }
  
  // Goal progress
  const avgProgress = review.goalsProgress.length > 0
    ? review.goalsProgress.reduce((sum, g) => sum + g.progress, 0) / review.goalsProgress.length
    : 0;
  
  if (avgProgress < 25) {
    insights.push("Goal progress was slow. Consider if your goals are realistic or if you need support.");
  } else if (avgProgress > 75) {
    insights.push("Strong progress on goals! You're on track to achieve what you set out to do.");
  }
  
  // Activity analysis
  if (review.meetingsHeld > 10) {
    insights.push("You had a lot of meetings this week. Consider if all were necessary or if some could be async.");
  }
  
  if (review.dealsMoved === 0 && review.proposalsSent === 0) {
    insights.push("No sales activity recorded. Next week, prioritize moving deals forward.");
  }
  
  return insights;
}

export function getWeeklyReviewStats() {
  const reviews = getWeeklyReviews();
  const completed = reviews.filter(r => r.completedAt);
  
  return {
    total: reviews.length,
    completed: completed.length,
    completionRate: reviews.length > 0 ? Math.round((completed.length / reviews.length) * 100) : 0,
    avgEnergy: completed.length > 0 
      ? Math.round(completed.reduce((sum, r) => sum + r.energyLevel, 0) / completed.length * 10) / 10
      : 0,
    avgFocus: completed.length > 0
      ? Math.round(completed.reduce((sum, r) => sum + r.focusLevel, 0) / completed.length * 10) / 10
      : 0,
    totalWins: completed.reduce((sum, r) => sum + r.wins.length, 0),
  };
}

// Get streak of completed weekly reviews
export function getReviewStreak(): number {
  const reviews = getWeeklyReviews().filter(r => r.completedAt);
  if (reviews.length === 0) return 0;
  
  let streak = 0;
  const now = new Date();
  
  for (let i = 0; i < 52; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - (i * 7));
    const weekStart = getWeekStart(checkDate);
    
    const hasReview = reviews.some(r => r.weekStarting === weekStart && r.completedAt);
    if (hasReview) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}


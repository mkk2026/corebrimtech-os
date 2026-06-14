// CORE BRIM TECH OS — Burn Rate Tracker
// Know exactly how much runway you have

export interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "yearly" | "one-time";
  category: "salaries" | "infrastructure" | "marketing" | "office" | "legal" | "other";
  essential: boolean; // Can this be cut in emergency?
  startDate: string;
  endDate?: string; // For temporary expenses
}

export interface Revenue {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "one-time";
  type: "recurring" | "contract" | "grant" | "investment";
  confidence: number; // 0-100, how certain is this revenue
  startDate: string;
  endDate?: string;
}

export interface CashPosition {
  date: string;
  balance: number;
  projected: boolean;
}

export interface BurnRateConfig {
  currentBalance: number;
  targetRunwayMonths: number;
  emergencyFundMonths: number;
  currency: string;
}

export interface RunwayProjection {
  months: number;
  zeroCashDate: string;
  monthlyBurn: number;
  monthlyRevenue: number;
  netBurn: number;
  scenarios: {
    conservative: { months: number; zeroCashDate: string };
    realistic: { months: number; zeroCashDate: string };
    optimistic: { months: number; zeroCashDate: string };
  };
}

const EXPENSES_KEY = "cbt_os_expenses";
const REVENUE_KEY = "cbt_os_revenue";
const BURN_CONFIG_KEY = "cbt_os_burn_config";

export function getExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(EXPENSES_KEY) || "[]");
  } catch { return []; }
}

export function addExpense(expense: Omit<Expense, "id">): Expense {
  const newExpense: Expense = {
    ...expense,
    id: `expense_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
  
  const expenses = getExpenses();
  expenses.push(newExpense);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx >= 0) {
    expenses[idx] = { ...expenses[idx], ...updates };
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses().filter(e => e.id !== id);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function getRevenue(): Revenue[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REVENUE_KEY) || "[]");
  } catch { return []; }
}

export function addRevenue(revenue: Omit<Revenue, "id">): Revenue {
  const newRevenue: Revenue = {
    ...revenue,
    id: `revenue_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
  
  const revenues = getRevenue();
  revenues.push(newRevenue);
  localStorage.setItem(REVENUE_KEY, JSON.stringify(revenues));
  return newRevenue;
}

export function updateRevenue(id: string, updates: Partial<Revenue>): void {
  const revenues = getRevenue();
  const idx = revenues.findIndex(r => r.id === id);
  if (idx >= 0) {
    revenues[idx] = { ...revenues[idx], ...updates };
    localStorage.setItem(REVENUE_KEY, JSON.stringify(revenues));
  }
}

export function deleteRevenue(id: string): void {
  const revenues = getRevenue().filter(r => r.id !== id);
  localStorage.setItem(REVENUE_KEY, JSON.stringify(revenues));
}

export function getBurnConfig(): BurnRateConfig {
  if (typeof window === "undefined") {
    return { currentBalance: 0, targetRunwayMonths: 18, emergencyFundMonths: 6, currency: "USD" };
  }
  try {
    return JSON.parse(localStorage.getItem(BURN_CONFIG_KEY) || "{}") as BurnRateConfig;
  } catch {
    return { currentBalance: 0, targetRunwayMonths: 18, emergencyFundMonths: 6, currency: "USD" };
  }
}

export function updateBurnConfig(config: Partial<BurnRateConfig>): void {
  const current = getBurnConfig();
  localStorage.setItem(BURN_CONFIG_KEY, JSON.stringify({ ...current, ...config }));
}

// Calculate monthly amounts
export function calculateMonthlyBurn(): number {
  const expenses = getExpenses().filter(e => !e.endDate || new Date(e.endDate) > new Date());
  
  return expenses.reduce((total, e) => {
    let monthly = 0;
    switch (e.frequency) {
      case "monthly":
        monthly = e.amount;
        break;
      case "yearly":
        monthly = e.amount / 12;
        break;
      case "one-time":
        monthly = 0; // Don't count one-time in monthly burn
        break;
    }
    return total + monthly;
  }, 0);
}

export function calculateMonthlyRevenue(): { realistic: number; conservative: number; optimistic: number } {
  const revenues = getRevenue().filter(r => !r.endDate || new Date(r.endDate) > new Date());
  
  const realistic = revenues.reduce((total, r) => {
    let monthly = 0;
    switch (r.frequency) {
      case "monthly":
        monthly = r.amount * (r.confidence / 100);
        break;
      case "quarterly":
        monthly = (r.amount / 3) * (r.confidence / 100);
        break;
      case "one-time":
        monthly = 0;
        break;
    }
    return total + monthly;
  }, 0);
  
  const conservative = realistic * 0.7;
  const optimistic = realistic * 1.3;
  
  return { realistic, conservative, optimistic };
}

// Calculate runway
export function calculateRunway(): RunwayProjection {
  const config = getBurnConfig();
  const monthlyBurn = calculateMonthlyBurn();
  const { realistic, conservative, optimistic } = calculateMonthlyRevenue();
  
  const netBurnRealistic = monthlyBurn - realistic;
  const netBurnConservative = monthlyBurn - conservative;
  const netBurnOptimistic = monthlyBurn - optimistic;
  
  const calculateMonths = (netBurn: number) => {
    if (netBurn <= 0) return 999; // Profitable
    return Math.floor(config.currentBalance / netBurn);
  };
  
  const calculateZeroDate = (months: number) => {
    if (months >= 999) return "Profitable";
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  
  const realisticMonths = calculateMonths(netBurnRealistic);
  const conservativeMonths = calculateMonths(netBurnConservative);
  const optimisticMonths = calculateMonths(netBurnOptimistic);
  
  return {
    months: realisticMonths,
    zeroCashDate: calculateZeroDate(realisticMonths),
    monthlyBurn,
    monthlyRevenue: realistic,
    netBurn: netBurnRealistic,
    scenarios: {
      conservative: {
        months: conservativeMonths,
        zeroCashDate: calculateZeroDate(conservativeMonths),
      },
      realistic: {
        months: realisticMonths,
        zeroCashDate: calculateZeroDate(realisticMonths),
      },
      optimistic: {
        months: optimisticMonths,
        zeroCashDate: calculateZeroDate(optimisticMonths),
      },
    },
  };
}

// Generate cash flow projection
export function generateCashFlowProjection(months: number = 12): CashPosition[] {
  const config = getBurnConfig();
  const runway = calculateRunway();
  const projection: CashPosition[] = [];
  
  let balance = config.currentBalance;
  
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    balance -= runway.netBurn;
    
    projection.push({
      date: date.toISOString(),
      balance: Math.max(0, balance),
      projected: true,
    });
  }
  
  return projection;
}

// Get burn rate stats
export function getBurnStats() {
  const expenses = getExpenses();
  const revenues = getRevenue();
  const runway = calculateRunway();
  const config = getBurnConfig();
  
  return {
    totalExpenses: expenses.length,
    totalRevenueStreams: revenues.length,
    monthlyBurn: runway.monthlyBurn,
    monthlyRevenue: runway.monthlyRevenue,
    netBurn: runway.netBurn,
    runwayMonths: runway.months,
    isProfitable: runway.netBurn <= 0,
    essentialExpenses: expenses.filter(e => e.essential).reduce((sum, e) => sum + e.amount, 0),
    cuttableExpenses: expenses.filter(e => !e.essential).reduce((sum, e) => sum + e.amount, 0),
    targetRunway: config.targetRunwayMonths,
    emergencyFund: config.emergencyFundMonths,
  };
}


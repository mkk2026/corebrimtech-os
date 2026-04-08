"use client";

import { useState, useEffect } from "react";
import { Flame, Plus, Trash2, DollarSign, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getExpenses,
  getRevenue as getRevenues,
  getBurnConfig,
  calculateRunway,
  getBurnStats,
  addExpense,
  addRevenue,
  deleteExpense,
  deleteRevenue,
  updateBurnConfig,
  initializeSampleBurnData,
  type Expense,
  type Revenue,
} from "@/lib/burn-rate";

export default function BurnRateTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [config, setConfig] = useState(getBurnConfig());
  const [runway, setRunway] = useState(calculateRunway());
  const [stats, setStats] = useState(getBurnStats());
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [newExpense, setNewExpense] = useState({ name: "", amount: "", category: "other" as Expense["category"], essential: true });
  const [newRevenue, setNewRevenue] = useState({ name: "", amount: "", type: "recurring" as Revenue["type"], confidence: 80 });

  useEffect(() => {
    initializeSampleBurnData();
    refresh();
  }, []);

  function refresh() {
    setExpenses(getExpenses());
    setRevenues(getRevenues());
    setConfig(getBurnConfig());
    setRunway(calculateRunway());
    setStats(getBurnStats());
  }

  function handleAddExpense() {
    if (!newExpense.name || !newExpense.amount) return;
    addExpense({
      name: newExpense.name,
      amount: Number(newExpense.amount),
      frequency: "monthly",
      category: newExpense.category,
      essential: newExpense.essential,
      startDate: new Date().toISOString(),
    });
    refresh();
    setShowAddExpense(false);
    setNewExpense({ name: "", amount: "", category: "other", essential: true });
  }

  function handleAddRevenue() {
    if (!newRevenue.name || !newRevenue.amount) return;
    addRevenue({
      name: newRevenue.name,
      amount: Number(newRevenue.amount),
      frequency: "monthly",
      type: newRevenue.type,
      confidence: newRevenue.confidence,
      startDate: new Date().toISOString(),
    });
    refresh();
    setShowAddRevenue(false);
    setNewRevenue({ name: "", amount: "", type: "recurring", confidence: 80 });
  }

  const isProfitable = runway.netBurn <= 0;
  const runwayColor = runway.months < 3 ? "text-red-500" : runway.months < 6 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-neutral-100">Burn Rate Tracker</h2>
        <p className="text-sm text-neutral-500">Know exactly how much runway you have</p>
      </div>

      {/* Runway Card */}
      <Card className={`border-2 ${isProfitable ? "border-emerald-500/30" : runway.months < 3 ? "border-red-500/30" : "border-amber-500/30"}`}>
        <CardContent className="p-6 text-center">
          <div className={`text-5xl font-bold ${isProfitable ? "text-emerald-400" : runwayColor} mb-2`}>
            {isProfitable ? "∞" : runway.months}
          </div>
          <div className="text-sm text-neutral-400 mb-4">
            {isProfitable ? "Profitable!" : `months runway • Zero cash: ${runway.zeroCashDate}`}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-red-400 font-bold">${(runway.monthlyBurn / 1000).toFixed(1)}k</div>
              <div className="text-neutral-600">Monthly Burn</div>
            </div>
            <div>
              <div className="text-emerald-400 font-bold">${(runway.monthlyRevenue / 1000).toFixed(1)}k</div>
              <div className="text-neutral-600">Monthly Revenue</div>
            </div>
            <div>
              <div className={`font-bold ${runway.netBurn > 0 ? "text-red-400" : "text-emerald-400"}`}>
                ${(Math.abs(runway.netBurn) / 1000).toFixed(1)}k
              </div>
              <div className="text-neutral-600">{runway.netBurn > 0 ? "Net Burn" : "Net Profit"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-sm text-neutral-400">Runway Scenarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Conservative (70% revenue)</span>
            <span className="text-red-400">{runway.scenarios.conservative.months} months</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Realistic</span>
            <span className="text-amber-400">{runway.scenarios.realistic.months} months</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Optimistic (130% revenue)</span>
            <span className="text-emerald-400">{runway.scenarios.optimistic.months} months</span>
          </div>
        </CardContent>
      </Card>

      {/* Cash Balance */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Current Balance</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={config.currentBalance}
                onChange={e => { updateBurnConfig({ currentBalance: Number(e.target.value) }); refresh(); }}
                className="w-32 bg-neutral-950 border-neutral-800 text-right"
              />
              <span className="text-neutral-500">USD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-neutral-400">Monthly Expenses</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowAddExpense(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {showAddExpense && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Expense name"
                value={newExpense.name}
                onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
                className="bg-neutral-950 border-neutral-800 flex-1"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="bg-neutral-950 border-neutral-800 w-24"
              />
              <Button size="sm" onClick={handleAddExpense}>Add</Button>
            </div>
          )}
          <div className="space-y-2">
            {expenses.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-2 bg-neutral-950 rounded">
                <div className="flex items-center gap-2">
                  {expense.essential ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-neutral-600" />}
                  <span className="text-sm text-neutral-300">{expense.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">${expense.amount.toLocaleString()}</span>
                  <button onClick={() => { deleteExpense(expense.id); refresh(); }} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between text-sm">
            <span className="text-neutral-500">Total</span>
            <span className="text-red-400 font-bold">${stats.monthlyBurn.toLocaleString()}/mo</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-neutral-400">Monthly Revenue</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowAddRevenue(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {showAddRevenue && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Revenue source"
                value={newRevenue.name}
                onChange={e => setNewRevenue({ ...newRevenue, name: e.target.value })}
                className="bg-neutral-950 border-neutral-800 flex-1"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newRevenue.amount}
                onChange={e => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                className="bg-neutral-950 border-neutral-800 w-24"
              />
              <Button size="sm" onClick={handleAddRevenue}>Add</Button>
            </div>
          )}
          <div className="space-y-2">
            {revenues.map(revenue => (
              <div key={revenue.id} className="flex items-center justify-between p-2 bg-neutral-950 rounded">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-neutral-300">{revenue.name}</span>
                  <span className="text-xs text-neutral-600">({revenue.confidence}% confidence)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">${revenue.amount.toLocaleString()}</span>
                  <button onClick={() => { deleteRevenue(revenue.id); refresh(); }} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between text-sm">
            <span className="text-neutral-500">Total</span>
            <span className="text-emerald-400 font-bold">${stats.monthlyRevenue.toLocaleString()}/mo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

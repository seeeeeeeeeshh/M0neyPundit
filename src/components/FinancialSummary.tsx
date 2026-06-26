"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingDown, TrendingUp, ArrowRight, PiggyBank } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getBudget,
  getTotalExpenses,
  getRemainingBudget,
  getExpensesByCategory,
  getCategoryInfo,
  type ExpenseCategory,
} from "@/lib/finances";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food & Drinks" },
  { value: "transport", label: "Transport" },
  { value: "study", label: "Study Materials" },
  { value: "entertainment", label: "Entertainment" },
  { value: "personal", label: "Personal Care" },
  { value: "other", label: "Other" },
];

export default function FinancialSummary() {
  const [monthlyBudget, setMonthlyBudget] = useState(400);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remaining, setRemaining] = useState(400);

  useEffect(() => {
    const budget = getBudget();
    setMonthlyBudget(budget.monthlyBudget);
    setTotalExpenses(getTotalExpenses());
    setRemaining(getRemainingBudget());
  }, []);

  const budgetUsed = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const dailyAllowance = remaining > 0 ? remaining / 30 : 0;
  const categoryData = getExpensesByCategory();
  const topCategory = Object.entries(categoryData).reduce((max, [cat, amount]) => {
    const a = amount as number;
    return a > (max.amount as number) ? { category: cat, amount: a } : max;
  }, { category: "", amount: 0 });

  // Prepare pie chart data
  const pieData = Object.entries(categoryData)
    .filter(([, v]) => (v as number) > 0)
    .map(([category, amount]) => ({
      name: CATEGORIES.find((c) => c.value === category)?.label || category,
      value: Math.round((amount as number) * 100) / 100,
      category,
    }));

  const PIE_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#6B7280'];

  return (
    <Link href="/finances" className="block cursor-pointer">
      <div className="card p-6 hover:border-primary/50 transition-all duration-200 group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-primary" />
            Financial Summary
          </h3>
          <span className="text-xs text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
            View Details <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dark p-3 rounded-lg border border-gray-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-gray-500">Budget</span>
            </div>
            <p className="text-sm font-bold text-white">${monthlyBudget.toFixed(0)}</p>
          </div>
          <div className="bg-dark p-3 rounded-lg border border-gray-800">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-gray-500">Spent</span>
            </div>
            <p className="text-sm font-bold text-red-400">${totalExpenses.toFixed(0)}</p>
          </div>
          <div className="bg-dark p-3 rounded-lg border border-gray-800">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-gray-500">Left</span>
            </div>
            <p className={`text-sm font-bold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${remaining.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Budget Used</span>
            <span>{budgetUsed.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsed > 100
                  ? "bg-red-500"
                  : budgetUsed > 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Spending by Category Pie Chart */}
        {pieData.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Spending by Category</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: "8px" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                  itemStyle={{ color: "#9ca3af", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-2">
              {pieData.map((entry, index) => {
                const info = getCategoryInfo(entry.category as ExpenseCategory);
                return (
                  <div key={entry.category} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-400">{info.icon}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Spending Category */}
        {topCategory.category && (
          <div className="mb-4 p-3 bg-dark rounded-lg border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Top Spending</span>
              <span className="text-xs text-gray-400">
                {CATEGORIES.find((c) => c.value === topCategory.category)?.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">
                {getCategoryInfo(topCategory.category as ExpenseCategory).icon}
              </span>
              <p className="text-sm font-semibold text-white">
                ${(topCategory.amount as number).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-dark rounded-lg border border-gray-800 text-center">
            <p className="text-xs text-gray-500">Daily Allowance</p>
            <p className="text-sm font-bold text-primary">${dailyAllowance.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-dark rounded-lg border border-gray-800 text-center">
            <p className="text-xs text-gray-500">Total Transactions</p>
            <p className="text-sm font-bold text-white">{pieData.length}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
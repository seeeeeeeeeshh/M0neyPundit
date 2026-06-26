"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  getBudget,
  saveBudget,
  addExpense,
  updateExpense,
  deleteExpense,
  getTotalExpenses,
  getRemainingBudget,
  getExpensesByCategory,
  getLast7DaysData,
  getLast4WeeksData,
  loadSampleData,
  type Expense,
  type ExpenseCategory,
  getCategoryInfo,
} from "@/lib/finances";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food & Drinks" },
  { value: "transport", label: "Transport" },
  { value: "study", label: "Study Materials" },
  { value: "entertainment", label: "Entertainment" },
  { value: "personal", label: "Personal Care" },
  { value: "other", label: "Other" },
];

export default function FinancesPage() {
  const [budget, setBudget] = useState(getBudget());
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [budgetValue, setBudgetValue] = useState(budget.monthlyBudget.toString());
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("food");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseNotes, setExpenseNotes] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load sample data if empty
    const stored = localStorage.getItem("m0ney_pundit_budget");
    if (!stored) {
      loadSampleData();
      setBudget(getBudget());
    }
    setLoading(false);
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshBudget = () => {
    setBudget(getBudget());
  };

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetValue);
    if (isNaN(amount) || amount <= 0) {
      showNotification("error", "Please enter a valid budget amount");
      return;
    }
    saveBudget({ ...budget, monthlyBudget: amount });
    refreshBudget();
    setShowBudgetEdit(false);
    showNotification("success", `Monthly budget updated to $${amount.toFixed(2)}`);
  };

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(amount) || amount <= 0) {
      showNotification("error", "Please fill in name and valid amount");
      return;
    }
    addExpense({
      name: expenseName,
      amount,
      category: expenseCategory,
      date: expenseDate,
      notes: expenseNotes,
    });
    resetExpenseForm();
    refreshBudget();
    showNotification("success", `Expense "${expenseName}" added`);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;
    const amount = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(amount) || amount <= 0) {
      showNotification("error", "Please fill in name and valid amount");
      return;
    }
    updateExpense(editingExpense.id, {
      name: expenseName,
      amount,
      category: expenseCategory,
      date: expenseDate,
      notes: expenseNotes,
    });
    resetExpenseForm();
    refreshBudget();
    showNotification("success", `Expense "${expenseName}" updated`);
  };

  const handleDeleteExpense = (id: string, name: string) => {
    deleteExpense(id);
    refreshBudget();
    showNotification("success", `Expense "${name}" deleted`);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseName(expense.name);
    setExpenseAmount(expense.amount.toString());
    setExpenseCategory(expense.category);
    setExpenseDate(expense.date);
    setExpenseNotes(expense.notes || "");
    setShowExpenseForm(true);
  };

  const resetExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    setExpenseName("");
    setExpenseAmount("");
    setExpenseCategory("food");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseNotes("");
  };

  const totalExpenses = getTotalExpenses();
  const remaining = getRemainingBudget();
  const budgetUsed = budget.monthlyBudget > 0 ? (totalExpenses / budget.monthlyBudget) * 100 : 0;
  const categoryData = getExpensesByCategory();
  const pieData = Object.entries(categoryData)
    .filter(([, v]) => v > 0)
    .map(([category, amount]) => ({
      name: CATEGORIES.find(c => c.value === category)?.label || category,
      value: Math.round(amount * 100) / 100,
      category,
    }));
  const last7Days = getLast7DaysData();
  const last4Weeks = getLast4WeeksData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">💰 Finances</h1>
        <p className="text-gray-400">Track your budget, expenses, and spending patterns</p>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Monthly Budget */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Monthly Budget</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          {showBudgetEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className="input flex-1"
                placeholder="Enter budget"
              />
              <button onClick={handleSaveBudget} className="btn btn-primary px-3">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setShowBudgetEdit(false)} className="btn btn-secondary px-3">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-white">${budget.monthlyBudget.toFixed(2)}</p>
              <button
                onClick={() => setShowBudgetEdit(true)}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </button>
            </>
          )}
        </div>

        {/* Total Expenses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">${totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{budgetUsed.toFixed(1)}% of budget used</p>
        </div>

        {/* Remaining */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Remaining</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className={`text-2xl font-bold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>
            ${remaining.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {remaining >= 0 ? "✅ On track" : "⚠️ Over budget!"}
          </p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Budget Usage</h3>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetUsed > 100
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : budgetUsed > 75
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-green-500 to-emerald-500"
            }`}
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-400">
          <span>$0</span>
          <span>${totalExpenses.toFixed(2)} spent</span>
          <span>${budget.monthlyBudget.toFixed(2)}</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending by Category */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Spending by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCategoryInfo(entry.category as ExpenseCategory).color}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: "8px" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No expenses yet. Add your first expense below!
            </div>
          )}
        </div>

        {/* Daily Spending (Last 7 Days) */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Spending (Last 7 Days)</h3>
          {last7Days.some((d) => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: "8px" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                />
                <Bar dataKey="amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No spending data for the last 7 days.
            </div>
          )}
        </div>

        {/* Weekly Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Trend (4 Weeks)</h3>
          {last4Weeks.some((d) => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={last4Weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: "8px" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No weekly spending data available.
            </div>
          )}
        </div>

        {/* Category Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const info = getCategoryInfo(cat.value);
              const amount = categoryData[cat.value] || 0;
              if (amount === 0) return null;
              const percentage = budget.monthlyBudget > 0 ? (amount / budget.monthlyBudget) * 100 : 0;
              return (
                <div key={cat.value} className="flex items-center gap-3">
                  <span className="text-xl">{info.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white">{cat.label}</span>
                      <span className="text-sm font-semibold text-white">${amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: info.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
            {Object.values(categoryData).every((v) => v === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No expenses recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Recent Expenses</h3>
        <button
          onClick={() => {
            resetExpenseForm();
            setShowExpenseForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Add/Edit Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </h3>
              <button onClick={resetExpenseForm} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Expense Name *</label>
                <input
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., Chicken Rice, Bus Fare"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="input w-full"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="input w-full"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {"📦"} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
                <textarea
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="input w-full resize-none"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                {editingExpense && (
                  <button
                    onClick={() => {
                      handleUpdateExpense();
                    }}
                    className="btn btn-primary flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Update
                  </button>
                )}
                {!editingExpense && (
                  <button
                    onClick={handleAddExpense}
                    className="btn btn-primary flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </button>
                )}
                <button onClick={resetExpenseForm} className="btn btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="card overflow-hidden">
        {budget.expenses.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {[...budget.expenses]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => {
                const info = getCategoryInfo(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${info.color}20` }}
                    >
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{expense.name}</p>
                      <p className="text-xs text-gray-500">
                        {CATEGORIES.find((c) => c.value === expense.category)?.label} •{" "}
                        {new Date(expense.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-white font-semibold">${expense.amount.toFixed(2)}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditExpense(expense)}
                        className="p-2 text-gray-500 hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id, expense.name)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No expenses yet. Start tracking your spending!</p>
            <button
              onClick={() => {
                resetExpenseForm();
                setShowExpenseForm(true);
              }}
              className="btn btn-primary mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
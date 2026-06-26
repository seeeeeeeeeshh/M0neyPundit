"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Wallet, TrendingDown, Sparkles } from "lucide-react";
import { getBudget, getTotalExpenses, getRemainingBudget } from "@/lib/finances";

export default function StatsGrid() {
  const [monthlyBudget, setMonthlyBudget] = useState(400);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [remaining, setRemaining] = useState(400);
  const [daysLeft, setDaysLeft] = useState(30);

  useEffect(() => {
    const budget = getBudget();
    setMonthlyBudget(budget.monthlyBudget);
    setTotalExpenses(getTotalExpenses());
    setRemaining(getRemainingBudget());
    
    // Calculate days left in current month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDaysLeft(endOfMonth.getDate() - now.getDate());
  }, []);

  const dailyAllowance = daysLeft > 0 ? remaining / daysLeft : 0;
  const budgetPercentage = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  const stats = [
    {
      label: "Remaining Budget",
      value: `$${remaining.toFixed(0)}`,
      subtitle: `${daysLeft} days left`,
      icon: Wallet,
      color: "from-primary to-blue-500",
      bgColor: "bg-primary/10",
    },
    {
      label: "Daily Allowance",
      value: `$${dailyAllowance.toFixed(2)}`,
      subtitle: "per day",
      icon: DollarSign,
      color: "from-secondary to-cyan-500",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Monthly Spending",
      value: `$${totalExpenses.toFixed(0)}`,
      subtitle: `of $${monthlyBudget} budget`,
      icon: TrendingDown,
      color: "from-accent to-pink-500",
      bgColor: "bg-accent/10",
    },
    {
      label: "AI Insights",
      value: "Analyze",
      subtitle: "finance tips",
      icon: Sparkles,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-500/10",
      clickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isClickable = (stat as any).clickable;
        const statCard = (
          <div key={index} className="card group hover:scale-105 transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-400 text-xs sm:text-sm mb-1">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-gray-500 text-xs mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        );

        if (isClickable) {
          return (
            <Link
              key={index}
              href="/chat?prompt=Analyze+my+finances+and+give+me+tips+to+optimize+my+budget"
              className="block"
            >
              {statCard}
            </Link>
          );
        }

        return statCard;
      })}
    </div>
  );
}
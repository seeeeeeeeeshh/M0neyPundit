"use client";

import { spendingData } from "@/lib/seed-data";
import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: "text-red-400",
  down: "text-green-400",
  stable: "text-gray-400",
};

export default function FinancialOverview() {
  const totalSpent = spendingData.reduce((sum, cat) => sum + cat.amount, 0);
  const totalLimit = spendingData.reduce((sum, cat) => sum + cat.limit, 0);
  const percentage = Math.round((totalSpent / totalLimit) * 100);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Financial Overview
          </h2>
          <p className="text-gray-400 text-sm mt-1">Track your spending habits</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            ${totalSpent}<span className="text-gray-500 text-lg">/${totalLimit}</span>
          </p>
          <p className="text-sm text-gray-400">Monthly Budget</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Budget Used</span>
          <span
            className={`font-medium ${
              percentage > 90
                ? "text-red-400"
                : percentage > 70
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentage > 90
                ? "bg-gradient-to-r from-red-500 to-red-400"
                : percentage > 70
                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                : "bg-gradient-to-r from-green-500 to-green-400"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        {spendingData.map((category, index) => {
          const TrendIcon = trendIcons[category.trend];
          const trendColor = trendColors[category.trend];
          const isOverBudget = category.percentage > 100;
          const isNearLimit = category.percentage > 75;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-dark/50 hover:bg-dark/80 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{category.category}</span>
                  {isOverBudget && <span className="badge badge-danger">Over Budget</span>}
                  {isNearLimit && !isOverBudget && (
                    <span className="badge badge-warning">Near Limit</span>
                  )}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isOverBudget
                        ? "bg-red-500"
                        : isNearLimit
                        ? "bg-yellow-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 text-right flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  ${category.amount}
                  <span className="text-gray-600">/${category.limit}</span>
                </span>
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
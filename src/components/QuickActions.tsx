"use client";

import Link from "next/link";
import { MessageSquare, Tag, Store, Briefcase, Shield } from "lucide-react";

const actions = [
  {
    title: "Ask AI Assistant",
    description: "Get personalized survival advice",
    icon: MessageSquare,
    href: "/chat",
    gradient: "from-primary to-blue-500",
    prompt: "I'm broke, help me survive this week",
  },
  {
    title: "Find Deals",
    description: "Discover student discounts nearby",
    icon: Tag,
    href: "/deals",
    gradient: "from-secondary to-cyan-500",
    prompt: "",
  },
  {
    title: "Browse Marketplace",
    description: "Buy, sell, borrow campus items",
    icon: Store,
    href: "/marketplace",
    gradient: "from-purple-500 to-violet-500",
    prompt: "",
  },
  {
    title: "Side Hustles",
    description: "Find earning opportunities",
    icon: Briefcase,
    href: "/hustles",
    gradient: "from-accent to-pink-500",
    prompt: "",
  },
];

export default function QuickActions() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <p className="text-gray-400 text-sm mt-1">Jump to what you need</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className="group relative overflow-hidden rounded-xl p-4 bg-dark hover:bg-dark/80 border border-gray-800 hover:border-gray-700 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className="flex items-start gap-3 relative">
                <div className={`p-2.5 rounded-lg bg-gradient-to-r ${action.gradient} bg-opacity-10`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">{action.description}</p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Prompt */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <p className="text-sm text-gray-300 mb-2">💡 Try asking:</p>
        <button
          onClick={() => (window.location.href = "/chat")}
          className="text-sm text-primary hover:text-secondary transition-colors italic"
        >
          "{actions[0].prompt}"
        </button>
      </div>
    </div>
  );
}
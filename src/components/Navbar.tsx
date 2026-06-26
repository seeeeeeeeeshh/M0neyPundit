"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, TrendingUp, Store, Tag, Briefcase, Home, Wallet } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/finances", label: "Finances", icon: Wallet },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/hustles", label: "Hustles", icon: Briefcase },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">💰</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">
              M0ney<span className="text-primary">Pundit</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
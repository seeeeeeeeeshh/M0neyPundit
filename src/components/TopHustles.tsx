"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Briefcase, DollarSign, Clock, TrendingUp } from "lucide-react";

interface Hustle {
  id: number;
  title: string;
  description: string;
  type: string;
  hourlyRate: number;
  location: string;
  payRate?: string;
  isFeatured?: boolean;
}

export default function TopHustles() {
  const [hustles, setHustles] = useState<Hustle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHustles() {
      try {
        const res = await fetch('/api/hustles?limit=3&sortBy=pay_rate');
        const data = await res.json();
        if (data.success) {
          setHustles(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch hustles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHustles();
  }, []);

  const topHustles = loading ? [] : [...hustles].sort((a, b) => b.hourlyRate - a.hourlyRate).slice(0, 3);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-accent" />
          <h2 className="font-bold">Top Earning Opportunities</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-lg bg-dark animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-accent" />
          <h2 className="font-bold">Top Earning Opportunities</h2>
        </div>
        <Link href="/hustles" className="text-xs text-primary hover:text-secondary transition-colors">
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {topHustles.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hustles available yet.</p>
            <p className="text-xs mt-1">Sync from @sgfreelancing to get started.</p>
          </div>
        ) : (
          topHustles.map((hustle, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-dark hover:bg-dark/80 transition-colors border border-gray-800 hover:border-accent/30 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">#{index + 1}</span>
                    <h3 className="text-sm font-medium group-hover:text-accent transition-colors">
                      {hustle.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{hustle.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="badge badge-success flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {hustle.payRate || `$${hustle.hourlyRate}/hr`}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hustle.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
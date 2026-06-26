"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deals as seedDeals } from "@/lib/seed-data";
import { Tag, Flame } from "lucide-react";

interface Deal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  category: string;
  location?: string;
  isPopular?: boolean;
  is_popular?: boolean;
  merchant?: string;
  imageUrl?: string;
}

export default function RecentDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      try {
        // Fetch without category filter to show ALL deals (including Telegram-synced ones)
        const res = await fetch('/api/deals?limit=5&sort=-created_at');
        if (res.ok) {
          const data = await res.json();
          if (data.deals && data.deals.length > 0) {
            // Normalize: handle both snake_case (Supabase) and camelCase formats
            const normalized = data.deals.map((d: any) => ({
              _id: String(d.id || d._id || d.telegram_id),
              title: d.title || 'Untitled Deal',
              description: d.description || '',
              discount: d.discount || 'Deal',
              category: d.category || 'other',
              location: d.location || d.merchant,
              isPopular: d.is_popular ?? d.isPopular ?? false,
            }));
            setDeals(normalized);
            return;
          }
        }
        // Fallback to seed data
        setDeals(seedDeals.filter(d => d.isPopular).slice(0, 3).map(d => ({
          _id: d.id,
          title: d.title,
          description: d.description,
          discount: d.discount,
          category: d.category,
          isPopular: d.isPopular,
        })));
      } catch (err) {
        // Use seed data as fallback
        setDeals(seedDeals.filter(d => d.isPopular).slice(0, 3).map(d => ({
          _id: d.id,
          title: d.title,
          description: d.description,
          discount: d.discount,
          category: d.category,
          isPopular: d.isPopular,
        })));
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-secondary" />
          <h2 className="font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-secondary" />
          <h2 className="font-bold">Hot Deals</h2>
        </div>
        <Link href="/deals" className="text-xs text-primary hover:text-secondary transition-colors">
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {deals.map((deal, index) => (
          <div
            key={deal._id || index}
            className="p-3 rounded-lg bg-dark hover:bg-dark/80 transition-colors border border-gray-800 hover:border-gray-700"
          >
            <div className="flex items-start gap-2">
              {deal.isPopular && <Flame className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{deal.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{deal.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge badge-success">{deal.discount}</span>
                  {deal.location && (
                    <span className="text-xs text-gray-500">{deal.location}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
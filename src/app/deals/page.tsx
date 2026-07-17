"use client";

import { useState, useEffect, useCallback } from "react";
import { deals as seedDeals } from "@/lib/seed-data";
import { Tag, Flame, Search, MapPin, Calendar, RefreshCw } from "lucide-react";
import { cleanDescription } from "@/lib/text-utils";

type DealCategory = "all" | "food" | "tech" | "events" | "transport";

interface ApiDeal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  category: string;
  location?: string;
  isPopular: boolean;
  merchant?: string;
  imageUrl?: string;
  expiryDate?: string;
  telegramId?: string;
}

interface SeedDeal {
  id: number;
  title: string;
  description: string;
  discount: string;
  category: string;
  location: string;
  isPopular: boolean;
  expiryDate: string;
}

const categoryIcons: Record<DealCategory, string> = {
  all: "🎯",
  food: "🍜",
  tech: "💻",
  events: "🎉",
  transport: "🚌",
};

const categoryLabels: Record<DealCategory, string> = {
  all: "All Deals",
  food: "Food & Drinks",
  tech: "Tech & Printing",
  events: "Events",
  transport: "Transport",
};

// Strip markdown/formatting characters from text (legacy)
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^\*+|^__+|^\^+|^[!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~]+/g, '')
    .replace(/\*+$|__+$|\^+$|[!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~]+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/__/, '')
    .trim();
}

export default function DealsPage() {
  const [selectedCategory, setSelectedCategory] = useState<DealCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiDeals, setApiDeals] = useState<ApiDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20; // Reduced from 50 for faster initial load

  // Fetch deals from API with timeout
  const fetchDeals = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const skip = (pageNum - 1) * PAGE_SIZE;
      const res = await fetch(
        `/api/deals?limit=${PAGE_SIZE}&skip=${skip}${selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.deals && data.deals.length > 0) {
          const normalized = data.deals.map((d: any) => ({
            _id: String(d.id || d._id || d.telegram_id),
            title: cleanText(d.title || 'Untitled Deal'),
            // Clean description by removing title duplication and arrow chains
            description: cleanDescription(d.description || '', d.title || 'Untitled Deal'),
            discount: d.discount || 'Deal',
            category: d.category || 'other',
            location: d.location || d.merchant,
            isPopular: d.is_popular ?? d.isPopular ?? false,
            merchant: d.merchant,
            imageUrl: d.image_url || d.imageUrl,
            expiryDate: d.expiry_date || d.expiryDate,
            telegramId: d.telegram_id,
          }));
          if (append) {
            setApiDeals(prev => [...prev, ...normalized]);
          } else {
            setApiDeals(normalized);
          }
          setTotalCount(data.pagination?.total || normalized.length);
          setHasMore(data.pagination?.hasMore || false);
          return;
        }
      }
    } catch (err) {
      console.log('Using fallback deal data:', err);
    }
    setLoading(false);
  }, [selectedCategory, PAGE_SIZE]);

  useEffect(() => {
    setPage(1);
    setApiDeals([]);
    fetchDeals(1);
  }, [fetchDeals]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDeals(nextPage, true);
  };

  // Filter deals based on search
  const filteredDeals = apiDeals.length > 0
    ? apiDeals.filter((deal) => {
        const matchesSearch =
          !searchQuery ||
          deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (deal.merchant && deal.merchant.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
    : (seedDeals as unknown as SeedDeal[]).filter((deal) => {
        const matchesCategory = selectedCategory === "all" || deal.category === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          deal.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

  const popularDeals = filteredDeals.filter((d: any) => d.isPopular);
  const regularDeals = filteredDeals.filter((d: any) => !d.isPopular);

  // Trigger manual sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/deals/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage('Sync completed successfully!');
        // Refresh deals
        await new Promise(r => setTimeout(r, 500));
        setPage(1);
        fetchDeals(1);
      } else {
        setSyncMessage(`Sync failed: ${data.error}`);
      }
    } catch (err) {
      setSyncMessage('Sync failed: Could not connect to Telegram service');
    }
    setSyncing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Student <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Deals</span>
          </h1>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-outline btn-sm gap-1"
            title="Sync from Telegram"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-gray-400">Find the best discounts and promotions on campus</p>
        {syncMessage && (
          <p className={`text-sm mt-2 ${syncMessage.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
            {syncMessage}
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search deals, merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {(Object.keys(categoryLabels) as DealCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`btn flex items-center gap-2 px-4 py-2 text-sm ${
              selectedCategory === category
                ? "btn-primary"
                : "bg-dark border border-gray-800 text-gray-400 hover:border-gray-700"
            }`}
          >
            <span>{categoryIcons[category]}</span>
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500 mb-4">
        {totalCount > 0 ? `${totalCount} total` : filteredDeals.length} deal{totalCount > 0 || filteredDeals.length !== 1 ? "s" : ""} shown
        {selectedCategory !== "all" && ` in ${categoryLabels[selectedCategory]}`}
        {apiDeals.length > 0 && " (from Telegram)"}
      </p>

      {/* Popular Deals */}
      {popularDeals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-accent" />
            🔥 Popular Deals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularDeals.map((deal: any, i: number) => (
              <DealCard key={deal._id || deal.id || i} deal={deal} isPopular />
            ))}
          </div>
        </div>
      )}

      {/* All Deals */}
      <div>
        <h2 className="text-lg font-bold mb-4">
          All Deals <span className="text-gray-500 text-sm">({regularDeals.length})</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularDeals.map((deal: any, i: number) => (
            <DealCard key={deal._id || deal.id || i} deal={deal} />
          ))}
        </div>
      </div>

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="btn btn-primary"
          >
            Load More Deals
          </button>
        </div>
      )}

      {/* Loading State for Load More */}
      {loading && page > 1 && (
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading more deals...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDeals.length === 0 && !loading && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No deals found. Try a different category or search term.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-primary mt-4"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync from Telegram
          </button>
        </div>
      )}

      {/* Initial Loading State */}
      {loading && page === 1 && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading deals...</p>
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, isPopular }: { deal: any; isPopular?: boolean }) {
  const categoryEmojis: Record<string, string> = {
    food: "🍜",
    tech: "💻",
    events: "🎉",
    transport: "🚌",
  };

  return (
    <div
      className={`card group hover:scale-105 transition-all duration-300 ${
        isPopular ? "border-primary/30 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{categoryEmojis[deal.category] || "🎯"}</span>
        {isPopular && (
          <span className="badge badge-danger flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Hot
          </span>
        )}
      </div>

      <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
        {deal.title}
      </h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
        {deal.description ? deal.description : 'Check out this deal!'}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="badge badge-success">{deal.discount}</span>
        {deal.location && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {deal.location}
          </span>
        )}
        {deal.merchant && (
          <span className="text-xs text-gray-500">
            {deal.merchant}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {deal.expiryDate || 'No expiry'}
        </span>
      </div>
    </div>
  );
}
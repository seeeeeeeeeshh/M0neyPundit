"use client";

import { useState } from "react";
import { marketplaceItems } from "@/lib/seed-data";
import { Store, Search, Filter, Package, ArrowLeftRight, DollarSign, Tag } from "lucide-react";

type ItemType = "all" | "sell" | "buy" | "borrow" | "rent";

const typeConfig: Record<ItemType, { label: string; emoji: string; color: string }> = {
  all: { label: "All Items", emoji: "🎯", color: "bg-gray-500" },
  sell: { label: "For Sale", emoji: "💰", color: "bg-green-500" },
  buy: { label: "Wanted", emoji: "🙋", color: "bg-blue-500" },
  borrow: { label: "Borrow", emoji: "🔄", color: "bg-yellow-500" },
  rent: { label: "For Rent", emoji: "📦", color: "bg-purple-500" },
};

export default function MarketplacePage() {
  const [selectedType, setSelectedType] = useState<ItemType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = marketplaceItems.filter((item) => {
    const matchesType = selectedType === "all" || item.type === selectedType;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Campus <span className="bg-gradient-to-r from-purple-500 to-primary bg-clip-text text-transparent">Marketplace</span>
        </h1>
        <p className="text-gray-400">Buy, sell, borrow, and rent campus essentials</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {(Object.keys(typeConfig) as ItemType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`btn flex items-center gap-2 px-4 py-2 text-sm ${
              selectedType === type
                ? "btn-primary"
                : "bg-dark border border-gray-800 text-gray-400 hover:border-gray-700"
            }`}
          >
            <span>{typeConfig[type].emoji}</span>
            {typeConfig[type].label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500 mb-4">
        Showing {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
      </p>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <MarketplaceCard key={item.id} item={item} />
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No items found. Try a different filter or search term.</p>
        </div>
      )}
    </div>
  );
}

function MarketplaceCard({ item }: { item: any }) {
  const typeBadgeColors: Record<string, string> = {
    sell: "bg-green-500/20 text-green-400",
    buy: "bg-blue-500/20 text-blue-400",
    borrow: "bg-yellow-500/20 text-yellow-400",
    rent: "bg-purple-500/20 text-purple-400",
  };

  const typeLabels: Record<string, string> = {
    sell: "For Sale",
    buy: "Wanted",
    borrow: "Borrow",
    rent: "Rent",
  };

  return (
    <div className="card group hover:scale-105 transition-all duration-300">
      {/* Item Image/Emoji */}
      <div className="text-4xl text-center mb-3 p-4 bg-dark rounded-lg group-hover:bg-dark/80 transition-colors">
        {item.image}
      </div>

      {/* Type Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`badge ${typeBadgeColors[item.type]}`}>
          {typeLabels[item.type]}
        </span>
        <span className="text-xs text-gray-500">{item.condition}</span>
      </div>

      <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
        {item.title}
      </h3>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{item.description}</p>

      {/* Price */}
      <div className="flex items-center gap-2 mb-3">
        {item.price === 0 ? (
          <span className="badge badge-success">FREE</span>
        ) : (
          <span className="badge badge-success flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {item.type === "rent" ? `/$${item.price}/wk` : `$${item.price}`}
          </span>
        )}
        <span className="text-xs text-gray-500">{item.category}</span>
      </div>

      {/* Details */}
      <div className="pt-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Store className="w-3 h-3" />
            {item.location}
          </span>
          <span>Seller: {item.seller}</span>
        </div>
      </div>
    </div>
  );
}
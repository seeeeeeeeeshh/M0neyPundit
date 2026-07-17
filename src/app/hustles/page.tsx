"use client";

import { useState, useEffect } from "react";
import { Search, DollarSign, Clock, MapPin, Star, Zap, Mail } from "lucide-react";
import { cleanDescription } from "@/lib/text-utils";

interface Hustle {
  id: number;
  title: string;
  description: string;
  type: string;
  hourlyRate: number;
  location: string;
  payRate?: string;
  isFeatured?: boolean;
  url?: string;
  contact?: string;
  deadline?: string;
  category?: string;
}

type HustleType = "all" | "part-time" | "freelance" | "tutoring" | "gig" | "full-time" | "internship" | "remote";

const typeConfig: Record<HustleType, { label: string; emoji: string }> = {
  all: { label: "All Opportunities", emoji: "🎯" },
  "part-time": { label: "Part-Time", emoji: "💼" },
  freelance: { label: "Freelance", emoji: "🎨" },
  tutoring: { label: "Tutoring", emoji: "📚" },
  gig: { label: "Gig Work", emoji: "⚡" },
  "full-time": { label: "Full-Time", emoji: "🏢" },
  internship: { label: "Internship", emoji: "🎓" },
  remote: { label: "Remote", emoji: "🏠" },
};

export default function HustlesPage() {
  const [hustles, setHustles] = useState<Hustle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<HustleType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  // Extract numeric value from pay rate string
  const extractPayNumber = (payRate: string | undefined): number => {
    if (!payRate) return 0;
    const numbers = payRate.match(/\d+/g);
    if (!numbers || numbers.length === 0) return 0;
    return Math.max(...numbers.map(n => parseInt(n)));
  };

  // Fuzzy search - checks if search terms appear in title or description
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query.trim()) return true;
    const lowerText = text.toLowerCase();
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    return terms.every(term => lowerText.includes(term));
  };

  const fetchHustles = async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const offset = (pageNum - 1) * PAGE_SIZE;
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      
      const res = await fetch(`/api/hustles?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        // Clean description by removing title duplication and arrow chains
        const cleaned = data.data.map((h: any) => ({
          ...h,
          title: h.title || '',
          description: cleanDescription(h.description || '', h.title || ''),
        }));
        if (append) {
          setHustles(prev => [...prev, ...cleaned]);
        } else {
          setHustles(cleaned);
        }
        setTotalCount(data.total || cleaned.length);
        setHasMore(data.hasMore || false);
      }
    } catch (err) {
      console.error('Failed to fetch hustles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHustles(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHustles(nextPage, true);
  };

  const filteredHustles = hustles.filter((hustle) => {
    const matchesType = selectedType === "all" || hustle.type === selectedType;
    const matchesSearch = fuzzyMatch(hustle.title, searchQuery) || fuzzyMatch(hustle.description, searchQuery);
    const payAmount = extractPayNumber(hustle.payRate) || hustle.hourlyRate;
    const minSalary = salaryMin ? parseFloat(salaryMin) : 0;
    const maxSalary = salaryMax ? parseFloat(salaryMax) : Infinity;
    const matchesSalary = payAmount >= minSalary && payAmount <= maxSalary;
    return matchesType && matchesSearch && matchesSalary;
  });

  const sortedHustles = [...filteredHustles].sort((a, b) => b.hourlyRate - a.hourlyRate);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Side <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Hustles</span>
        </h1>
        <p className="text-gray-400">Find earning opportunities that match your skills</p>
      </div>

      {/* Search Bar + Salary Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <input
              type="number"
              placeholder="Min salary"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="input input-sm w-32"
            />
          </div>
          <span className="text-gray-500">–</span>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <input
              type="number"
              placeholder="Max salary"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="input input-sm w-32"
            />
          </div>
          {(salaryMin || salaryMax) && (
            <button
              onClick={() => { setSalaryMin(""); setSalaryMax(""); }}
              className="btn btn-ghost btn-xs text-gray-500"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {(Object.keys(typeConfig) as HustleType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`btn flex items-center gap-2 px-4 py-2 text-sm ${
              selectedType === type
                ? "btn-accent"
                : "bg-dark border border-gray-800 text-gray-400 hover:border-gray-700"
            }`}
          >
            <span>{typeConfig[type].emoji}</span>
            {typeConfig[type].label}
          </button>
        ))}
      </div>

      {/* Highest Paying Banner */}
      {!loading && selectedType === "all" && !searchQuery && !salaryMin && !salaryMax && sortedHustles.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm">Highest Paying Opportunity</h3>
          </div>
          <p className="text-sm text-gray-300">
            {sortedHustles[0].title} pays up to {sortedHustles[0].payRate || `$${sortedHustles[0].hourlyRate}/hr`}
          </p>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-gray-500 mb-4">
        {totalCount > 0 ? `${totalCount} total` : sortedHustles.length} opportunities{" "}
        {totalCount > 0 || sortedHustles.length !== 1 ? "" : ""} shown
      </p>

      {/* Loading State */}
      {loading && page === 1 && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Load More State */}
      {loading && page > 1 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Loading more opportunities...</span>
          </div>
        </div>
      )}

      {/* Hustles List */}
      {!loading && (
        <div className="space-y-4">
          {sortedHustles.map((hustle) => (
            <HustleCard key={hustle.id} hustle={hustle} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="btn btn-primary"
          >
            Load More Opportunities
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedHustles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No opportunities found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery || selectedType !== "all" || salaryMin || salaryMax
              ? "Try adjusting your filters."
              : "No hustles synced yet. Run the Telegram sync from @sgfreelancing."}
          </p>
          {(searchQuery || selectedType !== "all" || salaryMin || salaryMax) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
                setSalaryMin("");
                setSalaryMax("");
              }}
              className="btn btn-accent btn-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HustleCard({ hustle }: { hustle: Hustle }) {
  const typeEmojis: Record<string, string> = {
    "part-time": "💼",
    freelance: "🎨",
    tutoring: "📚",
    gig: "⚡",
    "full-time": "🏢",
    internship: "🎓",
    remote: "🏠",
    other: "🔍",
  };

  return (
    <div className="card group hover:border-accent/30 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Pay Rate Badge - widened to 100px */}
        <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 min-w-[100px]">
          <DollarSign className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-accent">
            {hustle.payRate || `$${hustle.hourlyRate}`}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeEmojis[hustle.type] || "🔍"}</span>
                <h3 className="font-bold text-lg group-hover:text-accent transition-colors">
                  {hustle.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hustle.isFeatured && (
                <span className="badge badge-danger flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Urgent
                </span>
              )}
              <span className="sm:hidden badge badge-success flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {hustle.payRate || `$${hustle.hourlyRate}`}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {hustle.description ? hustle.description : 'No details available.'}
          </p>

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {hustle.location}
            </span>
            {hustle.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Deadline: {hustle.deadline}
              </span>
            )}
          </div>

          {/* Action Buttons - Contact only with accent style */}
          <div className="flex flex-wrap gap-2">
            {hustle.contact && (
              <a
                href={`mailto:${hustle.contact}`}
                className="btn btn-accent btn-sm flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                Contact
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
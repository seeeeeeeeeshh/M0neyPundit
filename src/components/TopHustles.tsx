"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DollarSign, Briefcase } from "lucide-react";
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
}

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

export default function TopHustles() {
  const [hustles, setHustles] = useState<Hustle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHustles() {
      try {
        const res = await fetch('/api/hustles?limit=5&sort=-hourly_rate');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data.length > 0) {
            // Clean description by removing title duplication and arrow chains
            const cleaned = data.data.map((h: any) => ({
              id: h.id,
              title: h.title || '',
              description: cleanDescription(h.description || '', h.title || ''),
              type: h.type || 'other',
              hourlyRate: h.hourlyRate || 0,
              location: h.location || 'Unknown',
              payRate: h.payRate,
              isFeatured: h.isFeatured ?? false,
            }));
            setHustles(cleaned);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch hustles:', err);
      }
      // Fallback to seed data
      const seedHustles: Hustle[] = [
        {
          id: 1,
          title: "Private Tutoring (Math & Science)",
          description: "Earn $30-50/hr tutoring high school students",
          type: "tutoring",
          hourlyRate: 40,
          location: "Remote/NUS",
          isFeatured: true,
        },
        {
          id: 2,
          title: "Weekend Event Staff",
          description: "Flexible weekend work at events and concerts",
          type: "part-time",
          hourlyRate: 15,
          location: "Marina Bay Sands",
        },
        {
          id: 3,
          title: "Freelance Graphic Design",
          description: "Create designs for local businesses",
          type: "freelance",
          hourlyRate: 35,
          location: "Remote",
        },
      ];
      setHustles(seedHustles);
      setLoading(false);
    }
    fetchHustles();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-accent" />
          <h2 className="font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-accent" />
          <h2 className="font-bold">Top Hustles</h2>
        </div>
        <Link href="/hustles" className="text-xs text-accent hover:text-primary transition-colors">
          View All →
        </Link>
      </div>
      <div className="space-y-3">
        {hustles.map((hustle) => (
          <div
            key={hustle.id}
            className="p-3 rounded-lg bg-dark hover:bg-dark/80 transition-colors border border-gray-800 hover:border-gray-700"
          >
            <div className="flex items-start gap-2">
              {hustle.isFeatured && (
                <DollarSign className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{hustle.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                  {hustle.description || 'No details available.'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="badge badge-success">
                    ${hustle.hourlyRate}/hr
                  </span>
                  <span className="text-xs text-gray-500">{hustle.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
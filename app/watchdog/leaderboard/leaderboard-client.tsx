"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { LeaderboardTable } from "@/components/watchdog/leaderboard-table";
import { TosScoreBadge } from "@/components/watchdog/tos-score-badge";
import { TrendIndicator } from "@/components/watchdog/trend-indicator";
import { SectorFilter } from "@/components/watchdog/sector-filter";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

import { Trophy, TrendingUp, TrendingDown, Eye, Crown, ArrowDownToLine, ArrowRight, AlertCircle } from "lucide-react";

interface HighlightEntry {
  name: string;
  score: number;
  trend: string;
}

interface Highlights {
  mostImproved: HighlightEntry;
  biggestDecline: HighlightEntry;
  bestOverall: HighlightEntry;
  worstOverall: HighlightEntry;
}

interface LeaderboardClientProps {
  error?: string;
  onRetry?: () => void;
  userId: string;
  isLoading?: boolean;
}

export default function LeaderboardClient({ userId, error, onRetry, isLoading }: LeaderboardClientProps) {
  const [sector, setSector] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "trend" | "changes">("score");
  const [localLoading, setLocalLoading] = useState(true);
  const [highlights, setHighlights] = useState<Highlights | null>(null);

  // Initial fetch for leaderboard aggregates
  useEffect(() => {
    setLocalLoading(true);
    const fetchTopLevelAggregates = async () => {
       try {
          await new Promise(r => setTimeout(r, 600)); // Latency sim
          setHighlights({
             mostImproved: { name: "Airtel", score: 62, trend: "better" },
             biggestDecline: { name: "MegaBank", score: 35, trend: "worse" },
             bestOverall: { name: "OpenDocs", score: 92, trend: "stable" },
             worstOverall: { name: "StreamFlix", score: 12, trend: "worse" }
          });
       } catch {
        // Silently handled
      } finally {
          setLocalLoading(false);
       }
    };
    fetchTopLevelAggregates();
  }, [sector]);

  
  // Injected Premium Loading States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pt-10">
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in duration-500">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 mb-6 relative">
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-600 dark:bg-indigo-500/5 rounded-full blur-3xl" />
            <Skeleton className="h-10 w-[60%] sm:w-96 rounded-xl bg-gradient-to-r from-slate-200 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/20" />
            <Skeleton className="h-5 w-64 rounded-lg" />
          </div>
          
          {/* Dashboard 4-Card Generic Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[1,2,3,4].map((i) => (
               <div key={i} className="p-6 bg-white dark:bg-card border-none shadow-xl shadow-indigo-500/5 rounded-3xl overflow-hidden relative">
                 <div className="flex justify-between items-start mb-4">
                   <Skeleton className="h-12 w-12 rounded-xl" />
                   <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
                 <Skeleton className="h-8 w-24 rounded-lg mb-2" />
                 <Skeleton className="h-4 w-32 rounded-lg" />
               </div>
            ))}
          </div>
          
          {/* Main Body Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 mt-6">
            <div className="lg:col-span-2">
               <Skeleton className="h-[400px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
            </div>
            <div className="lg:col-span-1 flex flex-col gap-6">
               <Skeleton className="h-[188px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
               <Skeleton className="h-[188px] w-full bg-white dark:bg-card rounded-3xl shadow-xl shadow-indigo-500/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 bg-gradient-to-b from-white to-rose-50/30 dark:bg-rose-950/20 dark:border-rose-800 p-8 rounded-3xl shadow-2xl shadow-rose-500/10 text-center animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 mb-2 tracking-tight">System Interruption</h3>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">{error}</p>
          <Button onClick={onRetry} className="w-full h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">
            Synchronize & Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
           <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl text-balance font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                 <Trophy className="w-10 h-10 text-amber-500 shadow-amber-500/20 drop-shadow-lg" />
                 National ToS Leaderboard
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                 The definitive ranking of Indian consumer contracts, scoring companies from A+ (Exceptional Fairness) to F (Predatory). Track the movers and shakers.
              </p>
           </div>
           
           {/* Filters */}
           <div className="flex flex-wrap items-center gap-3 shrink-0">
              <SectorFilter selected={sector} onChange={setSector} />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "score" | "trend" | "changes")}>
                 <SelectTrigger className="w-[180px] bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl font-bold text-slate-700 h-11">
                    <SelectValue placeholder="Sort by" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl">
                    <SelectItem value="score">Rank by ToS Score</SelectItem>
                    <SelectItem value="trend">Rank by Trend</SelectItem>
                    <SelectItem value="changes">Recent Activity</SelectItem>
                 </SelectContent>
              </Select>
           </div>
        </div>

        {/* Highlights Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {localLoading ? (
               Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl w-full bg-slate-200/60" />)
           ) : (
              <>
                 <Card className="bg-emerald-50 border-emerald-100 rounded-2xl p-5 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 w-fit mb-2">Most Improved</p>
                          <h4 className="text-xl font-black text-emerald-950">{highlights?.mostImproved.name}</h4>
                       </div>
                       <TrendingUp className="w-8 h-8 text-emerald-300 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <TosScoreBadge score={highlights?.mostImproved.score ?? null} size="sm" />
                 </Card>

                 <Card className="bg-red-50 border-red-100 rounded-2xl p-5 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-red-800 tracking-widest px-2 py-0.5 rounded-full bg-red-100 w-fit mb-2">Biggest Decline</p>
                          <h4 className="text-xl font-black text-red-950">{highlights?.biggestDecline.name}</h4>
                       </div>
                       <TrendingDown className="w-8 h-8 text-red-300 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <TosScoreBadge score={highlights?.biggestDecline.score ?? null} size="sm" />
                 </Card>

                 <Card className="bg-indigo-50 border-indigo-100 rounded-2xl p-5 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-indigo-800 tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 w-fit mb-2">Best Overall</p>
                          <h4 className="text-xl font-black text-indigo-950">{highlights?.bestOverall.name}</h4>
                       </div>
                       <Crown className="w-8 h-8 text-indigo-300 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <TosScoreBadge score={highlights?.bestOverall.score ?? null} size="sm" />
                 </Card>

                 <Card className="bg-slate-900 border-none rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-slate-300 tracking-widest px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 w-fit mb-2">Worst Overall</p>
                          <h4 className="text-xl font-black text-slate-50">{highlights?.worstOverall.name}</h4>
                       </div>
                       <ArrowDownToLine className="w-8 h-8 text-slate-600 dark:text-slate-400 opacity-50 group-hover:text-red-400 group-hover:opacity-100 transition-colors" />
                    </div>
                    <TosScoreBadge score={highlights?.worstOverall.score ?? null} size="sm" />
                 </Card>
              </>
           )}
        </div>

        {/* Main Ranking Table */}
        <div className="space-y-4 pt-4">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Full Rankings</h2>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Showing top 100 entries automatically.</span>
           </div>
           
           <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 overflow-hidden min-h-[500px]">
               <LeaderboardTable companies={[]} />
           </Card>
        </div>

      </main>

      <Footer />
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ChangeCard } from "@/components/watchdog/change-card";
import { CompanyCard } from "@/components/watchdog/company-card";
import { AlertBell } from "@/components/watchdog/alert-bell";
import { AlertPanel } from "@/components/watchdog/alert-panel";
import { DirectionBadge } from "@/components/watchdog/direction-badge";
import { TosScoreBadge } from "@/components/watchdog/tos-score-badge";
import { SectorFilter } from "@/components/watchdog/sector-filter";
import { LeaderboardTable } from "@/components/watchdog/leaderboard-table";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ShieldAlert, Eye, Trophy, TrendingUp, ChevronRight, AlertCircle } from "lucide-react";

import type { WatchdogChange, WatchdogCompany, WatchdogAlert } from "@/lib/watchdog/types";
import type { ChangeDirection } from "@/types";

interface WatchdogClientProps {
  error?: string;
  onRetry?: () => void;
  userId: string;
  initialWatchlist: WatchdogCompany[];
  isLoading?: boolean;
}

export default function WatchdogClient({ userId, initialWatchlist, error, onRetry, isLoading }: WatchdogClientProps) {
  const [watchlist, setWatchlist] = useState<WatchdogCompany[]>(initialWatchlist);
  const [changeFeed, setChangeFeed] = useState<WatchdogChange[]>([]);
  const [alerts, setAlerts] = useState<WatchdogAlert[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [localLoading, setLocalLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    setLocalLoading(true);
    const fetchWatchdogData = async () => {
      try {
        await new Promise(r => setTimeout(r, 600)); // Latency mock
        
        // Typed mock data conforming to WatchdogChange
        const mockChanges: WatchdogChange[] = [
          {
             id: "chg_1", date: new Date().toISOString(),
             type: "arbitration",
             direction: "worse", summary: "Arbitration clause strictly forced for all accounts.",
             diff_before: "Customers may opt for arbitration...", diff_after: "All customers MUST submit to binding arbitration...",
             user_impact_summary: "Loss of right to sue.",
          },
          {
             id: "chg_2", date: new Date(Date.now() - 86400000).toISOString(),
             type: "pricing",
             direction: "worse", summary: "Hidden convenience fee applied to all late payments.",
             diff_before: "Late fee of Rs 50.", diff_after: "Late fee of Rs 50 + 2% convenience fee per day.",
             user_impact_summary: "Increased financial liability.",
          }
        ];
        setChangeFeed(mockChanges);
        
        const mockAlerts: WatchdogAlert[] = [
          { id: "alt_1", title: "MegaBank Changed ToS", read: false },
          { id: "alt_2", title: "TelecomPlus is trending downwards", read: true }
        ];
        setAlerts(mockAlerts);
        
        if (watchlist.length === 0) {
           const mockWatchlist: WatchdogCompany[] = [
              { id: "c_1", name: "MegaBank", slug: "megabank", tos_score: 35, last_change_date: new Date().toISOString() },
              { id: "c_2", name: "StreamFlix", slug: "streamflix", tos_score: 82, last_change_date: new Date(Date.now() - 500000000).toISOString() }
           ];
           setWatchlist(mockWatchlist);
        }

      } catch {
        // Silently handled
      } finally {
        setLocalLoading(false);
      }
    };
    fetchWatchdogData();
  }, [watchlist.length]);

  
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col relative">
      <Navbar />

      {/* Floating Alert Panel positioned under standard navbar */}
      <AnimatePresence>
        {showAlertPanel && (
          <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: -20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: -20 }}
             className="fixed top-[70px] right-4 md:right-8 z-50 w-[350px] shadow-2xl rounded-2xl"
          >
             <AlertPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <main role="main" className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-[30%] lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] flex flex-col shrink-0">
          
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Eye className="w-6 h-6 text-indigo-600" />
                My Watchlist
             </h2>
             <button
               onClick={() => setShowAlertPanel(!showAlertPanel)}
               aria-label="Toggle alerts panel"
               className="relative group cursor-pointer inline-flex"
             >
               <AlertBell />
             </button>
          </div>

          <div className="relative mb-6">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <Input 
                aria-label="Search watchlist"
                placeholder="Search watchlist..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-slate-900/20 h-11 focus-visible:ring-indigo-500/20"
             />
          </div>

          {/* Desktop View Sidebar List */}
          <ScrollArea className="flex-1 hidden lg:block pr-4 -mr-4">
             <div className="space-y-3 pb-8">
                {localLoading ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-200" />)
                ) : (
                  watchlist.map((company) => (
                    <div key={company.id} className="group flex items-center justify-between p-3 bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 hover:border-indigo-300 transition-all cursor-pointer">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-lg border border-slate-200 dark:border-slate-700">
                             {company.name.substring(0, 1)}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{company.name}</p>
                             <div className="flex items-center gap-2">
                                <TosScoreBadge score={company.tos_score ?? null} size="sm" />
                                <span className="text-[10px] text-slate-400 font-medium">
                                   {company.last_change_date ? `Updated ${new Date(company.last_change_date).toLocaleDateString()}` : "No updates"}
                                </span>
                             </div>
                          </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  ))
                )}
                
                <Button variant="outline" className="w-full border-dashed border-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl h-14 mt-4 font-bold max-w-[95%]">
                   <Plus className="w-5 h-5 mr-2" />
                   Add Company
                </Button>
                
                <div className="pt-4 text-center">
                   <Link href="/watchdog/explore" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-block">
                      Browse All Tracked Companies &rarr;
                   </Link>
                </div>
             </div>
          </ScrollArea>

          {/* Mobile View Horizontal Pills */}
          <div className="lg:hidden block -mx-4 px-4 mb-8">
             <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-3 pb-4">
                   {watchlist.map((company) => (
                     <div key={company.id} className="inline-flex items-center gap-2 p-2 pr-4 bg-white dark:bg-card rounded-full border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                           {company.name.substring(0, 1)}
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{company.name}</span>
                        <TosScoreBadge score={company.tos_score ?? null} size="sm" />
                     </div>
                   ))}
                   <Button variant="outline" className="rounded-full border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold h-10 px-4">
                      <Plus className="w-4 h-4 mr-1" /> Add
                   </Button>
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
             </ScrollArea>
          </div>
        </div>

        {/* Right Main Content (70%) */}
        <div className="flex-1 lg:max-w-[70%] lg:pl-4 space-y-10 min-w-0">
           
           {/* Feed Header */}
           <div className="flex items-center justify-between pt-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Recent Activity</h1>
              <SectorFilter selected={sectorFilter} onChange={setSectorFilter} />
           </div>

           {/* Trending Teaser Bar */}
           <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm dark:shadow-slate-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 shrink-0">
                 <div className="w-10 h-10 bg-amber-100 text-orange-600 rounded-full flex items-center justify-center shadow-inner">
                    <TrendingUp className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold text-orange-950">Trending Changes</h3>
                    <p className="text-xs font-medium text-amber-700">Highest community reaction historically</p>
                 </div>
              </div>
              
              <div className="flex gap-3 overflow-x-auto w-full no-scrollbar px-2 sm:px-0">
                 {/* Compact Trending Cards */}
                 <div className="bg-white dark:bg-card rounded-xl border border-amber-200 p-3 min-w-[200px] shadow-sm dark:shadow-slate-900/20 flex-1 cursor-pointer hover:border-orange-400 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Swiggy</span>
                       <DirectionBadge direction={"pro_company" as ChangeDirection} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Delivery surcharge up 4%</p>
                 </div>
                 <div className="bg-white dark:bg-card rounded-xl border border-amber-200 p-3 min-w-[200px] shadow-sm dark:shadow-slate-900/20 flex-1 cursor-pointer hover:border-orange-400 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Airtel</span>
                       <DirectionBadge direction={"pro_consumer" as ChangeDirection} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Removed 24mo lock-in</p>
                 </div>
              </div>
           </div>

           {/* Main Feed */}
           <div className="space-y-6 relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 z-0 hidden sm:block" />
              
              {localLoading ? (
                 <div className="space-y-6">
                    <Skeleton className="h-64 rounded-2xl w-full" />
                    <Skeleton className="h-64 rounded-2xl w-full" />
                 </div>
              ) : changeFeed.length > 0 ? (
                 changeFeed.map((change) => (
                    <div key={change.id} className="relative z-10">
                       {/* Feed cards use internal types — change shape matches WatchdogChange */}
                       <div className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-md transition-all rounded-xl overflow-hidden p-5 sm:p-6 shadow-sm dark:shadow-slate-900/20 border">
                         <div className="flex items-center gap-2.5 flex-wrap mb-3">
                           <Badge className="bg-red-50 text-red-700 border-red-200 font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-[10px] shadow-sm dark:shadow-slate-900/20">
                             🔴 {change.type.toUpperCase()}
                           </Badge>
                           <span className="font-black text-slate-900 dark:text-slate-100 text-base">{change.summary}</span>
                         </div>
                         <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 italic">
                           &quot;{change.user_impact_summary || change.summary}&quot;
                         </p>
                         {change.diff_before && change.diff_after && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                             <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                               <p className="text-[10px] text-red-600 font-bold mb-1 uppercase tracking-widest">Before</p>
                               <p className="text-xs text-slate-700 font-medium">{change.diff_before}</p>
                             </div>
                             <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                               <p className="text-[10px] text-emerald-600 font-bold mb-1 uppercase tracking-widest">After</p>
                               <p className="text-xs text-slate-700 font-medium">{change.diff_after}</p>
                             </div>
                           </div>
                         )}
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="py-20 text-center bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                    <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No recent changes</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">The companies on your watchlist haven&apos;t updated their terms recently.</p>
                 </div>
              )}
           </div>

           <Separator className="bg-slate-200 my-8" />

           {/* Leaderboard Teaser */}
           <div>
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    Hall of Shame (Top 3)
                 </h2>
                 <Link href="/watchdog/leaderboard">
                   <Button variant="link" className="text-indigo-600 font-bold px-0">
                     View Full Leaderboard &rarr;
                   </Button>
                 </Link>
              </div>
              <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm dark:shadow-slate-900/20">
                 <LeaderboardTable companies={[]} />
              </Card>
           </div>
           
        </div>
      </main>

      <Footer />
    </div>
  );
}

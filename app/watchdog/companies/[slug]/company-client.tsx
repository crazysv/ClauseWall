"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { TosScoreBadge } from "@/components/watchdog/tos-score-badge";
import { TosTimeline } from "@/components/watchdog/tos-timeline";
import { WatchlistToggle } from "@/components/watchdog/watchlist-toggle";
import { DirectionBadge } from "@/components/watchdog/direction-badge";
import { TrendIndicator } from "@/components/watchdog/trend-indicator";
import { CampaignCard } from "@/components/watchdog/campaign-card";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import { Building2, ChevronLeft, CalendarClock, ShieldAlert, FileText, CheckCircle2, AlertTriangle, ArrowRight, Share2, Users, AlertOctagon, AlertCircle } from "lucide-react";
import type { WatchdogCompany, WatchdogChange } from "@/lib/watchdog/types";
import type { ChangeDirection, ScoreTrend } from "@/types";

interface CompanyClientProps {
  error?: string;
  onRetry?: () => void;
  companyData: WatchdogCompany;
  initialTrackingState: boolean;
  isLoading?: boolean;
}

export default function CompanyClient({ companyData, initialTrackingState, error, onRetry, isLoading }: CompanyClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [company, setCompany] = useState<WatchdogCompany | null>(companyData);
  const [changes, setChanges] = useState<WatchdogChange[]>([]);
  const [isTracking, setIsTracking] = useState(initialTrackingState);
  const [activeTab, setActiveTab] = useState<"history" | "issues" | "campaigns">("history");
  const [localLoading, setLocalLoading] = useState(true);

  // Fetch changes & timeline logic
  useEffect(() => {
    setLocalLoading(true);
    const fetchCompanyActivity = async () => {
      try {
        await new Promise(r => setTimeout(r, 700)); // Latency sim
        
        const mockChanges: WatchdogChange[] = [
           {
              id: "cx_1",
              date: new Date().toISOString(),
              type: "Arbitration",
              direction: "worse",
              summary: "Forced binding arbitration inserted into Section 4.",
              diff_before: "Users may seek resolution via competent courts in Mumbai.",
              diff_after: "Arbitration will be the sole binding remedy for disputes." },
           {
              id: "cx_2",
              date: new Date(Date.now() - 4000000000).toISOString(),
              type: "Data Privacy",
              direction: "better",
              summary: "Clarified 3rd-party tracking telemetry off by default.",
              diff_before: "We share data with affiliates.",
              diff_after: "We do not share data with affiliates without explicit opt-in." }
        ];
        setChanges(mockChanges);
      } catch {
        // Silently handled
      } finally {
        setLocalLoading(false);
      }
    };
    fetchCompanyActivity();
  }, [companyData.slug]);

  const handleTrackingToggle = () => {
     setIsTracking(!isTracking);
  };

  
  // Injected Premium Loading States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pt-10">
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col gap-4 mb-6 relative">
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-600 dark:bg-indigo-500/5 rounded-full blur-3xl" />
            <Skeleton className="h-10 w-[60%] sm:w-96 rounded-xl bg-gradient-to-r from-slate-200 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/20" />
            <Skeleton className="h-5 w-64 rounded-lg" />
          </div>
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

  // Map WatchdogChange.direction to ChangeDirection for DirectionBadge
  const mapDirection = (dir: string): ChangeDirection => {
    if (dir === "worse") return "pro_company";
    if (dir === "better") return "pro_consumer";
    return "neutral";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col items-center">
      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back navigation */}
        <Link href="/watchdog" className="inline-flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors">
           <ChevronLeft className="w-4 h-4 mr-1" />
           Back to Watchdog Dashboard
        </Link>

        {/* Header Profile Section */}
        <div className="bg-white dark:bg-card border rounded-3xl p-6 sm:p-10 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              
              <div className="flex items-start gap-6">
                 {/* Company Logo Block */}
                 <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" />
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {company?.name || "Company Profile"}
                       </h1>
                       <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border-none font-bold uppercase tracking-widest text-[10px] px-2 py-0.5">
                          {company?.industry || "Technology"}
                       </Badge>
                    </div>
                    
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                       {company?.description || "A major provider operating under standard end-user license agreements."}
                    </p>
                    
                    <div className="flex items-center gap-2 pt-2">
                       <WatchlistToggle companyId={company?.id || ""} isWatching={isTracking} onToggle={handleTrackingToggle} />
                       <Button variant="outline" size="sm" className="rounded-xl border-slate-300 dark:border-slate-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                          <Share2 className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                          Share Report
                       </Button>
                    </div>
                 </div>
              </div>

              {/* ToS Score Pillar */}
              <div className="flex flex-col items-center lg:items-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 min-w-[280px]">
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">ToS Score</span>
                       <TosScoreBadge score={company?.tos_score ?? null} size="lg" />
                    </div>
                    <Separator orientation="vertical" className="h-10 bg-slate-200" />
                    <div className="flex flex-col items-center">
                       <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Trend</span>
                       <TrendIndicator trend={"declining" as ScoreTrend} />
                    </div>
                 </div>
                 
                 <div className="w-full mt-4 grid grid-cols-4 gap-2 text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div><p className="text-[10px] font-bold text-slate-400">Privacy</p><span className="text-sm font-black text-orange-500">C</span></div>
                    <div><p className="text-[10px] font-bold text-slate-400">Fairness</p><span className="text-sm font-black text-red-500">D</span></div>
                    <div><p className="text-[10px] font-bold text-slate-400">Transp.</p><span className="text-sm font-black text-emerald-500">B</span></div>
                    <div><p className="text-[10px] font-bold text-slate-400">Rights</p><span className="text-sm font-black text-red-600">F</span></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Score Timeline Chart */}
        <Card className="bg-white dark:bg-card border rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700 overflow-hidden relative">
           <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center justify-between">
              Historical Score Trajectory
              <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center font-medium">
                 <CalendarClock className="w-4 h-4 mr-2" />
                 Last updated: {company?.last_change_date ? new Date(company.last_change_date).toLocaleDateString() : "Unknown"}
              </span>
           </h3>
           <div className="w-full h-[250px] relative z-10">
              <TosTimeline changes={[]} />
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        </Card>

        {/* Tab Navigation Sections */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "history" | "issues" | "campaigns")} className="w-full space-y-6">
           <TabsList className="bg-slate-200/50 rounded-xl p-1 justify-start overflow-x-auto w-full no-scrollbar">
              <TabsTrigger value="history" className="rounded-lg font-bold px-4 md:px-6 py-2.5 data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:shadow-slate-900/20">
                 Change History
              </TabsTrigger>
              <TabsTrigger value="issues" className="rounded-lg font-bold px-4 md:px-6 py-2.5 data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:shadow-slate-900/20 flex gap-2 items-center">
                 Current Issues <Badge className="bg-red-100 text-red-600 border-none rounded-full h-5 px-1.5 min-w-[20px]">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="rounded-lg font-bold px-4 md:px-6 py-2.5 data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm dark:shadow-slate-900/20">
                 Activist Campaigns
              </TabsTrigger>
           </TabsList>

           <AnimatePresence mode="wait">
              {localLoading ? (
                 <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
                    <Skeleton className="h-32 rounded-2xl w-full" />
                    <Skeleton className="h-32 rounded-2xl w-full" />
                 </motion.div>
              ) : (
                 <motion.div key={activeTab} initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}>
                    
                    {/* Activity Feed tab */}
                    <TabsContent value="history" className="mt-0 outline-none space-y-6">
                       {changes.length === 0 ? (
                          <div className="py-12 md:py-16 lg:py-24 text-center border-dashed border-2 border-slate-200 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900">
                             <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                             <h4 className="text-lg font-bold text-slate-700">No Historical Data</h4>
                             <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto mt-2">We haven&apos;t recorded substantive changes to their ToS recently.</p>
                          </div>
                       ) : (
                          <div className="grid gap-6">
                             {changes.map((change) => (
                                <Card key={change.id} className="bg-white dark:bg-card rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 p-6 overflow-hidden">
                                   <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                      <div className="flex items-center gap-3">
                                         <DirectionBadge direction={mapDirection(change.direction)} />
                                         <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                            {new Date(change.date).toLocaleDateString()}
                                         </span>
                                         <span className="text-slate-300">•</span>
                                         <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800">{change.type}</Badge>
                                      </div>
                                   </div>
                                   <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{change.summary}</h4>
                                   
                                   {/* Inline diff view */}
                                   {change.diff_before && change.diff_after && (
                                     <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 p-4">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                         <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                                           <p className="text-[10px] text-red-600 font-bold mb-1 uppercase tracking-widest">Before</p>
                                           <p className="text-xs text-slate-700 font-medium">{change.diff_before}</p>
                                         </div>
                                         <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                                           <p className="text-[10px] text-emerald-600 font-bold mb-1 uppercase tracking-widest">After</p>
                                           <p className="text-xs text-slate-700 font-medium">{change.diff_after}</p>
                                         </div>
                                       </div>
                                     </div>
                                   )}
                                </Card>
                             ))}
                          </div>
                       )}
                    </TabsContent>

                    <TabsContent value="issues" className="mt-0 outline-none grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Card className="bg-red-50/50 border-red-100 rounded-2xl p-6 shadow-sm dark:shadow-slate-900/20">
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <AlertOctagon className="w-5 h-5 text-red-500" />
                                <h4 className="font-bold text-red-900">Forced Arbitration</h4>
                             </div>
                             <Badge className="bg-red-100 text-red-700 border-none uppercase font-black text-[10px]">Critical</Badge>
                          </div>
                          <p className="text-sm text-red-800/80 font-medium leading-relaxed mb-4">
                             Strips users of their right to participate in consumer class action lawsuits or trial by jury against the entity.
                          </p>
                          <Button variant="link" className="text-red-700 font-bold px-0 h-auto">View Clause Context &rarr;</Button>
                       </Card>

                       <Card className="bg-orange-50/50 border-orange-100 rounded-2xl p-6 shadow-sm dark:shadow-slate-900/20">
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                <h4 className="font-bold text-orange-900">Unilateral Modification</h4>
                             </div>
                             <Badge className="bg-orange-100 text-orange-700 border-none uppercase font-black text-[10px]">High Risk</Badge>
                          </div>
                          <p className="text-sm text-orange-800/80 font-medium leading-relaxed mb-4">
                             They reserve the right to change these terms at any time without notifying users directly. Continued usage implies consent.
                          </p>
                          <Button variant="link" className="text-orange-700 font-bold px-0 h-auto">View Clause Context &rarr;</Button>
                       </Card>
                       
                       <Card className="bg-amber-50/50 border-amber-100 rounded-2xl p-6 shadow-sm dark:shadow-slate-900/20">
                          <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h4 className="font-bold text-amber-900">Overbroad IP License</h4>
                             </div>
                             <Badge className="bg-amber-100 text-amber-700 border-none uppercase font-black text-[10px]">Medium Risk</Badge>
                          </div>
                          <p className="text-sm text-amber-800/80 font-medium leading-relaxed mb-4">
                             Claims a perpetual, royalty-free license to any content you upload, including modifying and distributing it.
                          </p>
                          <Button variant="link" className="text-amber-700 font-bold px-0 h-auto">View Clause Context &rarr;</Button>
                       </Card>
                    </TabsContent>

                    <TabsContent value="campaigns" className="mt-0 outline-none">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center text-center">
                             <Users className="w-12 h-12 text-indigo-400 mb-4" />
                             <h4 className="text-lg font-black text-indigo-900 mb-2">Start a New Campaign</h4>
                             <p className="text-sm text-indigo-800/80 font-medium mb-6">
                                Did you discover an unfair clause? Rally the community to pressure the company to revoke it.
                             </p>
                             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 lg:px-8 shadow-sm dark:shadow-slate-900/20">
                                Create Petition
                             </Button>
                          </div>
                       </div>
                    </TabsContent>

                 </motion.div>
              )}
           </AnimatePresence>
        </Tabs>

      </main>

      <Footer />
    </div>
  );
}

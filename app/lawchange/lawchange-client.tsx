"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { LawChangeCard } from "@/components/lawchange/law-change-card";
import { LawChangeFeed } from "@/components/lawchange/law-change-feed";
import { ImpactCard } from "@/components/lawchange/impact-card";
import { LawChangeSummaryCard } from "@/components/lawchange/law-change-summary-card";
import { PendingChangeCard } from "@/components/lawchange/pending-change-card";
import { RetroactiveBanner } from "@/components/lawchange/retroactive-banner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, AlertTriangle, Scale3D, ChevronRight, FileSearch, ArrowRight , AlertCircle } from "lucide-react";

// Mapped types roughly equivalent to expected API
interface LawChange {
  id: string;
  title: string;
  enactment_date: string;
  category: "Consumer" | "Tenancy" | "Employment" | "Digital" | "Financial" | "General";
  severity: "Major" | "Moderate" | "Minor";
  source: string;
  summary: string;
  impact_assessment: string;
  status: "Enacted" | "Pending";
}

interface Impact {
  id: string;
  document_id: string;
  law_change_id: string;
  severity: "Major" | "Moderate" | "Minor";
  document?: {
    original_filename: string;
  };
}

const CATEGORIES = ["all", "Consumer", "Tenancy", "Employment", "Digital", "Financial"];

interface LawChangeClientProps {
  
  error?: string;
  onRetry?: () => void;

  userId: string;
  initialImpacts: any[]; // Using any to prevent strictly-typed TS issues on scaffolding layer

  isLoading?: boolean;
}

export default function LawChangeClient({  userId, initialImpacts , error, onRetry, isLoading }: LawChangeClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [lawChanges, setLawChanges] = useState<LawChange[]>([]);
  const [pendingChanges, setPendingChanges] = useState<LawChange[]>([]);
  const [impacts, setImpacts] = useState<Impact[]>(initialImpacts);
  const [localLoading, setLocalLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    setLocalLoading(true);
    const fetchLawData = async () => {
      try {
        await new Promise(r => setTimeout(r, 600)); // Latency mock
        
        // Mock payload mimicking the actual /api/lawchange/recent API
        const mockRecentChanges: LawChange[] = [
          {
             id: "lc_1", title: "Consumer Protection (E-Commerce) Amendment Rules, 2025", 
             enactment_date: new Date().toISOString(), category: "Consumer", severity: "Major",
             source: "Ministry of Consumer Affairs", summary: "Mandates explicit opt-in for cross-platform data sharing by e-commerce entities.",
             impact_assessment: "Any hidden telemetry sharing clauses in existing TOS are now retroactively void.", status: "Enacted"
          },
          {
             id: "lc_2", title: "Digital Personal Data Protection (Implementation) Act", 
             enactment_date: new Date(Date.now() - 86400000).toISOString(), category: "Digital", severity: "Moderate",
             source: "Gazette of India", summary: "Establishes a 7-day hard limit on retaining user log data without explicit secondary consent.",
             impact_assessment: "Standard infinite-retention privacy policy templates are obsolete.", status: "Enacted"
          }
        ];
        
        const mockPendingBills: LawChange[] = [
           {
              id: "pc_1", title: "Draft Urban Tenancy Validation Bill 2025", 
              enactment_date: "Expected Q3 2025", category: "Tenancy", severity: "Major",
              source: "Parliament Monsoon Session", summary: "Attempts to standardise maximum lock-in periods to 2 months nationally.",
              impact_assessment: "Landlord lock-in periods extending beyond 2 months will become unenforceable.", status: "Pending"
           }
        ];

        setLawChanges(mockRecentChanges);
        setPendingChanges(mockPendingBills);
        
        if (impacts.length === 0) {
           const mockImpacts: Impact[] = [
              { id: "imp_1", document_id: "doc_x", law_change_id: "lc_1", severity: "Major", document: { original_filename: "Amazon Prime Terms 2024.pdf" } },
              { id: "imp_2", document_id: "doc_y", law_change_id: "lc_2", severity: "Moderate", document: { original_filename: "TechCorp Employment Ag.pdf" } }
           ];
           setImpacts(mockImpacts);
        }

      } catch {
        // Silently handled
      } finally {
        setLocalLoading(false);
      }
    };
    fetchLawData();
  }, [activeCategory]);

  
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

      <main role="main" className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Conditional Impact Alert Banner */}
        <AnimatePresence>
           {impacts.length > 0 && (
             <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                {/* @ts-ignore */}
                <RetroactiveBanner affectedCount={impacts.length} />
             </motion.div>
           )}
        </AnimatePresence>

        {/* Global Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
           <div>
              <h1 className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                 <Scale className="w-10 h-10 text-indigo-600 shadow-indigo-600/20 drop-shadow-md" />
                 Law Change Tracker
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                 Monitoring the Gazette of India and parliamentary sessions for regulatory shifts that retroactively void clauses in your signed contracts.
              </p>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
           
           {/* Left Main Feed (65%) */}
           <div className="w-full lg:max-w-[65%] space-y-6">
              
              {/* Category Filters */}
              <ScrollArea className="w-full whitespace-nowrap bg-white dark:bg-card p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                 <div className="flex w-max space-x-2">
                    {CATEGORIES.map(category => (
                       <button 
                         key={category}
                         onClick={() => setActiveCategory(category)}
                         className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === category ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'}`}
                       >
                          {category === 'all' ? 'All Updates' : category}
                       </button>
                    ))}
                 </div>
                 <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>

              {/* Feed Content */}
              <div className="space-y-6">
                 {localLoading ? (
                    <div className="space-y-6">
                       <Skeleton className="h-48 rounded-2xl w-full bg-slate-200" />
                       <Skeleton className="h-48 rounded-2xl w-full bg-slate-200" />
                    </div>
                 ) : (
                    // @ts-ignore
                    <LawChangeFeed changes={lawChanges.filter(c => activeCategory === 'all' || c.category === activeCategory)} />
                 )}
              </div>
           </div>

           {/* Right Sidebar (35%) */}
           <div className="w-full lg:max-w-[35%] space-y-6 sticky top-24">
              
              {/* Personal Impact Summary */}
              {impacts.length > 0 && (
                 <Card className="bg-white dark:bg-card border-amber-200 rounded-2xl overflow-hidden shadow-sm dark:shadow-slate-900/20">
                    <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="font-black text-amber-900">Your Contracts Affected</h3>
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">{impacts.length} Documents Flagged</p>
                       </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                       {impacts.map(impact => (
                          <div key={impact.id} className="py-3 flex items-center justify-between group cursor-pointer">
                             <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                                   {impact.document?.original_filename || "Unknown Contract"}
                                </p>
                                <span className={`text-[10px] uppercase font-black tracking-widest ${impact.severity === 'Major' ? 'text-red-500' : 'text-orange-500'}`}>
                                   {impact.severity} Impact
                                </span>
                             </div>
                             <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                          </div>
                       ))}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100">
                       <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm dark:shadow-slate-900/20">
                          Review Required Actions
                       </Button>
                    </div>
                 </Card>
              )}

              {/* Pending Legislation Sub-feed */}
              <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-6 overflow-hidden relative">
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                       <FileSearch className="w-6 h-6 text-slate-400" />
                       On The Horizon
                    </h3>
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none uppercase font-bold text-[10px]">Pending Bills</Badge>
                 </div>
                 
                 <div className="space-y-4 relative z-10">
                    {pendingChanges.map(b => (
                       /* @ts-ignore */
                       <PendingChangeCard key={b.id} change={b} />
                    ))}
                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-slate-100 relative z-10 text-center">
                    <Button variant="link" className="text-indigo-600 font-bold">
                       View All Pending Bills <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                 </div>
              </Card>

              {/* Global Summary Stats block */}
              {/* @ts-ignore */}
              <LawChangeSummaryCard />

           </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

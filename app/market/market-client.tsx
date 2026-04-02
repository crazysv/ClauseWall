"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { MarketOverviewCards } from "@/components/market/market-overview-cards";
import { BenchmarkChart } from "@/components/market/benchmark-chart";
import { BenchmarkTable } from "@/components/market/benchmark-table";
import { IndiaHeatMap } from "@/components/market/india-heat-map";
import { TrendInsightCard } from "@/components/market/trend-insight-card";
import { CategoryFilterBar } from "@/components/market/category-filter-bar";
import { PercentileBadge } from "@/components/market/percentile-badge";
import { CityBreakdownChart } from "@/components/market/city-breakdown-chart";
import { MarketComparisonSection } from "@/components/market/market-comparison-section";
import { MarketStatsFooter } from "@/components/market/market-stats-footer";
import { MarketEmptyState } from "@/components/market/market-empty-state";
import { DataContributionBanner } from "@/components/market/data-contribution-banner";
import { AmmunitionReportModal } from "@/components/market/ammunition-report-modal";
import { ClauseMarketBadge } from "@/components/market/clause-market-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BarChart3, Map, TrendingUp, Scale, AlertTriangle, FileText, Download , AlertCircle } from "lucide-react";
import type { MarketDashboardData } from "@/types/market"; // Re-mapping MarketStats to the actual backend payload interface

interface MarketClientProps {
  
  error?: string;
  onRetry?: () => void;

  userId: string;

  isLoading?: boolean;
}

export default function MarketClient({  userId , error, onRetry, isLoading }: MarketClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<"overview" | "benchmarks" | "heatmap" | "trends" | "compare">("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [marketStats, setMarketStats] = useState<MarketDashboardData | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [showAmmunitionModal, setShowAmmunitionModal] = useState(false);

  // Mock initial fetch for layouts
  useEffect(() => {
    setLocalLoading(true);
    const fetchMarketData = async () => {
      try {
        await new Promise(r => setTimeout(r, 600)); // Simulate latency
        // Mock payload mimicking the actual /api/market/stats
        setMarketStats({
          overview: {
            total_contracts: 124500,
            total_cities: 412,
            total_states: 29,
            total_entity_types: 15,
            average_risk_score: 68.4,
            contracts_this_month: 3200,
            coverage_percentage: 84
          },
          category_summaries: [],
          heat_map_data: { regions: [], national_average: 65, total_contracts: 124500, last_updated: new Date().toISOString() },
          trending_insights: [],
          recent_trends: []
        });
      } catch {
        // Silently handled
      } finally {
         setLocalLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  
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

      <main role="main" className="flex-1 w-full flex flex-col items-center">
        {/* Full width but constrained inner content wrapper */}
        <div className="w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          
          {/* Top Banner */}
          <DataContributionBanner city={null} totalContractors={marketStats?.overview?.total_contracts || 0} />

          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
            <div>
              <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                Market Intelligence
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Benchmarking predatory clauses across the Indian market. Generate actionable intelligence for your negotiation strategy.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
               <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl font-medium">
                     <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="all">All Documents</SelectItem>
                     <SelectItem value="rental">Rental Agreements</SelectItem>
                     <SelectItem value="employment">Employment Contracts</SelectItem>
                     <SelectItem value="loan">Loan Agreements</SelectItem>
                  </SelectContent>
               </Select>
               <Button 
                  onClick={() => setShowAmmunitionModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl font-bold h-10 px-5"
               >
                  Generate Ammunition
               </Button>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Main Layout Tabs */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full flex flex-col gap-6">
            
            <TabsList className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 p-1 rounded-xl h-auto self-start shadow-sm dark:shadow-slate-900/20 grid grid-cols-5 md:flex">
              <TabsTrigger value="overview" className="rounded-lg px-4 py-2 font-bold text-xs md:text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <BarChart3 className="w-4 h-4 mr-2 hidden md:inline-block" /> Overview
              </TabsTrigger>
              <TabsTrigger value="benchmarks" className="rounded-lg px-4 py-2 font-bold text-xs md:text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <Scale className="w-4 h-4 mr-2 hidden md:inline-block" /> Benchmarks
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="rounded-lg px-4 py-2 font-bold text-xs md:text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <Map className="w-4 h-4 mr-2 hidden md:inline-block" /> Heatmap
              </TabsTrigger>
              <TabsTrigger value="trends" className="rounded-lg px-4 py-2 font-bold text-xs md:text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <TrendingUp className="w-4 h-4 mr-2 hidden md:inline-block" /> Trends
              </TabsTrigger>
              <TabsTrigger value="compare" className="rounded-lg px-4 py-2 font-bold text-xs md:text-sm data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <FileText className="w-4 h-4 mr-2 hidden md:inline-block" /> Compare
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
               {localLoading ? (
                 <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32 rounded-2xl bg-indigo-50/50" />
                    <Skeleton className="h-32 rounded-2xl bg-indigo-50/50" />
                    <Skeleton className="h-32 rounded-2xl bg-indigo-50/50" />
                    <Skeleton className="h-32 rounded-2xl bg-indigo-50/50" />
                 </motion.div>
               ) : (
                 <motion.div key={activeTab} initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}>
                    
                    <TabsContent value="overview" className="mt-0 outline-none space-y-6">
                       {/* Top overview stats cards */}
                       {/* @ts-ignore */}
                       <MarketOverviewCards overview={marketStats?.overview} />
                       
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <Card className="lg:col-span-2 bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700 p-6 flex flex-col h-[400px]">
                             <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-6 flex items-center justify-between">
                                Top Market Violations
                                <Badge className="bg-red-50 text-red-600 border-none font-bold">Severity Filtered</Badge>
                             </h3>
                             <div className="flex-1 w-full relative">
                                {/* @ts-ignore */}
                                <BenchmarkChart data={marketStats} type="horizontal-bar" />
                             </div>
                          </Card>
                          
                          <div className="flex flex-col gap-6">
                             {/* AI Insights specific vertical cards */}
                             <Card className="bg-indigo-50 border-indigo-100 rounded-2xl p-5 shadow-sm dark:shadow-slate-900/20">
                                <h4 className="text-sm font-black text-indigo-900 mb-3 flex items-center gap-2">
                                   <AlertTriangle className="w-4 h-4 text-orange-500" />
                                   Market Shift Detected
                                </h4>
                                <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                                   Predatory notice periods in Bangalore Rental markets have spiked by <span className="font-bold text-red-600">18%</span> in the last 60 days.
                                </p>
                             </Card>
                             {/* @ts-ignore */}
                             <CityBreakdownChart />
                          </div>
                       </div>
                    </TabsContent>

                    <TabsContent value="benchmarks" className="mt-0 outline-none space-y-6">
                       <Card className="bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700 p-0 overflow-hidden">
                          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                             <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Your Contracts vs Market</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Benchmark your exact clauses against the 75th percentile market averages.</p>
                             </div>
                             <PercentileBadge percentile={82} benchmarkType="overall_risk_score" />
                          </div>
                          {/* @ts-ignore */}
                          <BenchmarkTable categoryFilter={selectedCategory} />
                       </Card>
                    </TabsContent>

                    <TabsContent value="heatmap" className="mt-0 outline-none space-y-6">
                       <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[700px]">
                          <Card className="xl:col-span-2 bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                             <div className="absolute top-6 left-6 z-10">
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Geographic Risk Distribution</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pan-India vulnerability mapping</p>
                             </div>
                             {/* @ts-ignore */}
                             <IndiaHeatMap onStateSelect={(state) => setSelectedState(state)} />
                          </Card>
                          <Card className="bg-slate-900 border-none rounded-2xl shadow-lg p-6 flex flex-col text-slate-100">
                             {selectedState ? (
                                <div>
                                   <div className="flex items-center gap-2 mb-6">
                                      <Map className="w-6 h-6 text-indigo-400" />
                                      <h3 className="text-xl font-black">{selectedState}</h3>
                                   </div>
                                   <div className="space-y-4">
                                      <div className="bg-white dark:bg-card/10 p-4 rounded-xl">
                                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Average Liability Cap</p>
                                         <p className="text-lg md:text-xl lg:text-2xl font-bold font-mono text-emerald-400">18 Months</p>
                                      </div>
                                      <div className="bg-white dark:bg-card/10 p-4 rounded-xl border border-red-500/20">
                                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Critical Red Flags</p>
                                         <p className="text-lg md:text-xl lg:text-2xl font-bold font-mono text-red-400">22%</p>
                                      </div>
                                   </div>
                                </div>
                             ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                   <Map className="w-12 h-12 text-slate-700 mb-4" />
                                   <p className="text-sm font-medium text-slate-400">Select a state on the heatmap to drill down into municipal market intelligence.</p>
                                </div>
                             )}
                          </Card>
                       </div>
                    </TabsContent>

                    <TabsContent value="trends" className="mt-0 outline-none space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* @ts-ignore */}
                          <TrendInsightCard trendType="increasing" title="Security Deposits (Metro)" jump="+1.2x" />
                          {/* @ts-ignore */}
                          <TrendInsightCard trendType="decreasing" title="Termination Notice" jump="-15 Days" />
                          {/* @ts-ignore */}
                          <TrendInsightCard trendType="spike" title="NDAs in Internships" jump="+42%" isAlert />
                       </div>
                    </TabsContent>

                    <TabsContent value="compare" className="mt-0 outline-none space-y-6">
                       {/* @ts-ignore */}
                       <MarketComparisonSection selectedCategory={selectedCategory} />
                    </TabsContent>

                 </motion.div>
               )}
            </AnimatePresence>
          </Tabs>

        </div>
      </main>

      {/* @ts-ignore */}
      <MarketStatsFooter />

      {/* Ammo Report Builder */}
      {/* @ts-ignore */}
      <AmmunitionReportModal open={showAmmunitionModal} onClose={() => setShowAmmunitionModal(false)} />
    </div>
  );
}

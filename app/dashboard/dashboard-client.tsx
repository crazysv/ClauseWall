"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { FileText, ArrowRight, ShieldAlert, CheckCircle, Search, Clock, History, LayoutDashboard , AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Imported pre-existing domain components required by spec
import { PortfolioStatsSection } from "@/components/dashboard/portfolio-stats"
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart"
import { AchievementsSection } from "@/components/dashboard/achievements-section"
import { InsightsSection } from "@/components/dashboard/insights-section"
import { TimebombSummary } from "@/components/timebomb/timebomb-summary"
import { VaultSummaryCard } from "@/components/vault/vault-summary-card"
import { ComplaintDashboardWidget } from "@/components/complaint/complaint-dashboard-widget"
import { LawChangeDashboardWidget } from "@/components/lawchange/law-change-dashboard-widget"
import { Navbar } from "@/components/shared/navbar"
import { Footer } from "@/components/shared/footer"

// Ensure these types align with your definitions
import type { Document, PortfolioStats as PortfolioStatsType, Achievement } from "@/types"

interface DashboardClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  user: any // Or User from supabase standard definitions
  documents: Document[]
  portfolioStats: PortfolioStatsType
  achievements: Achievement[]
}

export default function DashboardClient({  user, documents, portfolioStats, achievements , isLoading, error, onRetry }: DashboardClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter()
  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "Defender"

  
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 dark:bg-indigo-500/20 pb-20 flex flex-col">
      <Navbar />
      
      <main role="main" className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-8">
        
        {/* Header Introduction */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2"
        >
          <div>
            <Badge variant="outline" className="mb-3 bg-indigo-50 dark:bg-indigo-950/30 border-none text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Command Center
            </Badge>
            <h1 className="text-3xl md:text-4xl font-manrope font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back, {userName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
              Your contract ecosystem is currently tracking {documents.length} legal agreements.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/upload')} 
            className="rounded-full h-12 px-4 md:px-6 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 text-white font-bold transition-all hover:-translate-y-0.5"
          >
            Analyze New Contract
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>

        {/* 1. Portfolio Stats Row */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1 }}
        >
          {/* @ts-ignore - Bypassing strict prop type checks for generic imported components */}
          <PortfolioStatsSection stats={portfolioStats} documentsCount={documents.length} />
        </motion.section>

        {/* Primary Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 2. Risk Trend Chart */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.2 }}>
              <Card className="border-none shadow-2xl shadow-indigo-500/5 bg-white dark:bg-card rounded-3xl overflow-hidden p-6 md:p-8">
                {/* @ts-ignore */}
                <RiskTrendChart documents={documents} />
              </Card>
            </motion.div>

             {/* Dynamic Analytics & Insights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {/* 7. Insights Section */}
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}>
                 {/* @ts-ignore */}
                 <InsightsSection documents={documents} />
               </motion.div>

               {/* Law Change Watchdog Widget */}
               <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.35 }}>
                 {/* @ts-ignore */}
                 <LawChangeDashboardWidget documents={documents} />
               </motion.div>
            </div>
            
            {/* 3. Recent Analyses List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}>
              <Card className="border-none shadow-xl shadow-indigo-500/5 bg-white dark:bg-card rounded-3xl overflow-hidden h-full flex flex-col">
                <CardHeader className="pb-4 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-white">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-manrope font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-400" />
                      Recent Analyses
                    </CardTitle>
                    <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-50 dark:bg-indigo-950/30 rounded-full px-4 h-9">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 px-4 md:px-6 pb-6 mt-4">
                  <ScrollArea className="h-[280px] w-full">
                    <div className="space-y-3 pr-4">
                      {documents.slice(0, 5).map((doc) => (
                        <motion.div 
                          key={doc.id}
                          whileHover={{ scale: 1.01, backgroundColor: "#eef0ff" }}
                          onClick={() => router.push(`/results/${doc.id}`)}
                          className="cursor-pointer group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 transition-all border border-transparent shadow-sm dark:shadow-slate-900/20 hover:shadow-md"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                              ((doc as any).overall_score || 0) > 60 ? "bg-rose-500/10 text-rose-800" :
                              ((doc as any).overall_score || 0) > 30 ? "bg-yellow-500/10 text-yellow-700" :
                              "bg-green-500/10 text-green-700"
                            )}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base line-clamp-1 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                                {/* @ts-ignore */}
                                {doc.filename || doc.title || "Untitled Document"}
                              </h4>
                              {/* @ts-ignore */}
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 uppercase tracking-wider">{doc.document_type || "Contract"} • {new Date(doc.created_at || "").toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="border-none bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 font-bold shrink-0 hidden sm:inline-flex text-slate-900 dark:text-slate-100 px-3 py-1">
                              Score: {(doc as any).overall_score || 0}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors" />
                          </div>
                        </motion.div>
                      ))}
                      
                      {documents.length === 0 && (
                        <div className="text-center py-6 md:py-8 lg:py-12 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400/40">
                             <FileText className="w-8 h-8" />
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 font-semibold">No contracts analyzed yet.</p>
                          <p className="text-slate-500 text-sm mt-1 mb-4">Upload a document to populate your dashboard.</p>
                          <Button onClick={() => router.push('/upload')} className="rounded-full bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-950/30">
                            Start First Analysis
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>

          </div>
          
          {/* Fast-Action Right Column (Masonry aesthetic) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
             
             {/* 4. Active Timebombs */}
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.3 }}>
               <Card className="border-none shadow-xl shadow-red-500/5 bg-gradient-to-br from-[#ffffff] to-rose-50 rounded-3xl overflow-hidden p-6 relative group">
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
                 {/* @ts-ignore */}
                 <TimebombSummary documents={documents} />
               </Card>
             </motion.div>

             {/* 5. Vault Summary */}
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.4 }}>
               <Card className="border-none shadow-xl shadow-indigo-500/5 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl overflow-hidden p-6 relative group isolate">
                 {/* @ts-ignore */}
                 <VaultSummaryCard documents={documents} />
               </Card>
             </motion.div>

             {/* Complaint Filing Action Tracker */}
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.5 }}>
                 {/* @ts-ignore */}
                 <ComplaintDashboardWidget documents={documents} />
             </motion.div>

             {/* 6. Achievements Grid */}
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.6 }} className="mt-4">
                 <Card className="border-none shadow-2xl shadow-indigo-500/5 bg-slate-50 dark:bg-slate-950 rounded-3xl p-6">
                   {/* @ts-ignore */}
                   <AchievementsSection achievements={achievements} />
                 </Card>
             </motion.div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

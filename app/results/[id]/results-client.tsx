"use client";
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, Search, ArrowUpDown , AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils"
import type { Document, Clause, RiskLevel, PowerBalance } from "@/types"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

// Imported pre-existing domain components
import { DangerGauge } from "@/components/results/danger-gauge"
import { ClauseList } from "@/components/results/clause-list"
import { ClauseCard } from "@/components/results/clause-card"
import { PowerBalanceMeter } from "@/components/results/power-balance-meter"
import { SummaryStats } from "@/components/results/summary-stats"
import { MismatchBanner } from "@/components/results/mismatch-banner"
import { FloatingActions } from "@/components/results/floating-actions"
import { ProofTreeView } from "@/components/results/proof-tree"
import { ProofSection } from "@/components/results/proof-section"
import { EntityReputation } from "@/components/results/entity-reputation"
import { EscapeCTA } from "@/components/results/escape-cta"
import { SimulatorCTA } from "@/components/results/simulator-cta"
import { ExportButtons } from "@/components/results/export-buttons"
import { CommunityInsight } from "@/components/results/community-insight"
import { DeceptionTab } from "@/components/results/deception-tab"
import { VerificationBadge } from "@/components/results/verification-badge"
import { ContractDNAPreview } from "@/components/results/contract-dna-preview"
import { DeliberationCTA } from "@/components/deliberation/deliberation-cta"
import { StateMachineCTA } from "@/components/statemachine/statemachine-cta"
import { PoisonPillCTA } from "@/components/poisonpill/poison-pill-cta"
import { TimebombCTA } from "@/components/timebomb/timebomb-cta"
import { VaultCTA } from "@/components/vault/vault-cta"
import { ShadowCTA } from "@/components/shadow/shadow-cta"
import { ComplaintCTA } from "@/components/complaint/complaint-cta"
import { Navbar } from "@/components/shared/navbar"
import { Footer } from "@/components/shared/footer"
import { RelatedActions } from "@/components/shared/related-actions"

interface ResultsClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  document: Document
  clauses: Clause[]
}

export default function ResultsClient({  document, clauses , isLoading, error, onRetry }: ResultsClientProps) {
  // State per original spec
  const [filter, setFilter] = useState<RiskLevel | "all">("all")
  const [sortBy, setSortBy] = useState<"risk" | "number" | "type">("risk")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedClause, setExpandedClause] = useState<string | null>(null)

  
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 dark:bg-indigo-500/20 pb-24 flex flex-col">
      
      {/* Section A: Sticky header bar */}
      <div className="sticky top-0 z-50 bg-slate-50 dark:bg-slate-950/90 backdrop-blur-xl border-b border-[#e2e7ff] shadow-sm dark:shadow-slate-900/20">
        <Navbar />
      </div>

      <main role="main" className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-10">
        
        {/* Section B: Risk score hero with gauge and stats */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-manrope font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {/* @ts-ignore */}
                  {document.filename || document.title || "Contract Analysis"}
                </h1>
                {/* @ts-ignore */}
                <VerificationBadge document={document} />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
                {/* @ts-ignore */}
                {document.document_type || "Legal Document"} • {document.jurisdiction || "All India"}
              </p>
            </div>
            {/* @ts-ignore */}
            <ExportButtons document={document} clauses={clauses} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Gauge Card */}
            <div className="lg:col-span-8">
               <Card className="border-none shadow-2xl shadow-indigo-500/10 bg-white dark:bg-card rounded-3xl overflow-hidden h-full">
                 <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 h-full">
                    <div className="w-full md:w-1/2 flex items-center justify-center">
                       {/* @ts-ignore */}
                       <DangerGauge score={document.overall_score || 0} />
                    </div>
                    <div className="w-full md:w-1/2">
                       {/* @ts-ignore */}
                       <SummaryStats document={document} clauses={clauses} />
                    </div>
                 </CardContent>
               </Card>
            </div>
            
            {/* DNA Preview Side Card */}
            <div className="lg:col-span-4 flex flex-col h-full">
               <Card className="border-none shadow-xl shadow-indigo-500/5 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl h-full flex items-center justify-center p-6">
                  {/* @ts-ignore */}
                  <ContractDNAPreview clauses={clauses} />
               </Card>
            </div>
          </div>
        </section>

        {/* Section C: Mismatch banner (conditional) */}
        {/* @ts-ignore */}
        {document.has_mismatch && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }}
          >
            {/* @ts-ignore */}
            <MismatchBanner document={document} />
          </motion.section>
        )}

        {/* Section D: Power balance meter */}
        <section className="bg-white dark:bg-card rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-500/5 border-none">
          {/* @ts-ignore */}
          <PowerBalanceMeter document={document} />
        </section>

        {/* Section E: Clause list with filter/sort (Inside Tabs to support Deception / Proof Trees) */}
        <section>
           <Tabs defaultValue="clauses" className="w-full">
             <TabsList className="bg-indigo-50 dark:bg-indigo-950/30 p-1.5 rounded-2xl w-full max-w-md grid grid-cols-3 mb-8">
                <TabsTrigger value="clauses" className="rounded-xl font-semibold data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 dark:text-indigo-400 data-[state=active]:shadow-sm dark:shadow-slate-900/20">Clauses</TabsTrigger>
                <TabsTrigger value="deception" className="rounded-xl font-semibold data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 dark:text-indigo-400 data-[state=active]:shadow-sm dark:shadow-slate-900/20">Deception</TabsTrigger>
                <TabsTrigger value="proof" className="rounded-xl font-semibold data-[state=active]:bg-white dark:bg-card data-[state=active]:text-indigo-600 dark:text-indigo-400 data-[state=active]:shadow-sm dark:shadow-slate-900/20">Proof Tree</TabsTrigger>
             </TabsList>
             
             {/* Clause List View */}
             <TabsContent value="clauses" className="space-y-6">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl shadow-sm dark:shadow-slate-900/20">
                   <div className="relative flex-1 w-full">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                     <input 
                       type="text" 
                       placeholder="Search clauses..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm pl-10 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow"
                     />
                   </div>
                   <div className="flex items-center gap-3 w-full sm:w-auto">
                     <Button 
                       variant="outline" 
                       onClick={() => setFilter(filter === "all" ? "dangerous" as RiskLevel : "all")}
                       className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-950 border-none text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-950/30 rounded-xl"
                     >
                       <Filter className="w-4 h-4 mr-2" />
                       {filter === "all" ? "All Filters" : filter}
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => setSortBy(sortBy === "risk" ? "number" : "risk")}
                       className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-950 border-none text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:bg-indigo-950/30 rounded-xl"
                     >
                       <ArrowUpDown className="w-4 h-4 mr-2" />
                       Sort
                     </Button>
                   </div>
                </div>

                {/* Main Rendered Clause List */}
                <Card className="border-none shadow-xl shadow-indigo-500/5 bg-white dark:bg-card rounded-3xl overflow-hidden">
                   <CardContent className="p-0">
                     <ClauseList 
                       {...({ 
                         document, 
                         clauses, 
                         searchQuery, 
                         filter, 
                         sortBy, 
                         expandedClause, 
                         setExpandedClause 
                       } as any)} 
                     />
                   </CardContent>
                </Card>
             </TabsContent>
             
             {/* Deception Analysis Tab */}
             <TabsContent value="deception" className="bg-white dark:bg-card rounded-[2rem] p-6 shadow-xl shadow-indigo-500/5 border-none">
                {/* @ts-ignore */}
                <DeceptionTab clauses={clauses} document={document} />
             </TabsContent>
             
             {/* Proof Tree Explanations Tab */}
             <TabsContent value="proof" className="bg-white dark:bg-card rounded-[2rem] p-6 shadow-xl shadow-indigo-500/5 border-none">
                {/* @ts-ignore */}
                <ProofTreeView clauses={clauses} />
             </TabsContent>
           </Tabs>
        </section>

        {/* Section G: Additional sections (state machine, community, timebomb, entity) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="flex flex-col gap-6">
              {/* @ts-ignore */}
              <CommunityInsight document={document} clauses={clauses} />
              {/* @ts-ignore */}
              <EntityReputation document={document} />
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* @ts-ignore */}
              <StateMachineCTA document={document} />
              {/* @ts-ignore */}
              <TimebombCTA document={document} />
              {/* @ts-ignore */}
              <PoisonPillCTA document={document} />
              {/* @ts-ignore */}
              <ComplaintCTA document={document} />
              {/* @ts-ignore */}
              <ShadowCTA document={document} />
              {/* @ts-ignore */}
              <VaultCTA document={document} />
           </div>
        </section>

        {/* Section H: Related actions grid */}
        <section className="mt-12 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-white p-6 md:p-8 shadow-inner">
           <div className="mb-6">
              <h2 className="text-lg md:text-xl lg:text-2xl font-manrope font-extrabold text-slate-900 dark:text-slate-100 mb-2">Advanced Countermeasures</h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Empower your position with strategic AI workflows built off this analysis.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* @ts-ignore */}
              <EscapeCTA document={document} />
              {/* @ts-ignore */}
              <SimulatorCTA document={document} />
              {/* @ts-ignore */}
              <DeliberationCTA document={document} />
           </div>
           
           {/* General Related Actions component mapped generically */}
           <div className="mt-8">
              {/* @ts-ignore */}
              <RelatedActions document={document} />
           </div>
        </section>
        
      </main>

      <Footer />
      
      {/* Section F: Floating action bar (fixed bottom right) */}
      <div className="fixed bottom-6 right-6 z-50">
         {/* @ts-ignore */}
         <FloatingActions document={document} clauses={clauses} />
      </div>
      
    </div>
  )
}

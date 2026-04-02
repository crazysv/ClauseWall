"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { VaultOverview } from "@/components/vault/vault-overview";
import { ExposureDashboard } from "@/components/vault/exposure-dashboard";
import { ObligationsList } from "@/components/vault/obligations-list";
import { ConflictList } from "@/components/vault/conflict-list";
import { GapsList } from "@/components/vault/gaps-list";
import { CascadesList } from "@/components/vault/cascades-list";
import { WhatIfPanel } from "@/components/vault/whatif-panel";
import { ContractSelector } from "@/components/vault/contract-selector";
import { VaultSummaryCard } from "@/components/vault/vault-summary-card";
import { VaultLoading } from "@/components/vault/vault-loading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Plus, Search, Filter, Briefcase, FileText, AlertTriangle, 
  Settings, Loader2, Maximize2, Minimize2, PanelRightClose, PanelRightOpen 
, AlertCircle } from "lucide-react";
import type { Document } from "@/types";

export interface VaultAnalysis {
  summary: {
    totalContracts: number;
    activeValue: string;
    criticalRisks: number;
    totalObligations: number;
  };
  exposure: any[];
  obligations: any[];
  conflicts: any[];
  gaps: any[];
  cascades: any[];
}

interface VaultClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  initialDocuments: Document[];
}

export default function VaultClient({  initialDocuments , isLoading, error, onRetry }: VaultClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<"overview" | "obligations" | "conflicts" | "gaps" | "whatif">("overview");
  const [selectedContracts, setSelectedContracts] = useState<string[]>(initialDocuments.map(d => d.id));
  const [vaultData, setVaultData] = useState<VaultAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "high-risk">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Initial Data Fetch
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (initialDocuments.length === 0) {
        setIsAnalyzing(false);
        return;
      }
      
      setIsAnalyzing(true);
      try {
        const response = await fetch("/api/vault/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentIds: selectedContracts }) });

        if (response.ok) {
          const data = await response.json();
          setVaultData(data);
        } else {
          // Mock data for UI layout demonstration if API is missing
          setVaultData({
            summary: {
              totalContracts: 14,
              activeValue: "₹4.2M",
              criticalRisks: 3,
              totalObligations: 28
            },
            exposure: [],
            obligations: [],
            conflicts: [],
            gaps: [],
            cascades: []
          });
        }
      } catch {
        // Silently handled
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchAnalysis();
  }, [initialDocuments, selectedContracts]);

  const toggleContractSelection = (id: string) => {
    setSelectedContracts((prev) => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredDocs = initialDocuments.filter((doc) => {
    if (searchQuery && !doc.original_filename?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Basic filter mocked
    if (filter === "high-risk") return Math.random() > 0.7; // Mock condition
    return true;
  });

  
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-800 font-sans">
      <Navbar />

      <main role="main" className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-80 flex-shrink-0 bg-white dark:bg-card border-r border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden shadow-sm dark:shadow-slate-900/20 z-10 transition-all duration-300">
          <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Contract Vault
            </h2>
            
            <div className="flex gap-2">
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm dark:shadow-slate-900/20 rounded-xl py-5 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Add Contract
              </Button>
              <Button aria-label="Vault settings" variant="outline" size="icon" className="w-12 h-auto rounded-xl border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 text-slate-400 p-0">
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search contracts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium shadow-none focus-visible:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-50 shrink-0">
            {["all", "active", "expired", "high-risk"].map((f) => (
              <Badge 
                key={f} 
                variant="outline"
                className={`cursor-pointer px-3 py-1 font-bold rounded-lg border text-xs capitalize whitespace-nowrap transition-colors ${ filter === f ? "bg-slate-900 border-slate-900 text-white shadow-sm dark:shadow-slate-900/20" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800" }`}
                onClick={() => setFilter(f as any)}
              >
                {f.replace("-", " ")}
              </Badge>
            ))}
          </div>

          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-2 pb-4">
              {filteredDocs.map((doc) => {
                const isSelected = selectedContracts.includes(doc.id);
                // Mock random risk
                const risk = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
                const riskColor = risk === 'high' ? 'bg-red-500' : risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
                
                return (
                  <div 
                    key={doc.id}
                    onClick={() => toggleContractSelection(doc.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${ isSelected ? "border-indigo-500 bg-indigo-50 shadow-sm dark:shadow-slate-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-card hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" }`}
                  >
                    <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center shrink-0 ${ isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-slate-400" }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-[1px] bg-white dark:bg-slate-900"/>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-800 dark:text-slate-200"}`}>
                        {doc.original_filename || "Untitled Document"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 truncate">
                          {doc.document_type}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                       <span className={`w-2 h-2 rounded-full ${riskColor} shadow-sm dark:shadow-slate-900/20`} title={`${risk} risk`} />
                    </div>
                  </div>
                );
              })}

              {filteredDocs.length === 0 && (
                <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No contracts found</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto shrink-0 space-y-2">
            <div className="flex justify-between items-center">
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Storage</span>
               <span className="text-xs font-bold text-slate-700">65%</span>
            </div>
            <Progress value={65} className="h-1.5 bg-slate-200 [&>div]:bg-indigo-500" />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">1.2 GB of 2 GB used</p>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden h-full">
          {/* Main Topbar */}
          <div className="px-4 md:px-6 py-4 bg-white dark:bg-card border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm dark:shadow-slate-900/20 z-10 sticky top-0 shrink-0">
             <div>
                <h1 className="text-lg md:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Cross-Contract Intelligence</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                   Analyzing <span className="font-bold text-indigo-600">{selectedContracts.length}</span> selected contracts
                </p>
             </div>
             <div>
                <Button 
                   onClick={() => {
                     setShowWhatIf(true);
                     setActiveTab("whatif");
                   }}
                   className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-md px-4 md:px-6 flex gap-2"
                >
                  What-If Scenario
                  <PanelRightOpen className="w-4 h-4 ml-1" />
                </Button>
             </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="flex-1 overflow-auto relative">
            {isAnalyzing && selectedContracts.length > 0 ? (
              <div className="p-6 h-full flex items-center justify-center">
                 <VaultLoading />
              </div>
            ) : selectedContracts.length === 0 ? (
              <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100 shadow-sm dark:shadow-slate-900/20">
                    <FileText className="w-10 h-10 text-indigo-300" />
                 </div>
                 <h2 className="text-xl font-black text-slate-700 mb-2">Select contracts to analyze</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Choose one or more contracts from the sidebar to visualize risks, conflicts, and exposures across your entire portfolio.</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full h-full flex flex-col px-4 md:px-6 py-2">
                <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-md pt-2 pb-4 -mx-6 px-4 md:px-6">
                  <TabsList className="h-12 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 p-1 w-full max-w-[600px] shadow-sm dark:shadow-slate-900/20 rounded-xl grid grid-cols-5">
                    <TabsTrigger value="overview" className="rounded-lg font-bold text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Overview</TabsTrigger>
                    <TabsTrigger value="obligations" className="rounded-lg font-bold text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">Obligations</TabsTrigger>
                    <TabsTrigger value="conflicts" className="rounded-lg font-bold text-xs data-[state=active]:bg-red-50 data-[state=active]:text-red-700">Conflicts</TabsTrigger>
                    <TabsTrigger value="gaps" className="rounded-lg font-bold text-xs data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Gaps</TabsTrigger>
                    <TabsTrigger value="whatif" className="rounded-lg font-bold text-xs data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">What-If</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto pb-8 min-h-0 relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                      className="h-full space-y-8"
                    >
                      <TabsContent value="overview" className="mt-0 outline-none  h-full flex flex-col gap-6">
                        <VaultSummaryCard stats={vaultData?.summary as any} />
                        
                        <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-2 gap-6 w-full">
                          <Card className="p-6 rounded-2xl shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700">
                             <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4">Financial Exposure Stack</h3>
                             <div className="h-[300px] w-full">
                               {/* @ts-ignore */}
                               <ExposureDashboard data={vaultData?.exposure as any} />
                             </div>
                          </Card>
                          
                          <Card className="p-6 rounded-2xl shadow-sm dark:shadow-slate-900/20 border-slate-200 dark:border-slate-700 flex flex-col">
                             <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                               Critical Cross-Conflicts
                               <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">3 Critical</Badge>
                             </h3>
                             <div className="flex-1 overflow-auto -my-2 py-2">
                               {vaultData ? (
                                  <ConflictList conflicts={vaultData?.conflicts as any} />
                               ) : null}
                             </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="obligations" className="mt-0 outline-none h-full bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 p-6">
                         <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-6">Upcoming Obligations Timeline</h3>
                         <ObligationsList obligations={vaultData?.obligations as any} />
                      </TabsContent>

                      <TabsContent value="conflicts" className="mt-0 outline-none h-full bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 p-6">
                         <div className="flex items-center justify-between mb-6">
                           <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Contractual Contradictions</h3>
                           <div className="flex gap-2">
                              <Badge className="bg-red-50 text-red-700 px-3 py-1 font-bold rounded-lg border-red-200">Critical (3)</Badge>
                              <Badge className="bg-amber-50 text-amber-700 px-3 py-1 font-bold rounded-lg border-amber-200">Warnings (5)</Badge>
                           </div>
                         </div>
                         <ConflictList conflicts={vaultData?.conflicts as any} />
                      </TabsContent>

                      <TabsContent value="gaps" className="mt-0 outline-none h-full bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 p-6">
                         <div className="max-w-3xl">
                           <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Coverage Gaps Detected</h3>
                           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">Clauses missing across your portfolio that leave you exposed to liability.</p>
                           <GapsList gaps={vaultData?.gaps as any} />
                         </div>
                      </TabsContent>
                      
                      <TabsContent value="whatif" className="mt-0 outline-none h-full relative p-0 m-0">
                         {/* Rendered below inside AnimatePresence for right panel slide, or directly here */}
                         <div className="bg-white dark:bg-card rounded-2xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 h-full overflow-hidden flex flex-col">
                            <WhatIfPanel 
                               existingResults={vaultData?.cascades as any} 
                               documentIds={selectedContracts}
                            />
                         </div>
                      </TabsContent>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trophy,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Share2,
  FileText,
  Upload,
  Plus,
  Info
, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ComparisonCardModal } from "@/components/compare/comparison-card-modal";
import type { Document } from "@/types";
import type { ComparisonResult } from "@/lib/bot/compare-analyzer";

const GaugeChart = ({ score, color }: { score: number, color: string }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  return (
    <div className="relative w-full h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            stroke="none"
            cornerRadius={4}
          >
            <Cell fill={color} />
            <Cell fill="#f1f5f9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-0 left-0 right-0 text-center pb-2">
         <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100">{score}</span>
         <span className="text-sm font-bold text-slate-400">/100</span>
      </div>
    </div>
  );
};

export default function ComparePage({ isLoading, error, onRetry }: any) {
  const supabase = createClient();
  const [contractA, setContractA] = useState<Document | null>(null);
  const [contractB, setContractB] = useState<Document | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [showShareCard, setShowShareCard] = useState(false);

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

  useEffect(() => {
    const fetchDocs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("analysis_status", "completed")
        .order("created_at", { ascending: false });
      if (data) setUserDocuments(data as Document[]);
    };
    fetchDocs();
  }, [supabase]);

  const handleCompare = async () => {
    if (!contractA || !contractB) {
      toast.error("Please select two contracts to compare");
      return;
    }

    setIsComparing(true);
    setComparisonResult(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIdA: contractA.id, documentIdB: contractB.id }) });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Comparison failed");
      }

      const data = await response.json();
      setComparisonResult(data);
      toast.success("Analysis complete");
    } catch (error) {
       toast.error((error as Error).message || "Comparison failed. Please try again.");
    } finally {
      setIsComparing(false);
    }
  };

  const toggleClause = (index: number) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedClauses(newExpanded);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "safe": return "text-emerald-500 bg-emerald-50 border-emerald-200";
      case "warning": return "text-amber-500 bg-amber-50 border-amber-200";
      case "dangerous": return "text-rose-500 bg-rose-50 border-rose-200";
      case "illegal": return "text-indigo-600 bg-indigo-50 border-indigo-200";
      default: return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };
  
  const getHexColor = (score: number) => {
    if (score >= 80) return "#e11d48"; // rose-600
    if (score >= 60) return "#ea580c"; // orange-600
    if (score >= 30) return "#d97706"; // amber-600
    return "#059669"; // emerald-600
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-6">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black text-slate-900 dark:text-slate-100 tracking-tight">Contract Comparison</h1>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
             Load two analyzed documents to view a side-by-side algorithmic risk breakdown. Discover which agreement offers stronger localized protection.
          </p>
        </div>

        {/* Input Selection */}
        {!comparisonResult && (
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                 <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-sm dark:shadow-slate-900/20 z-10 text-slate-400 font-black">
                    VS
                 </div>

                 {/* Drop A */}
                 <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20 p-6 flex flex-col h-[280px]">
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="bg-indigo-100 text-indigo-700 px-2 rounded text-xs">A</span> Baseline Contract
                    </h3>
                    <Select onValueChange={(val) => setContractA(userDocuments.find(d => d.id === val) || null)}>
                       <SelectTrigger className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl font-bold shadow-inner mb-4">
                          <SelectValue placeholder="Select analyzed document..." />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                          {userDocuments.map(doc => (
                             <SelectItem key={doc.id} value={doc.id}>{doc.original_filename || "Untitled Document"}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                    
                    {contractA ? (
                       <div className="flex-1 flex flex-col items-center justify-center bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 shrink-0">
                          <FileText className="w-8 h-8 text-indigo-400 mb-2" />
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-center line-clamp-1">{contractA.original_filename || "Untitled"}</p>
                          <Badge variant="outline" className="mt-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold tracking-widest">{contractA.document_type || 'Unknown Type'}</Badge>
                       </div>
                    ) : (
                       <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 shrink-0 opacity-70">
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Awaiting selection</p>
                       </div>
                    )}
                 </Card>

                 {/* Drop B */}
                 <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20 p-6 flex flex-col h-[280px]">
                    <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="bg-emerald-100 text-emerald-700 px-2 rounded text-xs">B</span> Challenger Contract
                    </h3>
                    <Select onValueChange={(val) => setContractB(userDocuments.find(d => d.id === val) || null)}>
                       <SelectTrigger className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-emerald-500 rounded-xl font-bold shadow-inner mb-4">
                          <SelectValue placeholder="Select analyzed document..." />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                          {userDocuments.map(doc => (
                             <SelectItem key={doc.id} value={doc.id}>{doc.original_filename || "Untitled Document"}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                    
                    {contractB ? (
                       <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4 shrink-0">
                          <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-center line-clamp-1">{contractB.original_filename || "Untitled"}</p>
                          <Badge variant="outline" className="mt-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold tracking-widest">{contractB.document_type || 'Unknown Type'}</Badge>
                       </div>
                    ) : (
                       <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 shrink-0 opacity-70">
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Awaiting selection</p>
                       </div>
                    )}
                 </Card>
              </div>
              
              <div className="flex justify-center flex-col sm:flex-row gap-4">
                 <Button 
                   onClick={handleCompare}
                   disabled={isComparing || !contractA || !contractB}
                   className="h-14 bg-slate-900 hover:bg-slate-800 text-white font-black tracking-widest uppercase transition-all shadow-md text-sm rounded-2xl px-12"
                 >
                   {isComparing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowLeftRight className="w-5 h-5 mr-2" />}
                   {isComparing ? "Running Analysis..." : "Algorithmic Compare"}
                 </Button>
                 <Button variant="outline" className="h-14 font-bold rounded-2xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-4 md:px-4 md:px-6 lg:px-8 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20">
                    <Plus className="w-4 h-4 mr-2" /> Upload New
                 </Button>
              </div>
           </div>
        )}

        {/* Results Block */}
        {comparisonResult && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
               
               {/* Verdict */}
               <Card className={cn(
                  "border rounded-3xl shadow-sm p-8 text-center transition-colors",
                  comparisonResult.winner === "A" ? "bg-indigo-50 border-indigo-200" : 
                  comparisonResult.winner === "B" ? "bg-emerald-50 border-emerald-200" : 
                  "bg-amber-50 border-amber-200"
               )}>
                  <Trophy className={cn("w-12 h-12 mx-auto mb-4", 
                    comparisonResult.winner === "A" ? "text-indigo-600" : 
                    comparisonResult.winner === "B" ? "text-emerald-600" : "text-amber-500"
                  )} />
                  <h2 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">
                     {comparisonResult.winner === "A" ? "Contract A is structurally safer." : 
                      comparisonResult.winner === "B" ? "Contract B is structurally safer." : "Both contracts carry equivalent risk profiles."}
                  </h2>
                  <p className="font-medium text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{comparisonResult.verdict}</p>
               </Card>

               {/* Gauges Side-by-Side */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                 <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 border border-slate-800 rounded-full items-center justify-center shadow-lg z-10 text-white font-black">
                    VS
                 </div>
                 
                 {/* Gauge A */}
                 <Card className={cn("bg-white border rounded-3xl shadow-sm p-6", comparisonResult.winner === "A" ? "ring-2 ring-indigo-500 border-indigo-500" : "border-slate-200")}>
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest"><span className="bg-indigo-100 text-indigo-700 px-2 rounded text-xs mr-2">A</span> Baseline</h3>
                          <p className="font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">{comparisonResult.label_a}</p>
                       </div>
                       {comparisonResult.winner === "A" && <Badge className="bg-indigo-600 text-white shadow-sm dark:shadow-slate-900/20 gap-1 uppercase tracking-widest text-[9px]"><CheckCircle2 className="w-3 h-3" /> Winner</Badge>}
                    </div>
                    <GaugeChart score={comparisonResult.score_a} color={getHexColor(comparisonResult.score_a)} />
                 </Card>

                 {/* Gauge B */}
                 <Card className={cn("bg-white border rounded-3xl shadow-sm p-6", comparisonResult.winner === "B" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200")}>
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest"><span className="bg-emerald-100 text-emerald-700 px-2 rounded text-xs mr-2">B</span> Challenger</h3>
                          <p className="font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">{comparisonResult.label_b}</p>
                       </div>
                       {comparisonResult.winner === "B" && <Badge className="bg-emerald-600 text-white shadow-sm dark:shadow-slate-900/20 gap-1 uppercase tracking-widest text-[9px]"><CheckCircle2 className="w-3 h-3" /> Winner</Badge>}
                    </div>
                    <GaugeChart score={comparisonResult.score_b} color={getHexColor(comparisonResult.score_b)} />
                 </Card>
               </div>

               {/* Key Differences Summary */}
               {comparisonResult.key_differences.length > 0 && (
                 <Card className="bg-slate-900 border-slate-800 rounded-3xl shadow-lg p-6 lg:p-4 md:p-6 lg:p-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                       <AlertTriangle className="w-5 h-5 text-amber-500" /> Executive Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {comparisonResult.key_differences.map((diff, i) => (
                         <div key={i} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                            <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                            <p className="text-sm font-medium text-slate-300 leading-relaxed">{diff}</p>
                         </div>
                       ))}
                    </div>
                 </Card>
               )}

               {/* Clause by clause table */}
               <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20 overflow-hidden">
                  <div className="p-6 lg:p-4 md:p-6 lg:p-8 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50">
                     <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                        <Scale className="w-4 h-4 text-indigo-600" /> Clause-by-Clause Matrix
                     </h3>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    <ScrollArea className="w-full">
                      <div className="min-w-[800px] w-full">
                         {/* Header Row */}
                         <div className="grid grid-cols-12 gap-4 p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border-b border-slate-100">
                            <div className="col-span-3">Clause Category</div>
                            <div className="col-span-1 text-center">Winner</div>
                            <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-slate-700">Contract A Definition</div>
                            <div className="col-span-4 pl-4 border-l border-slate-200 dark:border-slate-700">Contract B Definition</div>
                         </div>
                         
                         {/* Body */}
                         {comparisonResult.clause_comparisons.map((comp, i) => (
                           <div key={i} className="group relative">
                             <div 
                               className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
                               onClick={() => toggleClause(i)}
                             >
                                <div className="col-span-3 font-bold text-slate-900 dark:text-slate-100 capitalize text-sm flex items-center justify-between">
                                   {comp.clause_type.replace(/_/g, " ")}
                                   {expandedClauses.has(i) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                   <Badge className={cn("text-[9px] uppercase tracking-widest font-black shadow-none", 
                                      comp.winner === "A" ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100" :
                                      comp.winner === "B" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                      "bg-slate-100 text-slate-500 hover:bg-slate-100"
                                   )}>
                                      {comp.winner === "A" ? "A" : comp.winner === "B" ? "B" : "TIE"}
                                   </Badge>
                                </div>
                                <div className="col-span-4 pl-4 border-l border-slate-100 flex items-center gap-2">
                                   <Badge variant="outline" className={cn("text-[9px] uppercase shadow-none", getRiskColor(comp.contract_a.risk_level))}>
                                     {comp.contract_a.risk_level}
                                   </Badge>
                                   <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-1" title={comp.contract_a.value}>{comp.contract_a.value}</p>
                                </div>
                                <div className="col-span-4 pl-4 border-l border-slate-100 flex items-center gap-2">
                                   <Badge variant="outline" className={cn("text-[9px] uppercase shadow-none", getRiskColor(comp.contract_b.risk_level))}>
                                     {comp.contract_b.risk_level}
                                   </Badge>
                                   <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-1" title={comp.contract_b.value}>{comp.contract_b.value}</p>
                                </div>
                             </div>

                             {expandedClauses.has(i) && (
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 inset-x-0">
                                   <div className="p-4 bg-white dark:bg-card border border-indigo-100 rounded-2xl shadow-sm dark:shadow-slate-900/20 relative">
                                      <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500 rounded-t-2xl" />
                                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                                        <Info className="w-4 h-4 text-indigo-600" /> Contextual Analysis
                                      </p>
                                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{comp.explanation}</p>
                                   </div>
                                </div>
                             )}
                           </div>
                         ))}
                      </div>
                    </ScrollArea>
                  </div>
               </Card>

               <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" className="h-12 bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl px-4 md:px-6 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-slate-900/20" onClick={() => {
                     setComparisonResult(null);
                     setContractA(null);
                     setContractB(null);
                  }}>
                     <ArrowLeftRight className="w-4 h-4 mr-2" /> Compare New Files
                  </Button>
                  <Button className="h-12 bg-indigo-600 text-white font-bold rounded-xl px-4 md:px-6 hover:bg-indigo-700 shadow-sm dark:shadow-slate-900/20">
                     <Share2 className="w-4 h-4 mr-2" /> Export Report
                  </Button>
               </div>
            </motion.div>
          </AnimatePresence>
        )}

      </main>
      <Footer />
    </div>
  );
}
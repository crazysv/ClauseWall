"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitMerge,
  ArrowRight,
  Eye,
  AlertTriangle,
  PlayCircle,
  Clock,
  LayoutGrid,
  Loader2,
  Skull,
  ShieldAlert,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { StateGraph } from "@/components/statemachine/state-graph";
import { TrapStateCard } from "@/components/statemachine/trap-state-card";
import { TimelineSlider } from "@/components/statemachine/timeline-slider";
import { ReportCard } from "@/components/statemachine/report-card";

import type { Document } from "@/types";
import type { StateMachineReport, ContractState } from "@/lib/statemachine/types";

interface StateMachineClientProps {
  isLoading?: boolean;
  
  onRetry?: () => void;

  document: Document;
  initialData: StateMachineReport | null; // from Server JSON

  error?: string;
}

export default function StateMachineClient({  document, initialData , isLoading, onRetry, error }: StateMachineClientProps) {
  const [report, setReport] = useState<StateMachineReport | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [extracting, setExtracting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Top Level Stitch Toggles
  const [activeView, setActiveView] = useState<"graph" | "timeline" | "table">("graph");
  const [selectedState, setSelectedState] = useState<ContractState | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);
  const [showTrapPanel, setShowTrapPanel] = useState(true);

  // Simulator
  const [simulateFromState, setSimulateFromState] = useState<string>("");
  const [simulateAction, setSimulateAction] = useState<string>("");
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Fallback Extraction Hook
  const handleExtract = async () => {
    setExtracting(true);
    setLocalError(null);
    try {
      const res = await fetch("/api/statemachine/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: document.id }) });
      const data = await res.json();
      if (data.success && data.report) {
         setReport(data.report);
      } else {
         setLocalError(data.localError || "Extraction logic failed. Please try again.");
      }
    } catch {
       setLocalError("Algorithmic structural extraction failed.");
    } finally {
       setLoading(false);
       setExtracting(false);
    }
  };

  if (!report && !loading && !extracting) {
     
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col font-sans">
           <Navbar />
           <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-indigo-100/50 rounded-3xl flex items-center justify-center p-4 ring-1 ring-indigo-200">
                 <GitMerge className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Contract State Unmapped</h2>
              <p className="font-medium text-slate-500 dark:text-slate-400 max-w-md text-center">ClauseWall needs to algorithmically traverse this document to extract dynamic outcomes, loopholes, and trap conditions.</p>
              <Button onClick={handleExtract} className="bg-indigo-600 hover:bg-indigo-700 h-14 px-4 md:px-4 md:px-6 lg:px-8 rounded-2xl shadow-indigo-600/20 shadow-lg text-white font-black uppercase tracking-widest text-sm mt-4">
                 Extract State Machine Topology
              </Button>
           </div>
        </div>
     );
  }

  if (extracting || loading) {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-col space-y-6">
           <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
           <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 animate-pulse">Navigating Topological State...</h3>
        </div>
     );
  }

  if (!report) return null;

  const handleSimulate = async () => {
     if (!simulateFromState || !simulateAction) return;
     setSimulating(true);
     // Note: Stitch specs call for an api to calculate this, relying here on pseudo-simulation locally if we don't have the API logic mapped
     setTimeout(() => {
        const fromState = report.stateMachine.states.find((s: ContractState) => s.id === simulateFromState);
        const transition = report.stateMachine.transitions.find((t: any) => t.fromStateId === simulateFromState && t.trigger === simulateAction);
        if (transition) {
           const dest = report.stateMachine.states.find((s: ContractState) => s.id === transition.toStateId);
           setSimulationResult({ success: true, from: fromState, transition, destination: dest });
        } else {
           setSimulationResult({ success: false, localError: "Path disconnected or invalid." });
        }
        setSimulating(false);
     }, 600);
  };

  const getRiskColor = (level: string) => {
     switch (level) {
        case "safe": return "text-emerald-500 bg-emerald-50 border-emerald-200";
        case "warning": return "text-amber-500 bg-amber-50 border-amber-200";
        case "dangerous": return "text-rose-500 bg-rose-50 border-rose-200";
        case "illegal": return "text-indigo-600 bg-indigo-50 border-indigo-200";
        default: return "bg-slate-50 text-slate-500 border-slate-200";
     }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans flex flex-col">
       <Navbar />

       {/* Top Document Header matched to Light Theme */}
       <div className="bg-white dark:bg-card border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-sm dark:shadow-slate-900/20 overflow-hidden text-clip">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
             <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                   <GitMerge className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="min-w-0">
                   <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 truncate pr-4">{document.original_filename}</h1>
                   <div className="flex items-center gap-2 mt-1 whitespace-nowrap overflow-x-auto no-scrollbar">
                      <Badge variant="outline" className="uppercase tracking-widest text-[9px] font-bold border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-none text-slate-500 dark:text-slate-400">{document.document_type}</Badge>
                      <span className="text-slate-300">•</span>
                      <Badge className={cn("uppercase tracking-widest text-[9px] font-bold shadow-none", getRiskColor(document.overall_risk_score > 60 ? "dangerous" : document.overall_risk_score > 30 ? "warning" : "safe"))}>
                         Topology Score: {document.overall_risk_score}
                      </Badge>
                   </div>
                </div>
             </div>

             {/* View Toggle */}
             <div className="hidden md:block">
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-[300px]">
                   <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800/50 p-1 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <TabsTrigger value="graph" className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 data-[state=active]:text-indigo-600">Graph</TabsTrigger>
                      <TabsTrigger value="timeline" className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 data-[state=active]:text-indigo-600">Timeline</TabsTrigger>
                      <TabsTrigger value="table" className="rounded-lg text-xs font-bold data-[state=active]:bg-white dark:bg-card data-[state=active]:shadow-sm dark:shadow-slate-900/20 data-[state=active]:text-indigo-600">Report</TabsTrigger>
                   </TabsList>
                </Tabs>
             </div>
             
             {/* Mobile Sidebar Toggle */}
             <Button variant="outline" className="md:hidden w-10 h-10 p-0 border-slate-200 dark:border-slate-700 rounded-xl" onClick={() => setShowTrapPanel(!showTrapPanel)}>
                {showTrapPanel ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
             </Button>
          </div>
       </div>

       <main role="main" className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden">
          
          {/* Main Visualizer Area */}
          <div className="flex-1 h-full relative p-4 flex flex-col min-w-0">
             
             <AnimatePresence mode="wait">
                {activeView === "graph" && (
                   <motion.div key="graph" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 overflow-hidden relative">
                      <StateGraph 
                        stateMachine={report.stateMachine} 
                        report={report} 
                        mode="explore" 
                        onStateClick={setSelectedState as any} 
                        className="w-full h-full" 
                      />
                      {/* Internal Minimap or Labels handled by StateGraph module. */}
                   </motion.div>
                )}

                {activeView === "timeline" && (
                   <motion.div key="timeline" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full p-4 overflow-y-auto">
                      <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-3xl p-4 md:p-6 lg:p-8">
                         <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-500" /> Chronological Timeline Flow</h2>
                         <TimelineSlider 
                            events={report.timelineEvents || []} 
                            totalMonths={Math.max(12, ...(report.timelineEvents?.map(e => e.month) || [0]))} 
                            stateMachine={report.stateMachine} 
                         />
                      </Card>
                   </motion.div>
                )}

                {activeView === "table" && (
                   <motion.div key="table" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full overflow-y-auto pr-4">
                      <ReportCard report={report} onExplore={() => setActiveView("graph")} documentId={document.id} />
                   </motion.div>
                )}
             </AnimatePresence>

          </div>

          {/* Right Sidebar: Traps, Paths, and Simulation */}
          <AnimatePresence>
             {showTrapPanel && (
                <motion.div 
                   initial={{ x: 300, opacity: 0 }} 
                   animate={{ x: 0, opacity: 1 }} 
                   exit={{ x: 300, opacity: 0 }}
                   className="w-full md:w-[400px] shrink-0 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col h-full overflow-y-auto custom-scrollbar"
                >
                   <div className="p-6 space-y-8">
                      
                      {/* Trap States Segment */}
                      <section className="space-y-4">
                         <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                               <Skull className="w-4 h-4" /> Detected Traps
                            </h3>
                            <Badge className="bg-rose-100 text-rose-700 shadow-none border-none">{report.trapAnalysis.length}</Badge>
                         </div>
                         <div className="space-y-3">
                            {report.trapAnalysis.map((trap: any) => (
                               <TrapStateCard key={trap.stateId} trap={trap} stateMachine={report.stateMachine} documentId={document.id} />
                            ))}
                         </div>
                      </section>

                      <Separator className="bg-slate-200" />

                      {/* Path Highlighting / Common Routes */}
                      <section className="space-y-4">
                         <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-indigo-500" /> Common Execution Paths
                         </h3>
                         <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant={highlightedPath === "happy" ? "default" : "outline"} 
                              className={cn("h-10 rounded-xl text-xs font-bold", highlightedPath === "happy" ? "bg-emerald-600 text-white" : "bg-white border-slate-200 text-slate-600")}
                              onClick={() => setHighlightedPath(highlightedPath === "happy" ? null : "happy")}
                            >
                               <CheckCircle2 className="w-3 h-3 mr-1" /> Happy Path
                            </Button>
                            <Button 
                              variant={highlightedPath === "danger" ? "default" : "outline"} 
                              className={cn("h-10 rounded-xl text-xs font-bold", highlightedPath === "danger" ? "bg-rose-600 text-white" : "bg-white border-slate-200 text-slate-600")}
                              onClick={() => setHighlightedPath(highlightedPath === "danger" ? null : "danger")}
                            >
                               <ShieldAlert className="w-3 h-3 mr-1" /> Danger Route
                            </Button>
                         </div>
                      </section>

                      <Separator className="bg-slate-200" />

                      {/* Sandbox Simulator */}
                      <section className="space-y-4">
                         <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" /> Simulate Execution
                         </h3>
                         <Card className="bg-white dark:bg-card border-indigo-100 shadow-sm dark:shadow-slate-900/20 rounded-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                            <CardContent className="p-5 space-y-4 relative pl-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-400">Current Node State</label>
                                  <Select value={simulateFromState} onValueChange={setSimulateFromState}>
                                     <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium text-xs h-10 rounded-xl">
                                        <SelectValue placeholder="Select initial state..." />
                                     </SelectTrigger>
                                     <SelectContent>
                                        {report.stateMachine.states.map((s: ContractState) => (
                                           <SelectItem key={s.id} value={s.id}>{s.name} ({s.type})</SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>

                               <div className="space-y-2">
                                  <label className="text-[10px] uppercase font-bold text-slate-400">Trigger Action</label>
                                  <Select value={simulateAction} onValueChange={setSimulateAction} disabled={!simulateFromState}>
                                     <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium text-xs h-10 rounded-xl">
                                        <SelectValue placeholder="Select edge condition..." />
                                     </SelectTrigger>
                                     <SelectContent>
                                        {report.stateMachine.transitions
                                          .filter((t: any) => t.fromStateId === simulateFromState)
                                          .map((t: any, idx: number) => (
                                           <SelectItem key={idx} value={t.trigger}>{t.trigger}</SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>

                               <Button 
                                 onClick={handleSimulate} 
                                 disabled={!simulateFromState || !simulateAction || simulating} 
                                 className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-xl shadow-sm dark:shadow-slate-900/20"
                               >
                                  {simulating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />} Execute Loop
                               </Button>

                               {/* Results Output */}
                               {simulationResult && (
                                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100">
                                     {simulationResult.success ? (
                                        <div className="space-y-2">
                                           <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Execution Result</p>
                                           <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                              Triggering <strong className="text-slate-900 dark:text-slate-100">"{simulationResult.transition.condition}"</strong> moves the contract to <span className={cn("px-1.5 py-0.5 rounded font-bold ml-1", getRiskColor(simulationResult.destination.risk_level))}>{simulationResult.destination.name}</span>.
                                           </p>
                                           {simulationResult.destination.financial_impact && (
                                              <p className="text-xs font-bold text-rose-600 mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">
                                                 Financial Change: {simulationResult.destination.financial_impact}
                                              </p>
                                           )}
                                        </div>
                                     ) : (
                                        <p className="text-xs font-medium text-rose-600">{simulationResult.localError}</p>
                                     )}
                                  </motion.div>
                               )}

                            </CardContent>
                         </Card>
                      </section>

                   </div>
                </motion.div>
             )}
          </AnimatePresence>
       </main>
    </div>
  );
}

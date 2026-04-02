"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion";
import { ArrowLeft, AlertTriangle, FileText, CheckCircle2, ShieldAlert, Zap, Layers, RefreshCw, BarChart2, Share2, Award, ArrowUpRight , AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { Document, Clause } from "@/types";
import type { BattleData, BattleScores, ClauseComparison, ScoreComparison } from "@/lib/battle/types";

// Recharts for gauges
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface BattleClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  document: Document;
  clauses: Clause[];
  initialBattleData: BattleData | null;
  initialBattleScores: BattleScores | null;
  selectedScope: "state" | "india" | null;
}

export default function BattleClient({ 
  document,
  clauses,
  initialBattleData,
  initialBattleScores,
  selectedScope, isLoading, error, onRetry }: BattleClientProps) {
  const [battleData] = useState<BattleData | null>(initialBattleData);
  const [battleScores] = useState<BattleScores | null>(initialBattleScores);
  const [revealedRounds, setRevealedRounds] = useState(0);
  const [showFinalVerdict, setShowFinalVerdict] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const prefersReducedMotion = useReducedMotion();
  const activeData = battleData || battleScores;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }
    }
  };
  
  // Create logical rounds from the unstructured Clause comparisons
  // Round 1: Financial & Payments 
  // Round 2: Termination & Exit
  // Round 3: Obligations & Rights
  // Round 4: Legal & Compliance
  // Round 5: Unknown / Traps
  const ROUNDS = [
    { id: "financial", title: "Financial Terms", criteria: ["rent", "security_deposit", "penalty", "late_payment", "salary"] },
    { id: "exit", title: "Termination & Exit", criteria: ["notice_period", "lock_in", "termination"] },
    { id: "rights", title: "Rights & Obligations", criteria: ["maintenance", "subletting", "non_compete", "non_solicitation"] },
    { id: "legal", title: "Legal Compliance", criteria: ["indemnity", "liability", "arbitration", "governing_law"] },
    { id: "hidden", title: "Hidden Traps", criteria: [] } // Fallback for the rest
  ];

  const comparisons = activeData && "comparisons" in activeData 
    ? (activeData as BattleData).comparisons 
    : (activeData as unknown as BattleScores)?.scoreComparisons || [];

  const roundData = ROUNDS.map(round => {
    let matches;
    if (round.criteria.length > 0) {
       matches = comparisons.filter(c => round.criteria.some(term => c.clauseType.includes(term)));
    } else {
       matches = comparisons.filter(c => !ROUNDS.slice(0, 4).some(r => r.criteria.some(term => c.clauseType.includes(term))));
    }
    
    // Determine winner based on risk/severity (critical/worse means we lose to Market Standard)
    const fails = matches.filter(c => c.severity === "critical" || c.severity === "worse").length;
    const wins = matches.filter(c => c.severity === "better" || c.severity === "average").length;
    const winner = fails > wins ? "market" : wins > fails ? "user" : "tie";

    return { ...round, items: matches, winner, fails, wins };
  });

  const nextAction = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setTimeout(() => setRevealedRounds(1), 500);
      return;
    }
    if (revealedRounds < 5) {
      setRevealedRounds(prev => prev + 1);
    } else {
      setShowFinalVerdict(true);
    }
  };

  const skipToVerdict = () => {
     setGameStarted(true);
     setRevealedRounds(5);
     setTimeout(() => setShowFinalVerdict(true), 400);
  };

  if (!selectedScope) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center px-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white">Not Enough Combattants</h2>
          <p className="text-slate-400 max-w-lg">We need at least 10 analyzed contracts of this type in your jurisdiction to establish a fair Market Standard battle arena.</p>
          <Link href={`/results/${document.id}`}><Button variant="outline" className="mt-4 border-slate-800 text-slate-300">Return to Results</Button></Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden">
      <Navbar />

      <main role="main" className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-10 relative">
        
        {/* Absolute Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-500/10 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-purple-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <Link href={`/results/${document.id}`} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Defense Base
          </Link>
          <Badge className="bg-slate-900 border-slate-800 text-purple-400 uppercase tracking-widest text-[10px] font-black px-3 py-1">
            Arena: {selectedScope?.toUpperCase()}
          </Badge>
        </div>

        {/* HERO BATTLE HEADERS */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center mb-16 relative z-10">
           
           {/* Your Contract Card */}
           <motion.div initial={{x:-50, opacity:0}} animate={{x:0, opacity:1}} className="bg-gradient-to-br from-slate-900 to-slate-900/40 p-1 rounded-3xl border border-slate-800 shadow-[0_0_50px_-20px_rgba(168,85,247,0.3)]">
              <div className="bg-slate-950 rounded-[22px] p-6 h-full flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-400 font-black text-xl">
                    <FileText className="w-8 h-8" />
                 </div>
                 <Badge variant="outline" className="border-purple-500/30 text-purple-400 font-bold mb-2">CHALLENGER</Badge>
                 <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white truncate w-full px-4">{document.original_filename}</h2>
                 <div className="mt-4 flex flex-col items-center">
                    <GaugeChart value={document.overall_risk_score} label="Your Overall Risk" />
                 </div>
              </div>
           </motion.div>

           {/* VS Badge */}
           <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring", delay:0.2}} className="flex justify-center shrink-0 my-4 md:my-0">
             <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.5)] border-4 border-slate-950 z-20">
                <span className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black italic tracking-tighter text-white">VS</span>
             </div>
           </motion.div>

           {/* Market Standard Card */}
           <motion.div initial={{x:50, opacity:0}} animate={{x:0, opacity:1}} className="bg-gradient-to-bl from-slate-900 to-slate-900/40 p-1 rounded-3xl border border-slate-800 shadow-[0_0_50px_-20px_rgba(239,68,68,0.3)]">
              <div className="bg-slate-950 rounded-[22px] p-6 h-full flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4 text-red-500">
                    <Layers className="w-8 h-8" />
                 </div>
                 <Badge variant="outline" className="border-slate-700 text-slate-400 font-bold mb-2">DEFENDING CHAMPION</Badge>
                 <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white truncate w-full px-4">Market Standard</h2>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-black text-red-500/50">Based on {activeData?.totalContractsAnalyzed || 0} Contracts</p>
                 <div className="mt-4 flex flex-col items-center">
                    <GaugeChart value={50} label="Standard Risk Base" highlightColor="#ef4444" />
                 </div>
              </div>
           </motion.div>

        </div>

        {/* BATTLE ROUNDS ARENA */}
        <div className="space-y-6 relative z-10 max-w-4xl mx-auto">
          {ROUNDS.map((round, idx) => {
             const roundActive = revealedRounds > idx;
             const isTied = roundData[idx].winner === "tie";
             const wonByChallenger = roundData[idx].winner === "user";
             const wonByMarket = roundData[idx].winner === "market";

             return (
               <div key={round.id} className="relative">
                  {/* Lock Screen */}
                  {!roundActive && (
                     <div className="absolute inset-0 z-20 rounded-2xl bg-slate-950/80 backdrop-blur-sm border border-slate-800/50 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 transition-opacity">
                        <Badge className="bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-800 uppercase tracking-widest font-black text-[10px]">Round {idx + 1}</Badge>
                        <h3 className="uppercase tracking-widest font-black text-xl text-slate-800 dark:text-slate-200 mt-2">{round.title}</h3>
                     </div>
                  )}

                  <motion.div
                     initial={{opacity:0, y:20}} 
                     animate={roundActive ? {opacity:1, y:0} : {opacity:0.3, y:10}}
                     transition={{duration:0.6, type:"spring"}}
                  >
                     <Card className={cn("bg-slate-900 border overflow-hidden", roundActive ? "border-slate-700 shadow-2xl" : "border-slate-800")}>
                        {/* Round Header */}
                        <div className={cn("px-6 py-4 flex items-center justify-between border-b", 
                           wonByChallenger ? "bg-purple-900/20 border-purple-800/50" : 
                           wonByMarket ? "bg-red-900/20 border-red-800/50" : "bg-slate-900 border-slate-800")}
                        >
                           <div className="flex items-center gap-4">
                              <Badge className="bg-slate-950 border-slate-800 text-slate-400">Round {idx + 1}</Badge>
                              <h3 className="font-black uppercase tracking-widest text-white">{round.title}</h3>
                           </div>
                           
                           {roundActive && (
                              <motion.div initial={{scale:0, rotate:-20}} animate={{scale:1, rotate:0}} transition={{type:"spring", bounce:0.6}}>
                                 {wonByChallenger && <Badge className="bg-purple-500 hover:bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border-none px-3 py-1 font-black"><Zap className="w-3 h-3 mr-1" /> YOU WIN</Badge>}
                                 {wonByMarket && <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] border-none px-3 py-1 font-black"><ShieldAlert className="w-3 h-3 mr-1" /> MARKET WINS</Badge>}
                                 {isTied && <Badge variant="outline" className="border-slate-700 text-slate-400 font-black">DRAW MATCH</Badge>}
                              </motion.div>
                           )}
                        </div>

                        {/* Round Body (Clause comparisons) */}
                        <CardContent className="p-6">
                           {roundData[idx].items.length === 0 ? (
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest py-4 text-center">No Terms Scanned for this Round</p>
                           ) : (
                              <motion.div 
                                 className="space-y-4"
                                 variants={containerVariants}
                                 initial="hidden"
                                 animate="visible"
                              >
                                 {roundData[idx].items.map((comp: any, cidx) => {
                                    const isWorse = comp.severity === "critical" || comp.severity === "worse";
                                    return (
                                       <motion.div key={cidx} variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 gap-4">
                                          <div className="min-w-[150px]">
                                             <p className="text-xs font-black uppercase tracking-widest text-slate-400">{comp.clauseLabel || comp.clauseType}</p>
                                          </div>
                                          
                                          {/* Mini VS Bar */}
                                          <div className="flex-1 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                             <div className="flex flex-col items-end">
                                                <span className={cn("text-xs font-bold mb-1", isWorse ? "text-red-500" : "text-purple-400")}>{comp.yourValue || comp.yourScore} {comp.yourUnit || ""}</span>
                                                <Progress value={(comp.yourValue || comp.yourScore)} max={100} className="h-2 w-full bg-slate-900" indicatorClassName={isWorse ? "bg-red-500" : "bg-purple-500"} />
                                             </div>
                                             <span className="text-[10px] font-black italic text-slate-600 dark:text-slate-400 shrink-0">VS</span>
                                             <div className="flex flex-col items-start">
                                                <span className="text-xs font-bold text-slate-400 mb-1">{comp.avgValue || comp.avgScore} {comp.avgUnit || ""}</span>
                                                <Progress value={(comp.avgValue || comp.avgScore)} max={100} className="h-2 w-full bg-slate-900" indicatorClassName="bg-slate-600" />
                                             </div>
                                          </div>

                                          <div className="min-w-[100px] text-right">
                                             <TooltipProvider>
                                                <Tooltip>
                                                   <TooltipTrigger>
                                                      <Badge variant="outline" className={cn("text-[10px] uppercase cursor-help", isWorse ? "border-red-500/30 text-red-400" : "border-green-500/30 text-green-400")}>
                                                         P{comp.percentile} {isWorse ? "HARSH" : "FAIR"}
                                                      </Badge>
                                                   </TooltipTrigger>
                                                   <TooltipContent className="bg-slate-900 border-slate-800 text-xs w-48 text-center px-4 py-2">
                                                      {comp.insight}
                                                   </TooltipContent>
                                                </Tooltip>
                                             </TooltipProvider>
                                          </div>
                                       </motion.div>
                                    )
                                 })}
                              </motion.div>
                           )}
                        </CardContent>
                     </Card>
                  </motion.div>
               </div>
             )
          })}
        </div>

        {/* FINAL VERDICT MODAL / OVERLAY */}
        <AnimatePresence>
           {showFinalVerdict && activeData && (
              <motion.div 
                 initial={{opacity:0}} 
                 animate={{opacity:1}} 
                 className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
              >
                 <motion.div 
                    initial={{scale:0.9, y:40}} 
                    animate={{scale:1, y:0}} 
                    transition={{type:"spring", bounce:0.5}}
                    className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden shadow-[0_0_100px_-20px_rgba(168,85,247,0.4)]"
                 >
                    <div className="p-8 md:p-12 text-center space-y-6 relative">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-red-500 to-purple-500" />
                       
                       <Badge className="bg-slate-800 text-slate-300 pointer-events-none uppercase tracking-widest border-none px-4 py-1">Overall Grade</Badge>
                       
                       <div className="py-4">
                          <motion.h1 
                            initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay:0.3, type:"spring"}}
                            className={cn("text-8xl font-black italic tracking-tighter drop-shadow-lg", 
                              activeData.overallPercentile >= 75 ? "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]" : 
                              activeData.overallPercentile >= 40 ? "text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" : 
                              "text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]")}
                          >
                             {activeData.overallPercentile >= 75 ? "F" : activeData.overallPercentile >= 60 ? "C-" : activeData.overallPercentile >= 40 ? "B" : "A+"}
                          </motion.h1>
                       </div>

                       <div className="space-y-2">
                          <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white">{activeData.overallVerdict}</h2>
                          <p className="text-slate-400 max-w-md mx-auto">Your contract is harsher than <strong className="text-white">{activeData.overallPercentile}%</strong> of the market standard. 
                          It failed {roundData.filter(r => r.winner === "market").length} out of 5 critical rounds.</p>
                       </div>

                       <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                          <Link href={`/builder/${document.document_type || "default"}`} className="w-full sm:w-auto">
                             <Button className="w-full h-12 px-4 md:px-4 md:px-6 lg:px-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                Improve Your Contract <ArrowUpRight className="ml-2 w-4 h-4" />
                             </Button>
                          </Link>
                          <Button variant="outline" className="w-full sm:w-auto h-12 rounded-full border-slate-700 hover:bg-slate-800 text-slate-300 font-bold" onClick={() => setShowFinalVerdict(false)}>
                             View Breakdown Detail
                          </Button>
                       </div>

                    </div>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Action Controls Footer */}
        <div className="fixed bottom-0 left-0 w-full bg-slate-950/80 backdrop-blur-md border-t border-slate-800 z-30 p-4">
           <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={skipToVerdict} disabled={showFinalVerdict}>
                 Skip to Result
              </Button>

              <Button 
                onClick={nextAction} 
                className="h-12 px-4 md:px-4 md:px-6 lg:px-8 rounded-full bg-white dark:bg-card text-slate-950 hover:bg-slate-200 font-black uppercase tracking-widest shadow-lg"
              >
                 {!gameStarted ? "Start Battle" : revealedRounds < 5 ? `Reveal Round ${revealedRounds + 1}` : "Show Final Verdict"}
                 <Zap className="w-4 h-4 ml-2" />
              </Button>
           </div>
        </div>

        {/* Extra spacer for the fixed footer */}
        <div className="h-24 w-full" />

      </main>
    </div>
  );
}

// ----------------------------------------------------
// Custom Gauge Component (Recharts)
// ----------------------------------------------------
function GaugeChart({ value, label, highlightColor = "#a855f7" }: { value: number; label: string; highlightColor?: string }) {
   const data = [
     { name: "Risk", value: value },
     { name: "Safe", value: 100 - value },
   ];

   return (
      <div className="w-32 h-20 flex flex-col items-center justify-center relative">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
               <Pie
                  data={data}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={25}
                  outerRadius={35}
                  dataKey="value"
                  stroke="none"
               >
                  <Cell fill={highlightColor} />
                  <Cell fill="#1f2937" />
               </Pie>
            </PieChart>
         </ResponsiveContainer>
         <div className="absolute bottom-0 flex flex-col items-center translate-y-2">
            <span className="text-xl font-black text-white">{Math.round(value)}</span>
            <span className="text-[8px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 absolute -bottom-4 whitespace-nowrap">{label}</span>
         </div>
      </div>
   )
}

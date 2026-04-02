"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView, useReducedMotion } from "framer-motion";
import { toPng } from "html-to-image";
import { ArrowDown, Share2, Download, Instagram, MessageCircle, Twitter , AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/navbar";

import type { WrappedData } from "@/lib/utils/wrapped-data";
import { downloadDataUrl, shareToWhatsApp } from "@/lib/utils/share";

function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function WrappedClient({ data, isLoading, error, onRetry }: { data: WrappedData; isLoading?: boolean; error?: string; onRetry?: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll();

  const handleDownload = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingCard(true);
    toast.info("Generating graphic...");
    try {
      const url = await toPng(shareCardRef.current, { quality: 1.0, pixelRatio: 2, backgroundColor: "#020617" });
      downloadDataUrl(url, `clausewall-wrapped-${new Date().getFullYear()}.png`);
      toast.success("Graphic Downloaded successfully");
    } catch (e) {
      toast.error("Failed to generate image.");
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleShareWhatsApp = () => {
    const totalFlags = data.illegalFound + data.dangerousFound;
    const savingsLabel = formatSavings(data.estimatedSavings);
    const text = `🛡️ I secured my year with ClauseWall Wrapped!\n📊 ${data.totalContracts} agreements scanned\n🚩 ${totalFlags} traps neutralized\n💰 ${savingsLabel} guarded\n🏆 Rank: ${data.personalityType.name}\nCheck yours at clausewall.vercel.app/wrapped`;
    shareToWhatsApp(text);
  };

  
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
    <div className="bg-slate-950 font-sans text-white overflow-x-hidden relative">
      <Navbar />

      {/* Progress Bar globally sticky */}
      <motion.div 
         className="fixed top-16 left-0 right-0 h-1 z-50 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 origin-left"
         style={{ scaleX: scrollYProgress }}
      />

      {/* SLIDE 1: INTRO */}
      <section className="h-screen w-full flex flex-col items-center justify-center snap-center relative" style={{background: "radial-gradient(circle at center, #1e3a8a 0%, #020617 70%)"}}>
         <ScrollReveal className="text-center z-10 px-4">
            <div className="text-8xl mb-8 filter drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">🛡️</div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold tracking-widest text-blue-200 mb-2 uppercase">Your {data.period}</h2>
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text leading-tight drop-shadow-xl">CONTRACT WRAPPED</h1>
            <p className="mt-8 text-blue-200/50 font-medium tracking-widest">SCROLL TO REVEAL</p>
         </ScrollReveal>
         <motion.div animate={{y:[0, 10, 0]}} transition={{repeat: Infinity, duration: prefersReducedMotion ? 0 : 2}} className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <ArrowDown className="w-8 h-8 text-blue-400/50" />
         </motion.div>
      </section>

      {/* SLIDE 2: VOLUME & PERCENTILE */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center snap-center relative overflow-hidden" style={{background: "linear-gradient(to bottom right, #052e16 0%, #020617 100%)"}}>
         <ScrollReveal className="text-center z-10 px-4 relative">
            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 font-black uppercase tracking-widest mb-8 border-none px-4 md:px-6 py-2 text-sm shadow-[0_0_30px_rgba(34,197,94,0.3)]">Total Analysis</Badge>
            <h2 className="text-lg md:text-xl lg:text-2xl font-black tracking-tighter text-slate-400 uppercase mb-4">You successfully processed</h2>
            <h1 className="text-9xl md:text-[200px] font-black leading-none text-white drop-shadow-[0_0_50px_rgba(34,197,94,0.4)]">
               {data.totalContracts}
            </h1>
            <h2 className="text-4xl md:text-6xl font-black text-green-400 uppercase mt-4 mb-8 italic">Agreements</h2>
            
            <div className="bg-slate-950/50 border border-green-500/20 backdrop-blur-md rounded-2xl p-6 max-w-lg mx-auto transform -rotate-1 shadow-2xl">
               <p className="text-slate-300 text-lg font-medium">That placed you in the top <strong className="text-white text-lg md:text-xl lg:text-2xl px-2">{100 - data.percentile}%</strong> of defense intelligence across the country.</p>
               <p className="text-slate-500 dark:text-slate-400 text-xs mt-3 uppercase tracking-widest font-black">Spanning {data.totalClauses} clauses over {data.dateRange.spanDays} Days</p>
            </div>
         </ScrollReveal>
      </section>

      {/* SLIDE 3: AVERAGE RISK GAUGE */}
      <section className="h-screen w-full flex flex-col items-center justify-center snap-center relative" style={{background: "radial-gradient(circle at top right, #4c1d95 0%, #020617 60%)"}}>
         <ScrollReveal className="w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
               <Badge className="bg-purple-500/20 text-purple-400 font-black uppercase tracking-widest mb-6 border-none px-4 py-1.5 shadow-[0_0_20px_rgba(168,85,247,0.3)]">Danger Profile</Badge>
               <h2 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase">Average <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Risk Score</span></h2>
               <p className="text-slate-400 mt-6 text-xl max-w-md">Your typical contract sits at {data.avgRiskScore}/100. That is heavily tilted into the {data.avgRiskScore > 50 ? "Predatory" : "Safe"} zone.</p>
            </div>
            <div className="flex justify-center shrink-0">
               <div className="relative w-64 h-64 md:w-96 md:h-96 rounded-full bg-slate-950 border-8 border-slate-900 shadow-[0_0_100px_rgba(168,85,247,0.2)] flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-900/50 to-transparent" />
                  <div className="text-center z-10">
                     <span className="text-7xl md:text-[100px] font-black text-white drop-shadow-2xl">{data.avgRiskScore}</span>
                     <span className="block text-purple-500 font-black uppercase tracking-widest mt-2">{data.avgRiskScore > 75 ? "LETHAL" : data.avgRiskScore > 50 ? "DANGEROUS" : "SECURE"}</span>
                  </div>
               </div>
            </div>
         </ScrollReveal>
      </section>

      {/* SLIDE 4: ISSUES FOUND BREAKDOWN */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center snap-center relative overflow-hidden" style={{background: "linear-gradient(to top, #7f1d1d 0%, #020617 80%)"}}>
         <ScrollReveal className="text-center px-4 w-full max-w-5xl">
            <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 shadow-black drop-shadow-xl">We Found</h2>
            <h1 className="text-8xl md:text-[250px] font-black leading-none text-red-500 mb-10 drop-shadow-[0_0_80px_rgba(239,68,68,0.5)]">
               {data.illegalFound + data.dangerousFound + data.warningFound}
            </h1>
            <h2 className="text-3xl md:text-5xl font-black text-slate-300 uppercase tracking-widest mb-16">Hidden Traps</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
               <div className="bg-slate-950 border border-purple-500/20 p-4 md:p-6 lg:p-8 rounded-3xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                  <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                  <div className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl sm:text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance md:text-5xl text-balance mb-4 font-black text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] border border-purple-500/50 rounded-xl bg-purple-950/50 p-4 inline-block">{data.illegalFound}</div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Illegal Clauses</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Banned by section laws. Total void.</p>
               </div>
               <div className="bg-slate-950 border border-red-500/20 p-4 md:p-6 lg:p-8 rounded-3xl relative overflow-hidden group hover:border-red-500/50 transition-colors">
                  <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                  <div className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl sm:text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance md:text-5xl text-balance mb-4 font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] border border-red-500/50 rounded-xl bg-red-950/50 p-4 inline-block">{data.dangerousFound}</div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Predatory Traps</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Aggressively biased against you.</p>
               </div>
               <div className="bg-slate-950 border border-yellow-500/20 p-4 md:p-6 lg:p-8 rounded-3xl relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                  <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
                  <div className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl sm:text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance md:text-5xl text-balance mb-4 font-black text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] border border-yellow-500/50 rounded-xl bg-yellow-950/50 p-4 inline-block">{data.warningFound}</div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Warning Terms</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Mildly unfavorable. Needs negotiation.</p>
               </div>
            </div>
         </ScrollReveal>
      </section>

      {/* SLIDE 5: MONEY SAVED */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center snap-center relative overflow-hidden" style={{background: "radial-gradient(circle at center, #064e3b 0%, #020617 70%)"}}>
         <ScrollReveal className="text-center z-10 px-4 w-full">
            <h2 className="text-lg md:text-xl lg:text-2xl font-black text-green-400 uppercase tracking-widest mb-4">Because you didn't sign blindly, you saved</h2>
            <h1 className="text-7xl md:text-[180px] font-black leading-none text-white drop-shadow-[0_0_60px_rgba(52,211,153,0.5)] my-6">
               {formatSavings(data.estimatedSavings)}
            </h1>
            <p className="text-xl md:text-3xl font-medium text-slate-300 max-w-2xl mx-auto italic">in excessive penalties, hidden lock-ins, and stolen deposits.</p>
         </ScrollReveal>
      </section>

      {/* SLIDE 6: TOP VILLAIN (RISKIEST) */}
      {data.riskiestContract && (
      <section className="h-screen w-full flex flex-col items-center justify-center snap-center relative" style={{background: "linear-gradient(to bottom, #020617 0%, #450a0a 100%)"}}>
         <ScrollReveal className="w-full max-w-5xl px-4 text-center">
            <Badge className="bg-red-500/20 text-red-500 font-black uppercase tracking-widest mb-10 border border-red-500/30 px-4 md:px-6 py-2 shadow-[0_0_40px_rgba(239,68,68,0.4)]">Top Villain</Badge>
            <h2 className="text-4xl md:text-6xl font-black text-slate-400 uppercase tracking-tighter mb-4">The Most Vicious Agreement</h2>
            <h1 className="text-5xl md:text-8xl font-black text-white uppercase truncate flex items-center justify-center gap-4 px-4 md:px-4 md:px-6 lg:px-8 border-y-4 border-red-500/50 py-8 bg-black/40 shadow-2xl backdrop-blur-sm">
               {data.riskiestContract.name}
            </h1>
            <p className="mt-12 text-lg md:text-xl lg:text-2xl font-bold text-red-400 uppercase tracking-widest max-w-xl mx-auto">
               Risk Score: {data.riskiestContract.score}/100 based heavily in {data.riskiestContract.jurisdiction}.
            </p>
         </ScrollReveal>
      </section>
      )}

      {/* SLIDE 7: PERSONALITY & ACHIEVEMENTS */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center snap-center relative bg-slate-950">
         <ScrollReveal className="w-full max-w-6xl px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-20 pb-20">
            {/* Personality */}
            <Card className="bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500/30 p-10 flex flex-col items-center text-center justify-center rounded-[40px] shadow-[0_0_50px_rgba(99,102,241,0.1)]">
               <span className="text-8xl mb-6">{data.personalityType.icon}</span>
               <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Defense Class Profile</h3>
               <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">{data.personalityType.name}</h2>
               <p className="text-lg text-slate-400 leading-relaxed">{data.personalityType.description}</p>
            </Card>

            {/* Achievements */}
            <Card className="bg-gradient-to-bl from-amber-950/80 to-slate-900 border-amber-500/30 p-10 flex flex-col items-center text-center justify-center rounded-[40px] shadow-[0_0_50px_rgba(245,158,11,0.1)]">
               <span className="text-8xl mb-6">{data.badge.icon}</span>
               <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-2">Highest Honor Earned</h3>
               <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">{data.badge.name}</h2>
               <p className="text-lg text-slate-400 leading-relaxed">{data.badge.description}</p>
            </Card>
         </ScrollReveal>
      </section>

      {/* SLIDE 8: FINAL SHARE CARD */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center snap-center relative pb-20 bg-slate-950">
         <div className="w-full max-w-md px-4 relative">
            <motion.h2 initial={{opacity:0}} whileInView={{opacity:1}} className="text-center font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-8">Share Your Wrapped</motion.h2>
            
            {/* Downloadable Target Frame */}
            <div ref={shareCardRef} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[32px] p-4 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden isolate aspect-[4/5] flex flex-col flex-shrink-0">
               {/* Decorative */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -z-10" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] -z-10" />

               <div className="flex items-center justify-between mb-8 z-10">
                  <div className="flex flex-col">
                     <span className="text-xs font-black uppercase tracking-widest text-blue-400">ClauseWall 2025</span>
                     <span className="text-lg md:text-xl lg:text-2xl font-black text-white">WRAPPED</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-xl shadow-lg ring-1 ring-white/5">🛡️</div>
               </div>

               <div className="flex-1 flex flex-col justify-center space-y-6 z-10">
                  <div className="bg-slate-950/50 backdrop-blur-md rounded-2xl p-4 border border-slate-800/60 shadow-inner flex items-center justify-between">
                     <span className="text-sm font-bold text-slate-400 uppercase">Documents Analyzed</span>
                     <span className="text-lg md:text-xl lg:text-2xl font-black text-white">{data.totalContracts}</span>
                  </div>
                  
                  <div className="bg-slate-950/50 backdrop-blur-md rounded-2xl p-4 border border-slate-800/60 shadow-inner flex items-center justify-between">
                     <span className="text-sm font-bold text-slate-400 uppercase">Red Flags Burned</span>
                     <span className="text-lg md:text-xl lg:text-2xl font-black text-red-400">{data.illegalFound + data.dangerousFound}</span>
                  </div>

                  <div className="bg-slate-950/50 backdrop-blur-md rounded-2xl p-4 border border-slate-800/60 shadow-inner flex items-center justify-between">
                     <span className="text-sm font-bold text-slate-400 uppercase">Capital Guarded</span>
                     <span className="text-lg md:text-xl lg:text-2xl font-black text-green-400">{formatSavings(data.estimatedSavings)}</span>
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between z-10">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">My Class Rank</span>
                     <span className="text-lg font-black text-white">{data.personalityType.name} {data.personalityType.icon}</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none shrink-0 shadow-[0_0_20px_rgba(79,70,229,0.5)]">TOP {100 - data.percentile}%</Badge>
               </div>
            </div>

            {/* Actions (Outside Download Frame) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
               <Button onClick={handleDownload} disabled={isGeneratingCard} className="w-full h-14 rounded-2xl bg-white dark:bg-card hover:bg-slate-200 text-black font-black uppercase tracking-widest shadow-xl shadow-white/10 border-transparent">
                  {isGeneratingCard ? <span className="animate-spin text-xl mr-2">⟳</span> : <Download className="w-5 h-5 mr-2" />} Save Image
               </Button>
               <Button onClick={handleShareWhatsApp} disabled={isGeneratingCard} className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-green-600 text-white font-black uppercase tracking-widest shadow-xl shadow-[#25D366]/20 border-transparent">
                  <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
               </Button>
            </div>
            <div className="mt-4 flex justify-center gap-4">
               <Button aria-label="Share to Instagram" variant="outline" size="icon" className="w-12 h-12 rounded-full border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 shadow-md">
                  <Instagram className="w-5 h-5" />
               </Button>
               <Button aria-label="Share to Twitter" variant="outline" size="icon" className="w-12 h-12 rounded-full border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 shadow-md">
                  <Twitter className="w-5 h-5" />
               </Button>
               <Button aria-label="Copy share link" variant="outline" size="icon" className="w-12 h-12 rounded-full border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 shadow-md transform -rotate-12 hover:-rotate-0 transition-transform cursor-copy">
                  <Share2 className="w-5 h-5" />
               </Button>
            </div>

         </div>
      </section>
      
    </div>
  );
}

// FORMATTER HELPERS
function formatSavings(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

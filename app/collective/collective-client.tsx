"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  Loader2,
  TrendingUp,
  Scale,
  MessageCircle,
  Clock,
  MapPin,
  Shield,
  Eye,
  CheckCircle2
, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ThresholdProgress } from "@/components/collective/threshold-progress";
import { JoinCollectiveModal } from "@/components/collective/join-collective-modal";
import { LegalAidCard } from "@/components/collective/legal-aid-card";
import { LeverageCard } from "@/components/collective/leverage-card";

import type { Collective } from "@/types";

interface CollectiveClientProps {
  
  error?: string;
  onRetry?: () => void;

  initialMyCollectives: Collective[];
  initialDiscoverCollectives: Collective[];

  isLoading?: boolean;
}

export default function CollectiveClient({  initialMyCollectives, initialDiscoverCollectives , error, onRetry, isLoading }: CollectiveClientProps) {
  const [myCollectives, setMyCollectives] = useState<Collective[]>(initialMyCollectives);
  const [discoverCollectives, setDiscoverCollectives] = useState<Collective[]>(initialDiscoverCollectives);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [activeJoinId, setActiveJoinId] = useState<string | null>(null);

  const handleJoin = async (collectiveId: string) => {
    setLocalLoading(true);
    try {
      const res = await fetch("/api/collective/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectiveId })
      });
      if (!res.ok) throw new Error("Failed to join");
      
      const joined = discoverCollectives.find(c => c.id === collectiveId);
      if (joined) {
         setDiscoverCollectives(prev => prev.filter(c => c.id !== collectiveId));
         setMyCollectives(prev => [joined, ...prev]);
         setActiveJoinId(null);
         toast.success("Joined collective anonymously.");
      }
    } catch (e) {
      toast.error("Could not join collective.");
    } finally {
      setLocalLoading(false);
    }
  };

  const filteredDiscover = discoverCollectives.filter(c => {
     const matchesSearch = c.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.common_violations && c.common_violations.some(v => (v.clause_type + " " + v.violation_description).toLowerCase().includes(searchQuery.toLowerCase())));
     const matchesFilter = filterType === "all" || filterType === "active" && c.member_count > 5 || filterType === "near" && c.member_count >= (c.threshold * 0.8) || filterType === "new" && c.member_count < 3;
     return matchesSearch && matchesFilter;
  });

  const FILTER_PILLS = [
     { label: "All Hubs", value: "all" },
     { label: "Near Threshold", value: "near" },
     { label: "Highly Active", value: "active" },
     { label: "Newly Forming", value: "new" }
  ];

  
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
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col selection:bg-amber-500/30">
      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
           <div className="max-w-2xl space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 rounded-3xl flex items-center justify-center shadow-inner mb-6 ring-1 ring-amber-500/30">
                 <Users className="w-8 h-8" />
              </div>
              <h1 className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black text-white tracking-tight leading-tight">
                 Collective <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Action Backbone</span>
              </h1>
              <p className="text-lg font-medium text-slate-400">
                 Unite anonymously against predatory entities. When structural thresholds are met, localized hubs coordinate strategic legal countermeasures safely.
              </p>
           </div>
           
           <div className="shrink-0 flex items-center">
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 h-12 px-4 md:px-6 gap-2"
              >
                 <Plus className="w-5 h-5" /> Start a Collective
              </Button>
           </div>
        </div>

        {/* My Collectives Horizontal Scroll */}
        {myCollectives.length > 0 && (
           <div className="space-y-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                 <Shield className="w-5 h-5 text-green-400" /> My Active Operations
              </h2>
              <ScrollArea className="w-full whitespace-nowrap pb-4">
                 <div className="flex gap-4 w-max">
                    {myCollectives.map(c => (
                       <Link key={c.id} href={`/collective/${c.id}`}>
                          <Card className="w-[320px] shrink-0 bg-white dark:bg-slate-900/[0.03] border-white/10 rounded-3xl hover:bg-white dark:bg-slate-900/[0.06] hover:border-amber-500/30 transition-all cursor-pointer overflow-hidden relative group">
                             <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                             <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                   <div className="space-y-1">
                                      <h3 className="font-bold text-white text-lg truncate w-[220px]" title={c.entity_name}>{c.entity_name}</h3>
                                      <Badge variant="outline" className="border-white/10 text-white/50 text-[10px] uppercase font-bold tracking-widest bg-white dark:bg-slate-900/[0.02]">{c.entity_type}</Badge>
                                   </div>
                                   <Badge className="bg-amber-500/10 text-amber-400 border-none shadow-none text-xs"><MessageCircle className="w-3 h-3 mr-1" /> 2</Badge>
                                </div>
                                <div className="space-y-4">
                                   <ThresholdProgress current={c.member_count} threshold={c.threshold} />
                                   <div className="flex items-center justify-between text-xs font-medium">
                                      <span className="text-slate-400"><span className="text-white">{c.member_count}</span> members</span>
                                      <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                         <CheckCircle2 className="w-3 h-3" /> Active
                                      </span>
                                   </div>
                                </div>
                             </CardContent>
                          </Card>
                       </Link>
                    ))}
                 </div>
                 <ScrollBar orientation="horizontal" />
              </ScrollArea>
           </div>
        )}

        {/* Discover Section */}
        <div className="space-y-8">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white">Join the Resistance</h2>
              <div className="relative w-full sm:w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                 <Input 
                   placeholder="Search offending entities..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="pl-11 h-12 bg-white dark:bg-card/[0.03] border-white/10 rounded-2xl text-white placeholder-slate-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 shadow-inner w-full font-bold"
                 />
              </div>
           </div>

           {/* Filter Pills */}
           <div className="flex flex-wrap items-center gap-2">
              {FILTER_PILLS.map(p => (
                 <button 
                   key={p.value}
                   onClick={() => setFilterType(p.value)}
                   className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                      filterType === p.value 
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-400" 
                        : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.06]"
                   )}
                 >
                    {p.label}
                 </button>
              ))}
           </div>

           {/* Grid */}
           {filteredDiscover.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white dark:bg-slate-900/[0.01]">
                 <Search className="w-12 h-12 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
                 <h3 className="text-lg font-bold text-slate-400 mb-2">No Collectives Found</h3>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Try adjusting your filters or start a new hub.</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredDiscover.map(c => (
                    <Card key={c.id} className="bg-white dark:bg-slate-900/[0.02] border-white/10 rounded-3xl overflow-hidden flex flex-col h-full hover:bg-white dark:bg-slate-900/[0.04] transition-all group">
                       <CardContent className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-4">
                             <div className="space-y-1">
                                <h3 className="font-bold text-white text-lg line-clamp-1" title={c.entity_name}>{c.entity_name}</h3>
                                <Badge variant="outline" className="border-white/10 text-white/50 text-[10px] uppercase font-bold tracking-widest bg-white dark:bg-slate-900/[0.02]">{c.entity_type}</Badge>
                             </div>
                             <div className="flex items-center gap-1 text-xs font-bold bg-white dark:bg-slate-900/[0.05] text-amber-400 px-2 py-1 rounded-lg">
                                <TrendingUp className="w-3 h-3" /> <span className="text-white">{c.member_count}</span>
                             </div>
                          </div>
                          
                          <p className="text-xs font-medium text-slate-400 mb-6 flex-1 line-clamp-2">
                             <strong>Core Issue:</strong> {c.common_violations?.[0]?.clause_type || "Undisclosed predatory conditions tracking"}
                          </p>

                          <div className="space-y-4 mb-6">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                <MapPin className="w-3 h-3" /> {c.primary_jurisdiction || "National"} Focus
                             </div>
                             <ThresholdProgress current={c.member_count} threshold={c.threshold} />
                          </div>

                          <div className="flex gap-3 mt-auto">
                             <Button 
                               onClick={() => setActiveJoinId(c.id)}
                               className="flex-1 bg-white dark:bg-slate-900 border border-transparent text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200"
                             >
                                Join Anonymously
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           )}
        </div>

        {/* How It Works Layer */}
        <div className="py-8 space-y-8">
           <h2 className="text-lg font-black text-white text-center uppercase tracking-widest relative">
              <span className="px-4 bg-slate-950 relative z-10">Mobilization Protocol</span>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white dark:bg-slate-900/10 -translate-y-1/2 z-0" />
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
              {[
                { i: <Eye />, t: "1. Detect", d: "Upload contracts; the engine spots identical illegalities." },
                { i: <Shield />, t: "2. Join", d: "Opt into an anonymous legal hub mapping your exposure." },
                { i: <Users />, t: "3. Coordinate", d: "Chat securely. Vote on legal maneuvers dynamically." },
                { i: <Scale />, t: "4. Act", d: "Deploy synchronized legal notices and collective strikes." }
              ].map((step, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-900/[0.02] border border-white/5 p-6 rounded-3xl text-center relative group">
                    <div className="w-12 h-12 bg-white dark:bg-card/[0.05] rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:bg-amber-500/10">
                       {step.i}
                    </div>
                    <h3 className="text-sm font-black text-white mb-2">{step.t}</h3>
                    <p className="text-xs font-medium text-slate-400">{step.d}</p>
                 </div>
              ))}
           </div>
        </div>

        {/* Leverage / Legal Aid Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {myCollectives.length > 0 ? (
             <div className="contents">
               {/* @ts-ignore */}
               <LeverageCard collective={myCollectives[0]} />
             </div>
           ) : (
             <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 rounded-3xl p-4 md:p-6 lg:p-8 flex flex-col justify-center">
                <h3 className="text-lg md:text-xl lg:text-2xl font-black text-white mb-3">Strength in Numbers.</h3>
                <p className="text-sm font-medium text-amber-200/60 leading-relaxed mb-6">
                   Entities rely on exploiting isolated individuals. Collective hubs aggregate statistical leverage and split legal burdens safely.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-amber-500/20 pt-6">
                   <div>
                      <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-amber-500">83%</h4>
                      <p className="text-[10px] text-amber-200/50 uppercase font-bold tracking-widest mt-1">Resolution Rate</p>
                   </div>
                   <div>
                      <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-amber-500">4x</h4>
                      <p className="text-[10px] text-amber-200/50 uppercase font-bold tracking-widest mt-1">Faster Processing</p>
                   </div>
                   <div>
                      <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-amber-500">10k+</h4>
                      <p className="text-[10px] text-amber-200/50 uppercase font-bold tracking-widest mt-1">Citizens Protected</p>
                   </div>
                </div>
             </Card>
           )}
           <div className="contents">
             {/* @ts-ignore */}
             <LegalAidCard />
           </div>
        </div>

      </main>
      <Footer />

      {/* Reused Modal Component mapped to active state */}
      <AnimatePresence>
        {activeJoinId && (
          <JoinCollectiveModal 
             collectiveId={activeJoinId}
             entityName={discoverCollectives.find(c => c.id === activeJoinId)?.entity_name || "Collective"}
             memberCount={discoverCollectives.find(c => c.id === activeJoinId)?.member_count || 0}
             onClose={() => setActiveJoinId(null)}
             onJoined={() => handleJoin(activeJoinId)}
          />
        )}
      </AnimatePresence>

      {/* Start Dialog mock */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
         <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-slate-950 border border-white/10 shadow-2xl">
            <DialogHeader className="mb-4">
               <DialogTitle className="text-xl font-black text-white">Start a Collective</DialogTitle>
               <DialogDescription className="text-xs font-medium text-slate-400 mt-1">
                  Collectives are strictly formed around specific entities (e.g., 'Acme Corp') based on verified legal violations.
               </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-2xl bg-white dark:bg-card/[0.02]">
               <Shield className="w-10 h-10 text-slate-600 dark:text-slate-400 mb-4" />
               <p className="text-center text-sm font-medium text-slate-300">Hubs form algorithmically through the <strong>Wall of Shame</strong> database.</p>
               <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="mt-6 border-white/10 text-white hover:bg-white dark:bg-slate-900/5">
                  Go to Contract Scanner &rarr;
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

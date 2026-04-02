"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import Link from "next/link";
import {
  Skull,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Flag,
  Search,
  Shield,
  Users,
  ArrowRight,
  Gavel,
  Loader2,
  Building2,
  ChevronDown,
  ChevronUp
, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { cn } from "@/lib/utils";
import type { FlaggedEntity } from "@/types";

interface ShameClientProps {
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;

  initialEntities: FlaggedEntity[];
}

export default function ShameClient({  initialEntities , isLoading, error, onRetry }: ShameClientProps) {
  const [entities, setEntities] = useState<FlaggedEntity[]>(initialEntities);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"flags" | "risk" | "recent">("flags");
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  
  // Flag Form State
  const [flagEntityName, setFlagEntityName] = useState("");
  const [flagEntityType, setFlagEntityType] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Sorting
  const filteredEntities = entities
    .filter((entity) => {
      const matchesSearch =
        searchQuery === "" ||
        entity.entity_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "all" ||
        entity.entity_type.toLowerCase() === selectedType.toLowerCase() ||
        (selectedType === "startups" && entity.entity_type.toLowerCase() === "startup"); // fuzzing mapping

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "flags") return b.total_flags - a.total_flags;
      if (sortBy === "risk") return b.avg_risk_score - a.avg_risk_score;
      // "recent" fallback assuming ID sequence or standard if no date exists
      return a.entity_name.localeCompare(b.entity_name);
    });

  const getRiskBadgeColor = (score: number) => {
    if (score >= 80) return "bg-rose-100 text-rose-700 border-rose-200";
    if (score >= 60) return "bg-orange-100 text-orange-700 border-orange-200";
    if (score >= 30) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const submitFlag = async () => {
    setIsSubmitting(true);
    try {
      // API call placeholder for POST /api/flag-entity
      await new Promise(r => setTimeout(r, 800));
      // Reset & close
      setShowFlagDialog(false);
      setFlagEntityName("");
      setFlagEntityType("");
      setFlagReason("");
    } catch {
        // Silently handled
      } finally {
      setIsSubmitting(false);
    }
  };

  const TYPE_PILLS = [
    { label: "All Categories", value: "all" },
    { label: "Landlords", value: "landlord" },
    { label: "Employers", value: "employer" },
    { label: "Companies", value: "company" },
    { label: "Banks", value: "bank" },
    { label: "Startups", value: "startups" }
  ];

  const totalFlags = entities.reduce((acc, e) => acc + e.total_flags, 0);
  const avgRisk = entities.length > 0 ? Math.round(entities.reduce((acc, e) => acc + e.avg_risk_score, 0) / entities.length) : 0;
  
  // Quick categorization math
  const categoryCounts: Record<string, number> = {};
  entities.forEach(e => {
     categoryCounts[e.entity_type] = (categoryCounts[e.entity_type] || 0) + 1;
  });
  const mostFlaggedCat = Object.keys(categoryCounts).length > 0 
    ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b) 
    : "None";

  
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

      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2">
           <div>
              <div className="flex items-center gap-4 mb-3">
                 <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Skull className="w-7 h-7" />
                 </div>
                 <div>
                    <h1 className="text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance font-black text-slate-900 dark:text-slate-100 tracking-tight">Wall of Shame</h1>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Community Protection Grid</p>
                 </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-xl">
                 Crowdsourced reporting of entities utilizing predatory or illegal clauses in their standard contracts. Always verify independently.
              </p>
           </div>
           
           <div className="shrink-0">
              <Button 
                onClick={() => setShowFlagDialog(true)}
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl h-11 px-4 md:px-6 shadow-sm dark:shadow-slate-900/20 flex gap-2 w-full md:w-auto"
              >
                 <Flag className="w-4 h-4" />
                 Flag an Entity
              </Button>
           </div>
        </div>

        {/* SEARCH & FILTER PILLS */}
        <div className="space-y-4">
           {/* Search & Sort Row */}
           <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Search offending entities..." 
                   className="pl-10 h-11 bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-sm dark:shadow-slate-900/20"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                 <SelectTrigger className="w-full sm:w-[180px] h-11 bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-xl font-bold shadow-sm dark:shadow-slate-900/20">
                   <SelectValue placeholder="Sort By" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                    <SelectItem value="flags">Most Flagged</SelectItem>
                    <SelectItem value="risk">Highest Risk</SelectItem>
                    <SelectItem value="recent">Alphabetical</SelectItem>
                 </SelectContent>
              </Select>
           </div>
           
           {/* Pills Row */}
           <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2 mask-linear">
              {TYPE_PILLS.map((pill) => (
                 <button
                    key={pill.value}
                    onClick={() => setSelectedType(pill.value)}
                    className={cn(
                       "px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all",
                       selectedType === pill.value 
                         ? "bg-indigo-600 text-white shadow-sm border border-indigo-600"
                         : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    )}
                 >
                    {pill.label}
                 </button>
              ))}
           </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Flagged</p>
              <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100">{entities.length}</p>
           </Card>
           <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Reports</p>
              <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-rose-600">{totalFlags}</p>
           </Card>
           <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Worst Category</p>
              <p className="text-xl font-black text-amber-600 capitalize truncate mt-1">{mostFlaggedCat}</p>
           </Card>
           <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/20 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Risk Score</p>
              <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-indigo-600">{avgRisk}</p>
           </Card>
        </div>

        {/* TOP 3 WORST OFFENDERS GRID */}
        {filteredEntities.length > 0 && selectedType === "all" && searchQuery === "" && (
           <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-rose-500" />
                 Worst Offenders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {filteredEntities.slice(0, 3).map((entity, idx) => (
                    <Card key={entity.id} className="bg-rose-950 border-rose-900 rounded-3xl shadow-lg shadow-rose-900/10 overflow-hidden relative">
                       <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
                       <CardContent className="p-6 relative z-10">
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-8 h-8 rounded-full bg-rose-900 flex items-center justify-center text-sm font-black text-rose-300">
                                #{idx + 1}
                             </div>
                             <Badge className="bg-rose-900/50 text-rose-200 border-none capitalize text-[10px] tracking-wide">
                                {entity.entity_type}
                             </Badge>
                          </div>
                          <h3 className="text-xl font-black text-white mb-6 line-clamp-1">{entity.entity_name}</h3>
                          
                          <div className="flex justify-between items-end mb-6 bg-rose-900/30 rounded-2xl p-4">
                             <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Total Flags</p>
                                <div className="flex items-center gap-2">
                                   <Flag className="w-5 h-5 text-rose-500" />
                                   <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-white">{entity.total_flags}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Risk Gauge</p>
                                <span className="text-xl font-black text-white">{entity.avg_risk_score}</span>
                                <span className="text-xs font-bold text-rose-500">/100</span>
                             </div>
                          </div>

                          <div className="space-y-2">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Chief Violations</p>
                             {entity.common_violations?.slice(0, 2).map((v, i) => (
                                <div key={i} className="text-xs font-medium text-rose-100 bg-rose-900/40 p-2 rounded-lg line-clamp-1">
                                   • {v}
                                </div>
                             ))}
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           </div>
        )}

        {/* RANKING TABLE */}
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm dark:shadow-slate-900/20 overflow-hidden">
           <ScrollArea className="w-full">
              <div className="min-w-[800px] w-full p-1">
                 {/* Table Header */}
                 <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-3">Entity Name</div>
                    <div className="col-span-4">Primary Violation</div>
                    <div className="col-span-2 text-center">Risk Score</div>
                    <div className="col-span-2 text-right pr-4">Actions</div>
                 </div>

                 {/* Table Body */}
                 {filteredEntities.length === 0 ? (
                    <div className="p-12 text-center">
                       <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                       <h3 className="font-bold text-slate-600 dark:text-slate-400">No Entities Found</h3>
                    </div>
                 ) : (
                    <div className="divide-y divide-slate-50">
                       {filteredEntities.map((entity, i) => (
                          <div key={entity.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/50 transition-colors group">
                             <div className="col-span-1 flex justify-center">
                                {i < 3 && selectedType === "all" && searchQuery === "" ? (
                                   <Skull className="w-5 h-5 text-rose-500" />
                                ) : (
                                   <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                                )}
                             </div>
                             <div className="col-span-3">
                                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{entity.entity_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                   <Badge variant="outline" className="h-5 text-[9px] capitalize border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">{entity.entity_type}</Badge>
                                   <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                      <Flag className="w-3 h-3" /> {entity.total_flags}
                                   </span>
                                </div>
                             </div>
                             <div className="col-span-4">
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2">
                                   {entity.common_violations?.[0] || "Undisclosed predatory conditions"}
                                </p>
                             </div>
                             <div className="col-span-2 flex justify-center">
                                <Badge className={cn("text-[10px] font-bold shadow-none", getRiskBadgeColor(entity.avg_risk_score))}>
                                   {entity.avg_risk_score}/100 Risk
                                </Badge>
                             </div>
                             <div className="col-span-2 flex justify-end gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                                   Details
                                </Button>
                                <Tooltip>
                                   <TooltipTrigger asChild>
                                      <Button aria-label="View entity details" size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50">
                                         <AlertTriangle className="w-4 h-4" />
                                      </Button>
                                   </TooltipTrigger>
                                </Tooltip>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </ScrollArea>
        </Card>

        {/* HOW FLAGGING WORKS */}
        <Card className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-3xl p-4 md:p-6 lg:p-8 shadow-sm dark:shadow-slate-900/20">
           <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> How Flagging Works
           </h3>
           <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              The Wall of Shame is automatically populated when users upload contracts containing egregious or illegal conditions and opt to name the drafting entity. Mappings are strictly anonymous. We do not constitute a legal judgment, but provide market visibility against predatory norms. 
           </p>
        </Card>
      </main>
      
      <Footer />

      {/* FLAG INPUT DIALOG */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
         <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-card border-slate-200 dark:border-slate-700 shadow-xl">
            <DialogHeader className="mb-4">
               <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">Flag an Entity</DialogTitle>
               <DialogDescription className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                  Submit to the registry
               </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label htmlFor="flag-entity-name" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 block">Entity Name</label>
                  <Input 
                     id="flag-entity-name"
                     value={flagEntityName} 
                     onChange={e => setFlagEntityName(e.target.value)} 
                     placeholder="e.g. Acme Corp Housing"
                     className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl h-11 font-bold focus:border-indigo-500" 
                  />
               </div>
               <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 block">Category</span>
                  <Select value={flagEntityType} onValueChange={setFlagEntityType}>
                     <SelectTrigger aria-label="Entity Category" className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl h-11 font-bold focus:border-indigo-500">
                        <SelectValue placeholder="Select type" />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
                        {TYPE_PILLS.filter(p => p.value !== "all").map(p => (
                           <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-1.5">
                  <label htmlFor="flag-reason" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 block">Reason / Context</label>
                  <textarea 
                     id="flag-reason"
                     value={flagReason} 
                     onChange={e => setFlagReason(e.target.value)} 
                     placeholder="Outline the egregious clauses..."
                     className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-inner resize-none" 
                  />
               </div>
               <Button 
                  onClick={submitFlag}
                  disabled={isSubmitting || !flagEntityName || !flagEntityType || !flagReason}
                  className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-black tracking-widest uppercase text-xs rounded-xl shadow-md"
               >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Flag"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

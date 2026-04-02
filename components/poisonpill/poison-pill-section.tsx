"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Loader2,
  Network,
  Target,
  Maximize2,
  X,
  AlertOctagon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import type { PoisonPillAnalysisResult, Clause } from "@/types";
import { TrapSummaryBar } from "./trap-summary-bar";
import { TrapCard } from "./trap-card";
import { InterconnectionMap } from "./interconnection-map";
import { NegotiationRoadmap } from "./negotiation-roadmap";

interface PoisonPillSectionProps {
  documentId: string;
  clauses: Clause[];
}

type TabView = "traps" | "map" | "roadmap";

export function PoisonPillSection({ documentId, clauses }: PoisonPillSectionProps) {
  const [poisonPillData, setPoisonPillData] = useState<PoisonPillAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrap, setSelectedTrap] = useState<string | null>(null);
  const [showFullModal, setShowFullModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("traps");
  
  // Auto-fetch data on component mount
  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/poisonpill/${documentId}`);
      if (res.ok) {
        const result = await res.json();
        setPoisonPillData(result);
      }
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false);
    }
  };

  const InnerContent = () => {
    if (isLoading) {
      return (
        <Card className="bg-slate-950 border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.05)] w-full">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-6" />
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1">Mapping Dependency Graphs</h3>
            <p className="text-sm text-slate-400 font-medium">
              Analyzing synergistic behaviors between {clauses.length} distinct clauses...
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!poisonPillData) {
      return (
        <Card className="bg-slate-950 border-slate-800 w-full relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05)_0%,transparent_100%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_100%)] transition-colors duration-500" />
          <CardContent className="p-4 md:p-6 lg:p-8 text-center relative z-10">
            <AlertOctagon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Analysis Failed</h3>
            <p className="text-sm text-slate-400 font-medium mb-6">
              Could not compute the Poison Pill graph for this document.
            </p>
            <Button onClick={runAnalysis} className="bg-purple-600 hover:bg-purple-700 text-white font-bold tracking-widest uppercase text-xs h-10 px-4 md:px-4 md:px-6 lg:px-8">
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (poisonPillData.traps.length === 0) {
      return (
        <Card className="bg-slate-950 border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.05)] w-full">
          <CardContent className="p-4 md:p-6 lg:p-8 text-center">
             <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
               <ShieldAlert className="w-8 h-8 text-green-500" />
             </div>
             <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Poison Pills Detected</h3>
             <p className="text-sm text-slate-400 font-medium">
               ClauseWall did not detect any compounding legal traps or structural dependencies inside this agreement.
             </p>
          </CardContent>
        </Card>
      );
    }

    const tabs: { id: TabView; label: string; icon: React.ReactNode }[] = [
      { id: "traps", label: "Hidden Traps", icon: <ShieldAlert className="w-4 h-4" /> },
      { id: "map", label: "Interconnection Graph", icon: <Network className="w-4 h-4" /> },
      { id: "roadmap", label: "Escalation Playbook", icon: <Target className="w-4 h-4" /> },
    ];

    return (
      <div className="space-y-6 w-full fade-in">
        {/* Header Block Matching Stitch Specs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
           <div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                 ☠️ Poison Pill Analysis
              </h2>
              <p className="text-sm text-purple-400 font-bold tracking-wide mt-1.5 uppercase">
                 These clauses work TOGETHER to trap you
              </p>
           </div>
           
           {!showFullModal && (
             <Button variant="outline" size="sm" onClick={() => setShowFullModal(true)} className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 bg-transparent uppercase tracking-wider text-xs font-black">
                <Maximize2 className="w-4 h-4 mr-2" /> Full Screen Map
             </Button>
           )}
        </div>

        <TrapSummaryBar result={poisonPillData} />

        {/* Tab Selection */}
        <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center whitespace-nowrap gap-2 px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-all ${ activeTab === tab.id ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-slate-500 dark:text-slate-400 hover:text-slate-300 hover:bg-slate-800" }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Tab Body */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-6 min-h-[500px]">
           <AnimatePresence mode="wait">
             
             {activeTab === "traps" && (
               <motion.div key="traps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                 {poisonPillData.traps.map((trap, i) => (
                   <TrapCard
                     key={trap.id}
                     trap={trap}
                     isExpanded={selectedTrap === trap.id}
                     onToggle={() => setSelectedTrap(selectedTrap === trap.id ? null : trap.id)}
                   />
                 ))}
               </motion.div>
             )}

             {activeTab === "map" && (
               <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
                 <InterconnectionMap
                   graph={poisonPillData.graph}
                   traps={poisonPillData.traps}
                   selectedTrapId={selectedTrap}
                   onTrapSelect={setSelectedTrap}
                 />
               </motion.div>
             )}

             {activeTab === "roadmap" && (
               <motion.div key="roadmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 <NegotiationRoadmap
                   roadmap={poisonPillData.negotiation_roadmap}
                   traps={poisonPillData.traps}
                 />
               </motion.div>
             )}
             
           </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Default Inline Renderer */}
      <div className="w-full">
         <InnerContent />
      </div>
      
      {/* Portal Dialog for Immersive Full Screen */}
      <Dialog open={showFullModal} onOpenChange={setShowFullModal}>
         <DialogContent className="max-w-[95vw] h-[95vh] bg-slate-950 border-purple-500/20 p-6 flex flex-col gap-0 overflow-y-auto no-scrollbar">
            <div className="absolute right-4 top-4 z-50">
               <button onClick={() => setShowFullModal(false)} className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white border border-slate-800">
                  <X className="w-5 h-5" />
               </button>
            </div>
            {/* Re-mount inner content inside Dialog omitting the trigger button */}
            <InnerContent />
         </DialogContent>
      </Dialog>
    </>
  );
}

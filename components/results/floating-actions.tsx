"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, Variants } from "framer-motion";
import {
  Menu,
  Dna,
  Scan,
  Swords,
  FileText,
  Link2,
  Download,
  BarChart3,
  Flame,
  Search,
  Share2,
  DoorOpen,
  Users,
  Calculator,
  Building2,
  ShieldAlert,
  Image as ImageIcon,
  Video,
  ChevronUp,
  X
} from "lucide-react";
import { toast } from "sonner";
import { generateReport } from "@/lib/pdf/report-generator";
import type { Document, Clause } from "@/types";

interface Props {
  document: Document;
  clauses: Clause[];
  onOpenDNA: () => void;
  onOpenXRay: () => void;
  onOpenScoreCard: () => void;
  onOpenVideoCard: () => void;
  isRoastMode: boolean;
  roastLoading: boolean;
  onToggleRoast: () => void;
}

export function FloatingActions({
  document: doc,
  clauses,
  onOpenDNA,
  onOpenXRay,
  onOpenScoreCard,
  onOpenVideoCard,
  isRoastMode,
  roastLoading,
  onToggleRoast,
}: Props) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [downloading, setDownloading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const floatingBar: Variants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { delay: prefersReducedMotion ? 0 : 0.5, duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" } 
    }
  };

  // Close "More" menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showMore) {
        setShowMore(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showMore]);

  const handleAction = async (actionId: string) => {
    setShowMore(false); // Map action execution to close overflow menu if open

    switch (actionId) {
      case "collaborate":
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("clausewall:collaborate"));
        }
        break;
      case "dna":
        onOpenDNA();
        break;
      case "battle":
        router.push(`/battle/${doc.id}`);
        break;
      case "simulate":
        router.push(`/simulate/${doc.id}`);
        break;
      case "ruin-calculator":
        router.push(`/ruin-calculator/${doc.id}`);
        break;
      case "escape":
        router.push(`/escape/${doc.id}`);
        break;
      case "legal-help":
        window.document.getElementById("authority-section-cta")?.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      case "xray":
        onOpenXRay();
        break;
      case "playbook":
        router.push(`/negotiate/${doc.id}`);
        break;
      case "notice":
        router.push(`/letter/${doc.id}`);
        break;
      case "scorecard":
        onOpenScoreCard();
        break;
      case "video":
        onOpenVideoCard();
        break;
      case "roast":
        onToggleRoast();
        break;
      case "link":
        const url = `${window.location.origin}/results/${doc.id}`;
        await navigator.clipboard.writeText(url);
        toast.success("Results link copied!");
        break;
      case "pdf":
        setDownloading(true);
        try {
          await generateReport(doc, clauses);
          toast.success("PDF report downloaded!");
        } catch (error) {
          toast.error("Failed to generate PDF");
        }
        setDownloading(false);
        break;
    }
  };

  const PRIMARY_ACTIONS = [
    { id: "escape", label: "Escape Plan", icon: DoorOpen },
    { id: "playbook", label: "Negotiate", icon: Swords },
    { id: "simulate", label: "Calculator", icon: Calculator },
    { id: "notice", label: "Legal Notice", icon: FileText },
    { id: "dna", label: "Contract DNA", icon: Dna },
    { id: "link", label: "Share", icon: Share2 },
  ];

  const SECONDARY_ACTIONS = [
    { id: "xray", label: "Deep Scan", icon: Scan },
    { id: "battle", label: "Benchmark Market", icon: BarChart3 },
    { id: "ruin-calculator", label: "Financial Ruin Risk", icon: ShieldAlert },
    { id: "collaborate", label: "Review Room", icon: Users },
    { id: "legal-help", label: "Find Legal Authority", icon: Building2 },
    { id: "scorecard", label: "Image Scorecard", icon: ImageIcon },
    { id: "video", label: "Video Generation", icon: Video },
    { id: "pdf", label: "Export Formal PDF", icon: Download },
  ];

  return (
    <div data-no-print className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-auto sm:max-w-[90vw] pointer-events-none flex flex-col items-center gap-3">
      
      {/* Expanding Overflow Menu (Secondary Actions) */}
      {showMore && (
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: 10 }}
           className="w-full sm:w-auto bg-white dark:bg-card/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl pointer-events-auto p-3 grid grid-cols-2 md:grid-cols-4 gap-2 mb-2"
        >
          {SECONDARY_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                disabled={action.id === "pdf" && downloading}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold text-xs transition-all w-full text-left"
              >
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg text-slate-500 dark:text-slate-400">
                  <Icon className="h-4 w-4" />
                </div>
                {action.id === "pdf" && downloading ? "Generating..." : action.label}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Main Dock */}
      <motion.div
        variants={floatingBar}
        initial="hidden"
        animate="visible"
        className="pointer-events-auto bg-white dark:bg-card/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full flex items-center p-2 gap-1 overflow-x-auto scrollbar-hide w-full max-w-full"
      >
        {/* Roast Toggle Special */}
        <button
          onClick={() => handleAction("roast")}
          disabled={roastLoading}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full transition-all border ${ isRoastMode ? "bg-gradient-to-r from-orange-50 to-red-50 text-orange-600 border-orange-200 hover:bg-orange-100" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50" }`}
        >
          <Flame className={`h-4 w-4 ${isRoastMode ? "animate-pulse" : ""}`} />
          <span className="text-xs font-black tracking-widest uppercase hidden md:inline-block">
            {roastLoading ? "Loading..." : isRoastMode ? "Roast ON" : "Roast"}
          </span>
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0 hidden sm:block" />

        {/* Primary Target Actions */}
        <div className="flex items-center gap-1">
          {PRIMARY_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full bg-transparent text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:shadow-sm dark:shadow-slate-900/20 transition-all group"
              >
                <Icon className="h-4 w-4 md:h-4 md:w-4 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] md:text-xs font-bold whitespace-nowrap hidden sm:inline-block">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />

        {/* Overflow Menu Toggle */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex-shrink-0 flex items-center justify-center p-2.5 rounded-full transition-all group ${ showMore ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200" }`}
        >
          {showMore ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </motion.div>
    </div>
  );
}
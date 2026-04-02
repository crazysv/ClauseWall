"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  BarChart3,
  Zap,
  Users,
  Gavel,
  Briefcase,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AmmunitionReport } from "@/types/market";

interface AmmunitionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export function AmmunitionReportModal({
  isOpen,
  onClose,
  documentId,
}: AmmunitionReportModalProps) {
  const [report, setReport] = useState<AmmunitionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState<"counterparty" | "consumer_forum" | "lawyer">("counterparty");

  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/market/ammunition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          target_audience: audience,
        }),
      });
      const data = await res.json();
      if (data.success) setReport(data.report);
    } catch {
        // Silently handled
      } finally {
      setLoading(false);
    }
  };

  const audienceOptions = [
    { value: "counterparty", label: "Counterparty", icon: Users, desc: "Polite but firm" },
    { value: "consumer_forum", label: "Consumer Forum", icon: Gavel, desc: "Legal language" },
    { value: "lawyer", label: "Lawyer", icon: Briefcase, desc: "Technical brief" },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-slate-900/50 rounded-2xl md:rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative"
      >
        {/* Decorative flair */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-32 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
              <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-black text-lg md:text-xl text-slate-900 dark:text-slate-100 tracking-tight">Negotiation Ammunition</h2>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Data-backed arguments from market benchmarks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Audience Selector */}
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/80">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 ml-1">Generate arguments for:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {audienceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAudience(opt.value)}
                className={`p-4 rounded-2xl border text-center transition-all group ${ audience === opt.value ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700/50 text-indigo-800 dark:text-indigo-300 shadow-sm" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm" }`}
              >
                <opt.icon className={`h-6 w-6 mx-auto mb-2 ${audience === opt.value ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"} transition-colors`} />
                <p className="text-sm font-bold">{opt.label}</p>
                <p className={`text-[10px] uppercase tracking-widest font-bold mt-1.5 ${audience === opt.value ? "text-indigo-600/70 dark:text-indigo-400/70" : "text-slate-400"}`}>{opt.desc}</p>
              </button>
            ))}
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full mt-5 h-12 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-500 shadow-md transition-colors text-sm font-bold tracking-wide disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Gathering Ammunition...</>
            ) : (
              <><Zap className="h-4 w-4" /> Generate Intelligence Brief</>
            )}
          </button>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-white dark:bg-slate-950 font-sans">
          {report ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Summary */}
              <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 leading-relaxed">{report.overall_summary}</p>
              </div>

              {/* Sections */}
              {report.sections.map((section, i) => (
                <Card key={i} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/60 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start sm:items-center justify-between mb-5 flex-col sm:flex-row gap-3">
                      <h4 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">{section.heading}</h4>
                      <Badge
                        className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full shadow-sm ${
                          section.percentile_rank > 75
                            ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                            : section.percentile_rank > 50
                              ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                              : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        P{section.percentile_rank}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                      <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <p className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100">{section.user_value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">Your Contract</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                        <p className="text-lg md:text-xl font-black text-indigo-600 dark:text-indigo-400">{section.market_median}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 dark:text-indigo-400/80 mt-1.5">Market Median</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <p className="text-lg md:text-xl font-black text-slate-500 dark:text-slate-400">{section.sample_count}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">Benchmarks Analyzed</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{section.narrative}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {report.sections.length === 0 && (
                <div className="text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20">
                  <p className="font-bold text-slate-600 dark:text-slate-400 text-sm">
                    All terms in this contract are within market norms. No ammunition points found.
                  </p>
                </div>
              )}
            </motion.div>
          ) : !loading ? (
            <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mb-4">
                 <BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Ready to generate intelligence</p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[250px]">Select an audience and generate your tailored negotiation brief.</p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

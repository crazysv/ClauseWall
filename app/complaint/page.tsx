"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Gavel, Plus, Clock, CheckCircle2, AlertCircle,
  ArrowRight, FileText, Loader2, Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComplaintFiling } from "@/types";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  draft: { color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", icon: FileText, label: "Draft" },
  documents_ready: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: FileText, label: "Docs Ready" },
  filing_guided: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Scale, label: "Guided" },
  filed: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: CheckCircle2, label: "Filed" },
  acknowledged: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: CheckCircle2, label: "Acknowledged" },
  hearing_scheduled: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", icon: Clock, label: "Hearing Scheduled" },
  hearing_completed: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", icon: CheckCircle2, label: "Hearing Done" },
  order_received: { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", icon: Scale, label: "Order Received" },
  resolved: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: CheckCircle2, label: "Resolved" },
  appealed: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle, label: "Appealed" },
  closed: { color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", icon: CheckCircle2, label: "Closed" },
};

export default function ComplaintListPage() {
  const prefersReducedMotion = useReducedMotion();
  const [filings, setFilings] = useState<ComplaintFiling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaint/list")
      .then(res => res.json())
      .then(data => setFilings(data.filings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = filings.filter(f => !["resolved", "closed"].includes(f.status));
  const resolved = filings.filter(f => ["resolved", "closed"].includes(f.status));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col relative overflow-hidden">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3 text-slate-900 dark:text-slate-100 tracking-tight">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800/50">
                 <Gavel className="h-6 w-6" />
              </div>
              Complaint Filings
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">Track and manage your active regulatory disputes</p>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-white dark:bg-card border-none shadow-xl shadow-slate-200/50 dark:shadow-slate-900/20 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Scale className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <p className="text-3xl lg:text-4xl font-black text-orange-500 dark:text-orange-400 mb-1">{active.length}</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-card border-none shadow-xl shadow-slate-200/50 dark:shadow-slate-900/20 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
               <CheckCircle2 className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <p className="text-3xl lg:text-4xl font-black text-emerald-500 dark:text-emerald-400 mb-1">{resolved.length}</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Resolved</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-card border-none shadow-xl shadow-slate-200/50 dark:shadow-slate-900/20 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <FileText className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <p className="text-3xl lg:text-4xl font-black text-indigo-500 dark:text-indigo-400 mb-1">{filings.length}</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[120px] w-full rounded-2xl bg-white dark:bg-slate-800" />)}
          </div>
        ) : filings.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 md:py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 mb-6 shadow-sm">
              <Gavel className="h-10 w-10 text-orange-500 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">No Complaints Filed Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto mb-8">
              Analyze a contract first, then file a complaint if violations are found.
            </p>
            <Link href="/upload">
              <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-bold h-12 px-6 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5">
                <Plus className="h-5 w-5 mr-2" /> Start Analysis
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filings.map((filing, i) => {
              const config = statusConfig[filing.status] || statusConfig.draft;
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={filing.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : i * 0.1, duration: 0.4 }}
                >
                  <Link href={`/complaint/${filing.document_id}`}>
                    <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-xl dark:shadow-slate-900/20 hover:border-orange-200 dark:hover:border-orange-700/50 transition-all cursor-pointer group rounded-2xl overflow-hidden relative">
                      {filing.status === "hearing_scheduled" && (
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
                      )}
                      
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {config.label}
                              </span>
                              {filing.case_number && (
                                <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">#{filing.case_number}</span>
                              )}
                            </div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {filing.complaint_title || "Untitled Complaint"}
                            </h4>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <span>{filing.authority_type.replace(/_/g, " ")}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">₹{(filing.claim_amount || 0).toLocaleString("en-IN")} Claim</span>
                            </p>
                            
                            {filing.next_hearing_date && (
                              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/40 dark:text-orange-400 text-xs font-bold px-3 py-1.5 rounded-lg mt-3">
                                <Clock className="h-3.5 w-3.5" />
                                Hearing: {new Date(filing.next_hearing_date).toLocaleDateString("en-IN")}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/30 group-hover:border-orange-200 dark:group-hover:border-orange-800 transition-colors mt-2">
                             <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

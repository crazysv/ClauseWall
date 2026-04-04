"use client";

import { motion } from "framer-motion";
import { Gavel, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { ComplaintFiling } from "@/types";

interface ComplaintDashboardWidgetProps {
  filings: ComplaintFiling[];
}

export default function ComplaintDashboardWidget({ filings }: ComplaintDashboardWidgetProps) {
  if (!filings || filings.length === 0) return null;

  const active = filings.filter(f => !['resolved', 'closed'].includes(f.status));
  const resolved = filings.filter(f => ['resolved', 'closed'].includes(f.status));
  const nextHearing = active
    .filter(f => f.next_hearing_date)
    .sort((a, b) => new Date(a.next_hearing_date!).getTime() - new Date(b.next_hearing_date!).getTime())[0];

  const statusColors: Record<string, string> = {
    draft: 'text-gray-400',
    documents_ready: 'text-blue-400',
    filing_guided: 'text-blue-400',
    filed: 'text-amber-400',
    acknowledged: 'text-amber-400',
    hearing_scheduled: 'text-orange-400',
    hearing_completed: 'text-orange-400',
    order_received: 'text-purple-400',
    resolved: 'text-green-400',
    appealed: 'text-red-400',
    closed: 'text-gray-500',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="card-impact p-6 rounded-none">
        <CardContent className="p-0">
          <div className="flex items-center justify-between mb-6 pb-2 border-b-4 border-black">
            <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-3">
              <Gavel className="h-6 w-6 text-orange-500 stroke-[3px]" />
              Complaint Filings
            </h3>
            <Link
              href="/complaint"
              className="font-bold uppercase tracking-widest text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-2 group"
            >
              View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-orange-100 dark:bg-orange-900/30 border-4 border-orange-500 shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]">
              <p className="text-2xl font-black text-orange-700 dark:text-orange-400">{active.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-900 dark:text-orange-200 mt-1">Active</p>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 border-4 border-green-500 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]">
              <p className="text-2xl font-black text-green-700 dark:text-green-400">{resolved.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-green-900 dark:text-green-200 mt-1">Resolved</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 border-4 border-blue-500 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
              <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{filings.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-900 dark:text-blue-200 mt-1">Total</p>
            </div>
          </div>

          {nextHearing && (
            <div className="p-4 bg-amber-100 dark:bg-amber-900/50 border-4 border-amber-500 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)] mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 stroke-[3px]" />
                <span className="text-sm font-black uppercase tracking-widest text-amber-800 dark:text-amber-300">Next Hearing</span>
              </div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                {nextHearing.complaint_title} — {new Date(nextHearing.next_hearing_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {active.slice(0, 3).map(filing => (
              <Link key={filing.id} href={`/complaint/${filing.document_id}`}>
                <div className="flex items-center justify-between p-4 border-2 border-black bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:-translate-y-1 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-black uppercase tracking-widest truncate">{filing.complaint_title}</p>
                    <p className="text-xs font-bold text-muted-foreground mt-1">{filing.case_number || 'Case # pending'}</p>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 border-2 border-black ${statusColors[filing.status] || 'text-gray-600 bg-gray-100 dark:bg-gray-800'}`}>
                    {filing.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

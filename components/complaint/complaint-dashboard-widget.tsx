"use client";

import { motion } from "framer-motion";
import { Gavel, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { ComplaintFiling } from "@/types";

interface ComplaintDashboardWidgetProps {
  filings: ComplaintFiling[];
}

export function ComplaintDashboardWidget({ filings }: ComplaintDashboardWidgetProps) {
  if (!filings || filings.length === 0) return null;

  const active = filings.filter(f => !['resolved', 'closed'].includes(f.status));
  const resolved = filings.filter(f => ['resolved', 'closed'].includes(f.status));
  const nextHearing = active
    .filter(f => f.next_hearing_date)
    .sort((a, b) => new Date(a.next_hearing_date!).getTime() - new Date(b.next_hearing_date!).getTime())[0];

  const statusColors: Record<string, string> = {
    draft: 'text-slate-400',
    documents_ready: 'text-blue-400',
    filing_guided: 'text-blue-400',
    filed: 'text-amber-400',
    acknowledged: 'text-amber-400',
    hearing_scheduled: 'text-orange-400',
    hearing_completed: 'text-orange-400',
    order_received: 'text-purple-400',
    resolved: 'text-green-400',
    appealed: 'text-red-400',
    closed: 'text-slate-500',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Gavel className="h-4 w-4 text-orange-400" />
              Complaint Filings
            </h3>
            <Link
              href="/complaint"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-xl bg-orange-500/10">
              <p className="text-lg font-bold text-orange-400">{active.length}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-green-500/10">
              <p className="text-lg font-bold text-green-400">{resolved.length}</p>
              <p className="text-[10px] text-muted-foreground">Resolved</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-indigo-500/10">
              <p className="text-lg font-bold text-indigo-400">{filings.length}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>

          {nextHearing && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-300">Next Hearing</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {nextHearing.complaint_title} — {new Date(nextHearing.next_hearing_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}

          {active.slice(0, 3).map(filing => (
            <Link key={filing.id} href={`/complaint/${filing.document_id}`}>
              <div className="flex items-center justify-between py-2 border-t border-white/5 hover:bg-white dark:bg-slate-900/[0.02] px-1 rounded transition-colors cursor-pointer">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{filing.complaint_title}</p>
                  <p className="text-[10px] text-muted-foreground">{filing.case_number || 'Case # pending'}</p>
                </div>
                <span className={`text-[10px] font-medium ${statusColors[filing.status] || 'text-slate-400'}`}>
                  {filing.status.replace(/_/g, ' ')}
                </span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

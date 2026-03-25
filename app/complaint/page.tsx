"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gavel, Plus, Clock, CheckCircle2, AlertCircle,
  ArrowRight, FileText, Loader2, Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComplaintFiling } from "@/types";

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: "text-gray-400", icon: FileText, label: "Draft" },
  documents_ready: { color: "text-blue-400", icon: FileText, label: "Docs Ready" },
  filing_guided: { color: "text-blue-400", icon: Scale, label: "Guided" },
  filed: { color: "text-amber-400", icon: CheckCircle2, label: "Filed" },
  acknowledged: { color: "text-amber-400", icon: CheckCircle2, label: "Acknowledged" },
  hearing_scheduled: { color: "text-orange-400", icon: Clock, label: "Hearing Scheduled" },
  hearing_completed: { color: "text-orange-400", icon: CheckCircle2, label: "Hearing Done" },
  order_received: { color: "text-purple-400", icon: Scale, label: "Order Received" },
  resolved: { color: "text-green-400", icon: CheckCircle2, label: "Resolved" },
  appealed: { color: "text-red-400", icon: AlertCircle, label: "Appealed" },
  closed: { color: "text-gray-500", icon: CheckCircle2, label: "Closed" },
};

export default function ComplaintListPage() {
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
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gavel className="h-6 w-6 text-orange-400" />
              Complaint Filings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage your regulatory complaints</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{active.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{resolved.length}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{filings.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : filings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 mb-4">
              <Gavel className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Complaints Filed Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Analyze a contract first, then file a complaint if violations are found.
            </p>
            <Link href="/">
              <Button className="bg-orange-600 hover:bg-orange-700 gap-2">
                <Plus className="h-4 w-4" /> Analyze a Contract
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filings.map((filing, i) => {
              const config = statusConfig[filing.status] || statusConfig.draft;
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={filing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/complaint/${filing.document_id}`}>
                    <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon className={`h-3.5 w-3.5 ${config.color}`} />
                              <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                              {filing.case_number && (
                                <span className="text-[10px] text-muted-foreground">#{filing.case_number}</span>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm truncate group-hover:text-orange-300 transition-colors">
                              {filing.complaint_title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {filing.authority_type.replace(/_/g, " ")} • ₹{(filing.claim_amount || 0).toLocaleString("en-IN")}
                            </p>
                            {filing.next_hearing_date && (
                              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Next hearing: {new Date(filing.next_hearing_date).toLocaleDateString("en-IN")}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0 mt-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

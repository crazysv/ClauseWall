"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gavel,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  Loader2,
  Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComplaintFiling } from "@/types";

const statusConfig: Record<
  string,
  { color: string; icon: typeof Clock; label: string }
> = {
  draft: { color: "text-foreground", icon: FileText, label: "Draft" },
  documents_ready: {
    color: "text-blue-400",
    icon: FileText,
    label: "Docs Ready",
  },
  filing_guided: { color: "text-blue-400", icon: Scale, label: "Guided" },
  filed: { color: "text-amber-400", icon: CheckCircle2, label: "Filed" },
  acknowledged: {
    color: "text-amber-400",
    icon: CheckCircle2,
    label: "Acknowledged",
  },
  hearing_scheduled: {
    color: "text-orange-400",
    icon: Clock,
    label: "Hearing Scheduled",
  },
  hearing_completed: {
    color: "text-orange-400",
    icon: CheckCircle2,
    label: "Hearing Done",
  },
  order_received: {
    color: "text-purple-400",
    icon: Scale,
    label: "Order Received",
  },
  resolved: { color: "text-green-400", icon: CheckCircle2, label: "Resolved" },
  appealed: { color: "text-red-400", icon: AlertCircle, label: "Appealed" },
  closed: { color: "text-foreground", icon: CheckCircle2, label: "Closed" },
};

export default function ComplaintListPage() {
  const [filings, setFilings] = useState<ComplaintFiling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaint/list")
      .then((res) => res.json())
      .then((data) => setFilings(data.filings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = filings.filter(
    (f) => !["resolved", "closed"].includes(f.status),
  );
  const resolved = filings.filter((f) =>
    ["resolved", "closed"].includes(f.status),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-impact-heading flex items-center gap-2">
              <Gavel className="h-6 w-6 text-orange-500" />
              Complaint Filings
            </h1>
            <p className="text-sm text-foreground mt-1">
              Track and manage your regulatory complaints
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 rounded-none hover:-translate-y-1 hover:shadow-none transition-all">
            <CardContent className="p-0 text-center">
              <p className="text-2xl font-black text-orange-500">
                {active.length}
              </p>
              <p className="text-xs text-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="card-impact p-4 rounded-lg">
            <CardContent className="p-0 text-center">
              <p className="text-2xl font-black text-green-500">
                {resolved.length}
              </p>
              <p className="text-xs text-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card className="card-impact p-4 rounded-lg">
            <CardContent className="p-0 text-center">
              <p className="text-2xl font-black text-blue-500">
                {filings.length}
              </p>
              <p className="text-xs text-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-4 border-black bg-white dark:bg-zinc-900 border-dashed shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-16 rounded-none text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-none border-4 border-black bg-orange-100 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-orange-900/20 dark:border-orange-500">
              <Gavel className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-impact-subheading mb-2">
              No Complaints Filed Yet
            </h3>
            <p className="text-foreground mb-6">
              Analyze a contract first, then file a complaint if violations are
              found.
            </p>
            <Link href="/">
              <Button className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-orange-600 hover:bg-orange-700 hover:translate-y-0.5 hover:shadow-none transition-all gap-2 font-bold uppercase tracking-widest text-white rounded-none">
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
                    <Card className="border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all cursor-pointer group p-6 rounded-none">
                      <CardContent className="p-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon
                                className={`h-3.5 w-3.5 ${config.color}`}
                              />
                              <span
                                className={`text-xs font-medium ${config.color}`}
                              >
                                {config.label}
                              </span>
                              {filing.case_number && (
                                <span className="text-[10px] text-foreground">
                                  #{filing.case_number}
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm truncate group-hover:text-orange-300 transition-colors">
                              {filing.complaint_title}
                            </h4>
                            <p className="text-xs text-foreground mt-1 font-bold uppercase tracking-wider">
                              {filing.authority_type.replace(/_/g, " ")} • ₹
                              {(filing.claim_amount || 0).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                            {filing.next_hearing_date && (
                              <p className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1 uppercase tracking-wider border-2 border-amber-500/20 bg-amber-500/10 px-2 py-1 rounded w-fit">
                                <Clock className="h-3 w-3" />
                                Next hearing:{" "}
                                {new Date(
                                  filing.next_hearing_date,
                                ).toLocaleDateString("en-IN")}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-foreground group-hover:translate-x-1 transition-transform flex-shrink-0 mt-2" />
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

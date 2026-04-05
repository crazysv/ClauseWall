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

export default function AmmunitionReportModal({
  isOpen,
  onClose,
  documentId,
}: AmmunitionReportModalProps) {
  const [report, setReport] = useState<AmmunitionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [audience, setAudience] = useState<
    "counterparty" | "consumer_forum" | "lawyer"
  >("counterparty");

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
    } catch (err) {
      console.error("Ammunition generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const audienceOptions = [
    {
      value: "counterparty",
      label: "Counterparty",
      icon: Users,
      desc: "Polite but firm",
    },
    {
      value: "consumer_forum",
      label: "Consumer Forum",
      icon: Gavel,
      desc: "Legal language",
    },
    {
      value: "lawyer",
      label: "Lawyer",
      icon: Briefcase,
      desc: "Technical brief",
    },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-foreground border-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Negotiation Ammunition
              </h2>
              <p className="text-xs text-foreground">
                Data-backed arguments from market benchmarks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Audience Selector */}
        <div className="p-5 border-b border-foreground border-2">
          <p className="text-xs text-foreground mb-2">
            Generate arguments for:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {audienceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAudience(opt.value)}
                className={`p-3 rounded-none border-2 text-center transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none ${audience === opt.value ? "bg-cyan-100 border-cyan-600 text-cyan-900" : "bg-muted border-foreground text-foreground"}`}
              >
                <opt.icon className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs font-medium">{opt.label}</p>
                <p className="text-[10px] opacity-60">{opt.desc}</p>
              </button>
            ))}
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full mt-3 py-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" /> Generate Ammunition Report
              </>
            )}
          </button>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {report ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {report.overall_summary}
                </p>
              </div>

              {/* Sections */}
              {report.sections.map((section, i) => (
                <Card
                  key={i}
                  className="card-impact border-2 border-foreground bg-background rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {section.heading}
                      </h4>
                      <Badge
                        className={`text-[10px] ${section.percentile_rank > 75 ? "bg-red-500/15 text-red-400 border-red-500/30" : section.percentile_rank > 50 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" : "bg-green-500/15 text-green-400 border-green-500/30"}`}
                      >
                        P{section.percentile_rank}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded bg-white/[0.03]">
                        <p className="text-sm font-bold text-foreground">
                          {section.user_value}
                        </p>
                        <p className="text-[10px] text-foreground">
                          Your Value
                        </p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/[0.03]">
                        <p className="text-sm font-bold text-amber-400">
                          {section.market_median}
                        </p>
                        <p className="text-[10px] text-foreground">
                          Market Median
                        </p>
                      </div>
                      <div className="text-center p-2 rounded bg-white/[0.03]">
                        <p className="text-sm font-bold text-foreground">
                          {section.sample_count}
                        </p>
                        <p className="text-[10px] text-foreground">
                          Sample Size
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-foreground leading-relaxed">
                      {section.narrative}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {report.sections.length === 0 && (
                <p className="text-center text-foreground py-8 text-sm">
                  All terms in this contract are within market norms. No
                  ammunition points found.
                </p>
              )}
            </div>
          ) : !loading ? (
            <div className="text-center py-12 text-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Select an audience and generate your report
              </p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

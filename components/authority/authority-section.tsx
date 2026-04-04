"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Scale, ArrowUpCircle, Heart, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { JurisdictionResult, EscalationPath } from "@/types/authority";
import JurisdictionResultView from "./jurisdiction-result";
import EscalationPathVisualizer from "./escalation-path-visualizer";

interface Props {
  documentType: string;
  jurisdiction: string;
  entityName: string;
  claimAmount?: number;
  clauseTypes?: string[];
  preloadedRouting?: any;
}

export default function AuthoritySection({
  documentType,
  jurisdiction,
  entityName,
  claimAmount,
  clauseTypes,
  preloadedRouting,
}: Props) {
  const [routingResult, setRoutingResult] = useState<JurisdictionResult | null>(null);
  const [escalationPath, setEscalationPath] = useState<EscalationPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"authority" | "escalation" | "legal-aid" | "rti">("authority");

  useEffect(() => {
    if (preloadedRouting) {
      // Use preloaded routing from analysis
      setRoutingResult(preloadedRouting);
    } else {
      loadRouting();
    }
  }, [documentType, jurisdiction]);

  const loadRouting = async () => {
    setLoading(true);
    try {
      const [routeRes, escRes] = await Promise.all([
        fetch("/api/authority/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_type: documentType,
            jurisdiction,
            claim_amount: claimAmount,
            entity_name: entityName,
            clause_types: clauseTypes,
          }),
        }),
        fetch("/api/authority/escalation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dispute_category: null,
            document_type: documentType,
          }),
        }),
      ]);

      const [routeData, escData] = await Promise.all([routeRes.json(), escRes.json()]);

      if (routeData.success) setRoutingResult(routeData.result);
      if (escData.success) setEscalationPath(escData.path);
    } catch (err) {
      console.error("[ClauseWall] Authority section load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "authority" as const, label: "File Here", icon: Building2, color: "text-blue-400" },
    { id: "escalation" as const, label: "Escalation", icon: ArrowUpCircle, color: "text-amber-400" },
    { id: "legal-aid" as const, label: "Free Legal Aid", icon: Heart, color: "text-pink-400" },
    { id: "rti" as const, label: "File RTI", icon: FileText, color: "text-emerald-400" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
      id="authority-section"
    >
      {/* Section Header */}
      <div className="flex items-center gap-4 border-b-4 border-black pb-4">
        <div className="p-3 border-4 border-black bg-blue-100 dark:bg-blue-900/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400 stroke-[3px]" />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest">⚖️ File Complaint</h2>
          <p className="text-sm font-bold text-muted-foreground">
            AI-powered jurisdiction routing for {entityName || "this entity"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b-4 border-black pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 border-4 border-black font-black uppercase tracking-widest text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] ${
                activeTab === tab.id
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-zinc-900 text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 stroke-[3px] ${activeTab === tab.id ? "" : tab.color}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <Card className="card-impact p-12 rounded-none text-center">
          <CardContent className="p-0 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600 dark:text-blue-400 stroke-[3px]" />
            <p className="font-bold text-lg uppercase tracking-widest animate-pulse">Finding Authority...</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {activeTab === "authority" && routingResult && (
            <JurisdictionResultView result={routingResult} />
          )}

          {activeTab === "escalation" && escalationPath && (
            <EscalationPathVisualizer path={escalationPath} />
          )}

          {activeTab === "legal-aid" && (
            <div className="space-y-4 pt-4">
              <Card className="card-impact bg-pink-100 dark:bg-pink-900/30 border-pink-500 rounded-none p-6 text-center">
                <CardContent className="p-0">
                  <Heart className="h-12 w-12 text-pink-600 dark:text-pink-400 mx-auto mb-4 stroke-[3px]" />
                  <h3 className="font-black text-xl uppercase tracking-widest mb-2 text-pink-700 dark:text-pink-300">Need Free Legal Help?</h3>
                  <p className="font-bold text-pink-900 dark:text-pink-100 mb-6">
                    Check if you qualify for free legal services under LSAA 1987.
                  </p>
                  <Button asChild className="btn-impact bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto h-auto py-3 px-8 text-sm gap-2">
                    <a href="/authority/legal-aid">
                      <Heart className="h-5 w-5 stroke-[3px]" /> CHECK ELIGIBILITY
                    </a>
                  </Button>
                </CardContent>
              </Card>
              <div className="font-bold text-center text-muted-foreground p-4 border-4 border-black bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="uppercase tracking-widest">📞 NALSA Helpline:</span> <a href="tel:15100" className="text-blue-600 dark:text-blue-400 hover:underline">15100</a> •
                <span className="uppercase tracking-widest ml-2">Tele-Law:</span> <a href="tel:1800-11-5151" className="text-blue-600 dark:text-blue-400 hover:underline">1800-11-5151</a>
              </div>
            </div>
          )}

          {activeTab === "rti" && (
            <div className="pt-4">
              <Card className="card-impact bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 rounded-none p-6 text-center">
                <CardContent className="p-0">
                  <FileText className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4 stroke-[3px]" />
                  <h3 className="font-black text-xl uppercase tracking-widest mb-2 text-emerald-700 dark:text-emerald-300">File an RTI Query</h3>
                  <p className="font-bold text-emerald-900 dark:text-emerald-100 mb-6">
                    Cost: ₹10 only. Get information from any government body within 30 days.
                  </p>
                  <Button asChild className="btn-impact bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto h-auto py-3 px-8 text-sm gap-2">
                    <a href="/authority/rti">
                      <FileText className="h-5 w-5 stroke-[3px]" /> GENERATE RTI
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}

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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <Scale className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold">⚖️ File Your Complaint Here</h2>
          <p className="text-xs text-muted-foreground">
            AI-powered jurisdiction routing for {entityName || "this entity"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? tab.color : ""}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <Card className="border-white/10 bg-white/[0.02]">
          <CardContent className="p-8 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <p className="text-sm text-muted-foreground">Finding the right authority...</p>
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
            <div className="space-y-3">
              <Card className="border-pink-500/20 bg-pink-500/5">
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Need Free Legal Help?</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Check if you qualify for free legal services under LSAA 1987.
                  </p>
                  <Button asChild className="bg-pink-600 hover:bg-pink-700 gap-2" size="sm">
                    <a href="/authority/legal-aid">
                      <Heart className="h-3.5 w-3.5" /> Check Eligibility
                    </a>
                  </Button>
                </CardContent>
              </Card>
              <div className="text-xs text-center text-muted-foreground">
                📞 NALSA Helpline: <a href="tel:15100" className="text-blue-400">15100</a> •
                Tele-Law: <a href="tel:1800-11-5151" className="text-blue-400">1800-11-5151</a>
              </div>
            </div>
          )}

          {activeTab === "rti" && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">File a Right to Information Query</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Cost: ₹10 only. Get information from any government body within 30 days.
                </p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 gap-2" size="sm">
                  <a href="/authority/rti">
                    <FileText className="h-3.5 w-3.5" /> Generate RTI Application
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </motion.section>
  );
}

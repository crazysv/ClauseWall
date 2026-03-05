"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Upload,
  Shield,
  Sparkles,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  getRiskLevel,
  getStateName,
  getDocumentTypeLabel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/helpers";
import type { Document, PortfolioStats, RiskDataPoint, Achievement } from "@/types";
import { toast } from "sonner";

// Dashboard Components
import PortfolioStatsSection from "@/components/dashboard/portfolio-stats";
import RiskTrendChart from "@/components/dashboard/risk-trend-chart";
import AchievementsSection from "@/components/dashboard/achievements-section";
import InsightsSection from "@/components/dashboard/insights-section";

// Stats Logic
import { computePortfolioStats, buildRiskChartData } from "@/lib/stats/portfolio-stats";
import { computeAchievements } from "@/lib/stats/achievements";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [chartData, setChartData] = useState<RiskDataPoint[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [contractsBuilt, setContractsBuilt] = useState(0);

  const supabase = createClient();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch documents
        const { data: docs, error: docsError } = await supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (docsError) throw docsError;
        const documents = (docs as Document[]) || [];
        setDocuments(documents);

        // Fetch generated contracts count
        let builtCount = 0;
        try {
          const { count, error: countError } = await supabase
            .from("generated_contracts")
            .select("*", { count: "exact", head: true });

          if (!countError && count !== null) {
            builtCount = count;
          }
        } catch {
          // Table might not exist, ignore
        }
        setContractsBuilt(builtCount);

        // Compute stats
        const computedStats = computePortfolioStats(documents, builtCount);
        setStats(computedStats);

        // Build chart data
        const chart = buildRiskChartData(documents);
        setChartData(chart);

        // Compute achievements
        const achievementsList = computeAchievements(computedStats);
        setAchievements(achievementsList);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "analyzing":
      case "pending":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-muted-foreground">Loading your portfolio...</p>
      </div>
    );
  }

  // Empty State — No documents at all
  if (documents.length === 0) {
    return (
      <div className="relative px-4 sm:px-6 lg:px-8 py-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Shield className="h-16 w-16 text-blue-500/30 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">Your Contract Portfolio</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Upload your first contract to start building your portfolio.
                Track risks, earn achievements, and get smarter about contracts.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/upload">
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4" />
                    Analyze Contract
                  </Button>
                </Link>
                <Link href="/builder">
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Build Fair Contract
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Your Contract Portfolio
            </h1>
            <p className="text-muted-foreground">
              {documents.length} contract{documents.length !== 1 ? "s" : ""} analyzed
              {contractsBuilt > 0 && ` · ${contractsBuilt} built`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/builder">
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <Sparkles className="h-4 w-4" />
                Build
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4" />
                Analyze New
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ── CONTRACT WRAPPED CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10">
            {/* Animated background glow */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <CardContent className="relative p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Gift className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">
                        Your {currentYear} Contract Wrapped
                      </h3>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] border-0">
                        NEW
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      See your contract journey — stats, savings, badges & more!
                    </p>
                  </div>
                </div>
                <Link href="/wrapped">
                  <Button className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 hover:from-purple-700 hover:via-blue-700 hover:to-pink-700 gap-2 shadow-lg shadow-purple-500/25 w-full sm:w-auto">
                    <Sparkles className="h-4 w-4" />
                    View Wrapped
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── SECTION 1: Portfolio Stats ── */}
        {stats && <PortfolioStatsSection stats={stats} />}

        {/* ── SECTION 2: Chart + Insights (side by side on desktop) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RiskTrendChart data={chartData} />
          </div>
          <div className="lg:col-span-2">
            {stats && <InsightsSection stats={stats} documents={documents} />}
          </div>
        </div>

        {/* ── SECTION 3: Achievements ── */}
        {achievements.length > 0 && (
          <AchievementsSection achievements={achievements} />
        )}

        {/* ── SECTION 4: Recent Documents ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-4 text-white">
            Recent Documents
          </h2>
          <div className="space-y-3">
            {documents.map((doc, index) => {
              const riskLevel = getRiskLevel(doc.overall_risk_score);
              const riskColor = RISK_COLORS[riskLevel];

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + index * 0.03 }}
                >
                  <Link href={`/results/${doc.id}`}>
                    <Card className="bg-gray-900/50 border-gray-800 hover:border-blue-500/30 transition-all cursor-pointer">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          {/* Left Side */}
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${riskColor}15` }}
                            >
                              <span
                                className="text-base font-bold"
                                style={{ color: riskColor }}
                              >
                                {doc.overall_risk_score ?? "-"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {getStatusIcon(doc.analysis_status)}
                                <p className="font-medium text-sm truncate text-white">
                                  {doc.original_filename || "Untitled Document"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>
                                  {getDocumentTypeLabel(doc.document_type)}
                                </span>
                                <span>·</span>
                                <span>{getStateName(doc.jurisdiction)}</span>
                                <span>·</span>
                                <span>{formatDate(doc.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {doc.analysis_status === "completed" && (
                              <div className="hidden sm:flex items-center gap-1.5">
                                {doc.illegal_count > 0 && (
                                  <Badge className="bg-purple-500/15 text-purple-400 text-[10px] px-1.5">
                                    {doc.illegal_count} illegal
                                  </Badge>
                                )}
                                {doc.dangerous_count > 0 && (
                                  <Badge className="bg-red-500/15 text-red-400 text-[10px] px-1.5">
                                    {doc.dangerous_count} danger
                                  </Badge>
                                )}
                              </div>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                doc.analysis_status === "completed"
                                  ? "border-green-500/30 text-green-400"
                                  : doc.analysis_status === "failed"
                                  ? "border-red-500/30 text-red-400"
                                  : "border-blue-500/30 text-blue-400"
                              }`}
                            >
                              {doc.analysis_status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
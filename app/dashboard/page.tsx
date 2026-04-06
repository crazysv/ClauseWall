"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Search,
  X,
  Timer,
  ChevronRight,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  getRiskLevel,
  getStateName,
  getDocumentTypeLabel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/helpers";
import type {
  Document,
  PortfolioStats,
  RiskDataPoint,
  Achievement,
  ContractDeadline,
} from "@/types";
import { toast } from "sonner";

// Dashboard Components
import PortfolioStatsSection from "@/components/dashboard/portfolio-stats";
import RiskTrendChart from "@/components/dashboard/risk-trend-chart";
import AchievementsSection from "@/components/dashboard/achievements-section";
import InsightsSection from "@/components/dashboard/insights-section";
import { VaultCTA } from "@/components/vault/vault-cta";
import MyCollectivesSection from "@/components/collective/my-collectives-section";
import LawChangeDashboardWidget from "@/components/lawchange/law-change-dashboard-widget";
import ComplaintDashboardWidgetWrapper from "@/components/complaint/complaint-dashboard-widget-wrapper";

// Stats Logic
import {
  computePortfolioStats,
  buildRiskChartData,
} from "@/lib/stats/portfolio-stats";
import { computeAchievements } from "@/lib/stats/achievements";

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [chartData, setChartData] = useState<RiskDataPoint[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [contractsBuilt, setContractsBuilt] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showWrapped, setShowWrapped] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(
          `clausewall_wrapped_dismissed_${new Date().getFullYear()}`,
        ) !== "true"
      );
    }
    return true;
  });

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

  // Memoized filtered documents
  const filteredDocuments = useMemo(() => {
    return (documents || []).filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        (doc.original_filename || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (doc.summary || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        filterType === "all" || doc.document_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, filterType]);

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
        return <Clock className="h-4 w-4 text-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20">
        <Skeleton className="h-8 w-64 mb-2 bg-muted border-2 border-foreground" />
        <Skeleton className="h-4 w-48 mb-8 bg-muted border-2 border-foreground" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-28 rounded-lg bg-muted border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]"
            />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-lg mb-4 bg-muted border-2 border-foreground" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-16 rounded-lg bg-muted border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty State — No documents at all
  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20">
          <div className="text-center py-20 card-impact border-2 border-foreground shadow-[12px_12px_0px_0px_rgba(10,10,10,1)] rounded-lg p-10 mt-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Shield className="h-16 w-16 text-foreground mx-auto mb-6" />
              <h2 className="text-impact-heading text-foreground mb-3">
                Your Contract Portfolio
              </h2>
              <p className="text-lg md:text-xl text-foreground mb-8 max-w-2xl mx-auto border-2 border-transparent border-t-foregroundpt-4">
                Upload your first contract to start building your portfolio.
                Track risks, earn achievements, and get smarter about contracts.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/upload">
                  <Button className="button text-impact-heading border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] transition-all gap-2 py-6 text-lg">
                    <Upload className="h-5 w-5" />
                    Analyze Contract
                  </Button>
                </Link>
                <Link href="/builder">
                  <Button
                    variant="outline"
                    className="button border-2 border-foreground hover:bg-muted font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] transition-all gap-2 py-6 text-lg"
                  >
                    <Sparkles className="h-5 w-5 text-amber-500" />
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-impact-heading text-foreground">
              Your Contract Portfolio
            </h1>
            <p className="text-lg text-foreground mt-4 max-w-2xl font-bold">
              {documents.length} contract{documents.length !== 1 ? "s" : ""}{" "}
              analyzed
              {contractsBuilt > 0 && ` · ${contractsBuilt} built`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/builder">
              <Button
                variant="outline"
                size="sm"
                className="button border-2 border-foreground hover:bg-muted font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] transition-all gap-2 py-5 px-6 hidden sm:flex"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Build
              </Button>
            </Link>
            <Link href="/upload">
              <Button
                size="sm"
                className="button text-impact-heading border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] transition-all gap-2 py-5 px-6"
              >
                <Upload className="h-4 w-4" />
                Analyze New
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto py-8">

          <Tabs defaultValue="contracts" className="space-y-8">
            <TabsList className="bg-muted border-2 border-foreground p-1 h-auto flex flex-wrap gap-2 justify-start max-w-full rounded-lg shadow-[4px_4px_0_0_rgba(10,10,10,1)]">
              <TabsTrigger value="contracts" className="font-black uppercase tracking-wider text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-[2px_2px_0_0_rgba(10,10,10,1)] px-4 py-2 hover:-translate-y-0.5 transition-transform">My Contracts</TabsTrigger>
              <TabsTrigger value="intelligence" className="font-black uppercase tracking-wider text-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-[2px_2px_0_0_rgba(10,10,10,1)] px-4 py-2 hover:-translate-y-0.5 transition-transform">Intelligence Map</TabsTrigger>
              <TabsTrigger value="workspace" className="font-black uppercase tracking-wider text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white border-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-[2px_2px_0_0_rgba(10,10,10,1)] px-4 py-2 hover:-translate-y-0.5 transition-transform">Workspace & Discovery</TabsTrigger>
            </TabsList>

            {/* TAB 1: MY CONTRACTS */}
            <TabsContent value="contracts" className="space-y-8 mt-6 outline-none">
{/* ── SECTION 1: Portfolio Stats ── */}
          {stats && <PortfolioStatsSection stats={stats} />}

          {/* ── SECTION 3.6: Upcoming Deadlines ── */}
          <UpcomingDeadlinesSection />

          {/* ── SECTION 3.5: Contract Vault CTA ── */}
          {documents.length >= 2 && <VaultCTA />}

          {/* ── SECTION 4: Recent Documents ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] rounded-lg overflow-hidden bg-background mt-10"
          >
            <div className="bg-muted px-6 py-4 border-b-2 border-foreground">
              <h2 className="text-xl font-black uppercase tracking-wider text-foreground mb-4">
                Recent Documents
              </h2>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground" />
                  <input
                    type="text"
                    placeholder="Search by filename..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm font-bold bg-background border-2 border-foreground rounded shadow-[inset_2px_2px_0px_0px_rgba(10,10,10,0.05)] text-foreground placeholder:text-foreground focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 text-sm font-bold bg-background border-2 border-foreground rounded shadow-[inset_2px_2px_0px_0px_rgba(10,10,10,0.05)] text-foreground focus:outline-none focus:border-primary cursor-pointer min-w-[160px]"
                >
                  <option value="all">All Types</option>
                  <option value="rental">Rental</option>
                  <option value="employment">Employment</option>
                  <option value="loan">Loan</option>
                  <option value="freelance">Freelance</option>
                  <option value="nda">NDA</option>
                  <option value="tos">Terms of Service</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Results count */}
              {(searchQuery || filterType !== "all") && (
                <p className="text-xs font-bold text-foreground mt-3 uppercase tracking-wider">
                  Showing {filteredDocuments.length} of {documents.length}{" "}
                  documents
                </p>
              )}
            </div>

            <div className="divide-y-2 divide-foreground">
              {filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-background">
                  <Search className="w-12 h-12 text-foreground mb-4" />
                  {searchQuery || filterType !== "all" ? (
                    <>
                      <p className="text-sm font-black uppercase text-foreground mb-1">
                        No matching documents
                      </p>
                      <p className="text-xs font-bold text-foreground mb-4">
                        Try adjusting your search or filters
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterType("all");
                        }}
                        className="text-xs font-black uppercase tracking-wider text-primary hover:text-red-700 transition-colors"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black uppercase text-foreground mb-1">
                        No contracts analyzed yet
                      </p>
                      <p className="text-xs font-bold text-foreground mb-4">
                        Upload your first contract to get started
                      </p>
                      <Link
                        href="/upload"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wider bg-primary border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] text-primary-foreground hover:-translate-y-[1px] transition-transform"
                      >
                        <Upload className="w-4 h-4" />
                        Analyze a Contract
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                filteredDocuments.map((doc, index) => {
                  const riskLevel = getRiskLevel(doc.overall_risk_score);
                  const riskColor = RISK_COLORS[riskLevel];

                  return (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/results/${doc.id}`)}
                      className="group bg-background hover:bg-muted/50 transition-colors cursor-pointer block"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          {/* Left Side */}
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="h-12 w-12 border-2 border-foreground flex items-center justify-center flex-shrink-0 bg-background shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                              <span
                                className="text-lg font-black tracking-tighter"
                                style={{
                                  color:
                                    riskColor === "#a855f7"
                                      ? "#9333ea"
                                      : riskColor,
                                }}
                              >
                                {doc.overall_risk_score ?? "-"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {getStatusIcon(doc.analysis_status)}
                                <p className="font-bold text-sm truncate text-foreground">
                                  {doc.original_filename || "Untitled Document"}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                                <span>
                                  {getDocumentTypeLabel(doc.document_type)}
                                </span>
                                <span className="opacity-50">·</span>
                                <span>{getStateName(doc.jurisdiction)}</span>
                                <span className="opacity-50">·</span>
                                <span>{formatDate(doc.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side */}
                          <div className="flex items-center flex-col sm:flex-row gap-2 flex-shrink-0">
                            {doc.analysis_status === "completed" && (
                              <div className="hidden sm:flex items-center gap-2 mr-4">
                                {doc.illegal_count > 0 && (
                                  <Badge className="bg-purple-100 text-purple-800 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(147,51,234,1)] text-[10px] uppercase font-black px-2">
                                    {doc.illegal_count} illegal
                                  </Badge>
                                )}
                                {doc.dangerous_count > 0 && (
                                  <Badge className="bg-red-100 text-red-800 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] text-[10px] uppercase font-black px-2">
                                    {doc.dangerous_count} danger
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-black uppercase tracking-wider bg-background border-2 border-foreground ${
                                  doc.analysis_status === "completed"
                                    ? "shadow-[2px_2px_0px_0px_rgba(22,163,74,1)] text-green-700"
                                    : doc.analysis_status === "failed"
                                      ? "shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] text-red-700"
                                      : "shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] text-blue-700"
                                }`}
                              >
                                {doc.analysis_status}
                              </Badge>

                              <div className="hidden md:flex ml-2 items-center text-xs font-black uppercase tracking-wider text-primary group-hover:text-red-700 transition-colors">
                                View <ChevronRight className="w-4 h-4 ml-1" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
            </TabsContent>

            {/* TAB 2: INTELLIGENCE MAP */}
            <TabsContent value="intelligence" className="space-y-8 mt-6 outline-none">
{/* ── SECTION 2: Chart + Insights (side by side on desktop) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <RiskTrendChart data={chartData} />
            </div>
            <div className="lg:col-span-2">
              {stats && <InsightsSection stats={stats} documents={documents} />}
            </div>
          </div>

          {/* ── SECTION 3.7: Law Monitor ── */}
          <LawChangeDashboardWidget />

          {/* ── CONTRACT WRAPPED CTA ── */}
          {showWrapped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(236,72,153,1)] bg-pink-100 rounded-lg overflow-hidden relative">
                {/* Dismiss button */}
                <button
                  onClick={() => {
                    setShowWrapped(false);
                    if (typeof window !== "undefined") {
                      localStorage.setItem(
                        `clausewall_wrapped_dismissed_${currentYear}`,
                        "true",
                      );
                    }
                  }}
                  className="absolute top-3 right-3 p-1.5 border-2 border-foreground rounded hover:bg-pink-200 transition-colors z-10"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-foreground font-black" />
                </button>

                <CardContent className="relative p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 border-2 border-foreground bg-pink-400 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
                        <Gift className="h-8 w-8 text-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black uppercase tracking-wider text-foreground">
                            Your {currentYear} Contract Wrapped
                          </h3>
                          <Badge className="bg-pink-500 text-foreground border-2 border-foreground font-black uppercase shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] px-2">
                            NEW
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-pink-900 max-w-md">
                          See your contract journey — stats, savings, badges &
                          more!
                        </p>
                      </div>
                    </div>
                    <Link href="/wrapped">
                      <Button className="button border-2 border-foreground bg-pink-500 hover:bg-pink-600 text-foreground text-impact-heading shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] transition-all gap-2 py-6 px-6 w-full sm:w-auto">
                        <Sparkles className="h-5 w-5" />
                        View Wrapped
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

                      </TabsContent>

            {/* TAB 3: WORKSPACE & DISCOVERY */}
            <TabsContent value="workspace" className="space-y-8 mt-6 outline-none">
{/* ── SECTION 3.55: Live Negotiation CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] bg-blue-100 rounded-lg overflow-hidden relative">
              <CardContent className="relative p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 border-2 border-foreground bg-blue-400 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
                      <Handshake className="h-8 w-8 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black uppercase tracking-wider text-foreground">
                          Live Negotiation Companion
                        </h3>
                        <Badge className="bg-blue-500 text-foreground border-2 border-foreground font-black uppercase shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] px-2 animate-pulse">
                          NEW
                        </Badge>
                      </div>
                      <p className="text-sm font-bold text-blue-900">
                        Real-time legal intelligence for in-person negotiations
                      </p>
                    </div>
                  </div>
                  <Link href="/negotiate/live">
                    <Button className="button border-2 border-foreground bg-blue-500 hover:bg-blue-600 text-foreground text-impact-heading shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[2px] transition-all gap-2 py-6 px-6 w-full sm:w-auto">
                      <Handshake className="h-5 w-5" />
                      Start Session
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── SECTION 3.58: My Collectives ── */}
          <MyCollectivesSection />

          {/* ── SECTION 3.8: Complaint Filings ── */}
          <ComplaintDashboardWidgetWrapper />

          {/* ── SECTION 3: Achievements ── */}
          {achievements.length > 0 && (
            <AchievementsSection achievements={achievements} />
          )}

                      </TabsContent>
          </Tabs>

                  </div>
      </div>
    </div>
  );
}

// ---- Dashboard Upcoming Deadlines Section ----
function UpcomingDeadlinesSection() {
  const [deadlines, setDeadlines] = useState<ContractDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        // We'll fetch from a simple endpoint — get all documents and check for activated ones
        const supabase = createClient();
        const { data } = await supabase
          .from("contract_deadlines")
          .select("*")
          .in("status", ["upcoming", "warning", "urgent"])
          .order("deadline_date", { ascending: true })
          .limit(3);
        setDeadlines((data as ContractDeadline[]) || []);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  if (loading || deadlines.length === 0) return null;

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-4 mt-8">
        <h2 className="text-xl font-black uppercase tracking-wider text-foreground flex items-center gap-2">
          <Timer className="w-5 h-5 text-orange-600" />
          Upcoming Deadlines
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {deadlines.map((d) => {
          const days = getDaysUntil(d.deadline_date);
          const color =
            days <= 3
              ? "border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] bg-red-50"
              : days <= 7
                ? "border-orange-500 shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] bg-orange-50"
                : days <= 30
                  ? "border-yellow-500 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)] bg-yellow-50"
                  : "border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background";
          const textColor =
            days <= 3
              ? "text-red-900 dark:text-red-100 font-bold"
              : days <= 7
                ? "text-orange-900 dark:text-orange-100 font-bold"
                : days <= 30
                  ? "text-yellow-900 dark:text-yellow-100 font-bold"
                  : "text-foreground";

          return (
            <Link
              key={d.id}
              href={`/timebomb/${d.document_id}`}
              className={`border-2 p-5 hover:-translate-y-[2px] transition-transform group rounded-none mb-2 block ${color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 border-2 border-current bg-background ${textColor}`}
                >
                  {days <= 0 ? "OVERDUE" : `${days}D REC. LEFT`}
                </span>
                <ChevronRight className="w-4 h-4 text-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {d.title}
              </p>
              <p className="text-xs font-bold text-foreground mt-2 uppercase tracking-wider">
                {new Date(d.deadline_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

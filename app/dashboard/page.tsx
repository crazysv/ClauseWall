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
  Terminal,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
        toast.error("SYSTEM ERROR: FAILED TO MOUNT DASHBOARD DATA");
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
        return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case "analyzing":
      case "pending":
        return <Loader2 className="h-3 w-3 text-cyan-500 animate-spin" />;
      case "failed":
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-neutral-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] p-4 sm:p-8 max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20">
        <div className="flex flex-col gap-2 mb-8">
           <Skeleton className="h-6 w-48 bg-neutral-900 border border-neutral-800" />
           <Skeleton className="h-3 w-32 bg-neutral-900" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="h-28 bg-[#0a0a0a] border border-neutral-900"
            />
          ))}
        </div>
        <Skeleton className="h-10 w-full mb-4 bg-neutral-900 border border-neutral-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-16 bg-[#0a0a0a] border border-neutral-900"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty State — No documents at all
  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20">
          <div className="text-center py-24 bg-[#0a0a0a] border border-neutral-900 relative overflow-hidden mt-10">
            <div className="absolute top-0 left-0 w-full h-1 bg-neutral-800" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Terminal className="h-12 w-12 text-neutral-500 mx-auto mb-6" />
              <h2 className="text-xl font-mono uppercase tracking-widest text-neutral-300 mb-3">
                [ INIT: PORTFOLIO EMPTY ]
              </h2>
              <p className="text-xs font-mono text-neutral-500 mb-8 max-w-lg mx-auto leading-relaxed">
                NO ACTIVE CONTRACT NODES DETECTED. INGEST CONTRACT TO BEGIN INTELLIGENCE EXTRACTION EXERCISE.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/upload">
                  <div className="group relative px-6 py-3 bg-[#050505] border border-neutral-700 hover:border-cyan-500/50 transition-colors cursor-pointer flex items-center gap-3">
                     <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                     <Upload className="h-4 w-4 text-cyan-500 relative z-10" />
                     <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-500 relative z-10">
                       [ INGEST_NEW_CONTRACT ]
                     </span>
                  </div>
                </Link>
                <Link href="/builder">
                  <div className="group relative px-6 py-3 bg-[#050505] border border-neutral-800 hover:border-amber-500/50 transition-colors cursor-pointer flex items-center gap-3">
                     <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                     <Sparkles className="h-4 w-4 text-amber-500 relative z-10" />
                     <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500 relative z-10">
                       [ DEPLOY_FAIR_CONTRACT ]
                     </span>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-8">
        {/* Header */}
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-neutral-900 pb-8"
        >
          <div>
            <h1 className="text-3xl font-mono uppercase tracking-widest text-neutral-200 flex items-center gap-3">
               <Activity className="h-6 w-6 text-cyan-500" />
               [ COMMAND CENTER ]
            </h1>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-[10px] font-mono tracking-widest uppercase border border-neutral-800 bg-[#0a0a0a] px-2 py-0.5 text-neutral-400">
                 ACTIVE_NODES: {documents.length}
              </span>
              {contractsBuilt > 0 && (
                <span className="text-[10px] font-mono tracking-widest uppercase border border-amber-900/30 bg-amber-950/20 px-2 py-0.5 text-amber-500">
                   DEPLOYED: {contractsBuilt}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <Link href="/builder">
               <div className="group relative px-5 py-2.5 bg-[#0a0a0a] border border-neutral-800 hover:border-amber-500/50 transition-colors cursor-pointer flex items-center gap-2">
                  <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                  <Sparkles className="h-3 w-3 text-amber-500 relative z-10" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500 relative z-10">
                    [ BUILD_FAIR_CONTRACT ]
                  </span>
               </div>
             </Link>
             <Link href="/upload">
               <div className="group relative px-5 py-2.5 bg-[#0a0a0a] border border-neutral-800 hover:border-cyan-500/50 transition-colors cursor-pointer flex items-center gap-2">
                  <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                  <Upload className="h-3 w-3 text-cyan-500 relative z-10" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-500 relative z-10">
                    [ INGEST_NEW ]
                  </span>
               </div>
             </Link>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto py-4">

          <Tabs defaultValue="contracts" className="space-y-12">
            <TabsList className="bg-transparent border-b border-neutral-900 h-auto flex gap-6 justify-start max-w-full rounded-none p-0">
               <TabsTrigger 
                 value="contracts" 
                 className="font-mono uppercase tracking-widest text-[10px] data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 text-neutral-500 border-b-2 border-transparent data-[state=active]:border-cyan-500 rounded-none px-0 py-3 shadow-none transition-colors"
               >
                 [ MY_DOCUMENTS ]
               </TabsTrigger>
               <TabsTrigger 
                 value="intelligence" 
                 className="font-mono uppercase tracking-widest text-[10px] data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 text-neutral-500 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none px-0 py-3 shadow-none transition-colors"
               >
                 [ INTELLIGENCE_MAP ]
               </TabsTrigger>
               <TabsTrigger 
                 value="workspace" 
                 className="font-mono uppercase tracking-widest text-[10px] data-[state=active]:bg-transparent data-[state=active]:text-amber-400 text-neutral-500 border-b-2 border-transparent data-[state=active]:border-amber-500 rounded-none px-0 py-3 shadow-none transition-colors"
               >
                 [ WORKSPACE_&_DISCOVERY ]
               </TabsTrigger>
            </TabsList>

            {/* TAB 1: MY CONTRACTS */}
            <TabsContent value="contracts" className="space-y-8 mt-6 outline-none">
              {/* NOTE: Child components may retain brutalist styles temporarily until their specific audits. */}
              {stats && <PortfolioStatsSection stats={stats} />}

              <UpcomingDeadlinesSection />

              {documents.length >= 2 && <VaultCTA />}

              {/* SECTION: Recent Documents */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#0a0a0a] border border-neutral-900 mt-12"
              >
                <div className="px-6 py-4 border-b border-neutral-900 bg-[#050505]">
                  <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                     <Terminal className="h-3 w-3" />
                     [ DOC_ARCHIVE: RECENT INGESTION STREAM ]
                  </h2>

                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-700" />
                      <input
                        type="text"
                        placeholder="ENTER QUERY / FILENAME"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-[10px] font-mono uppercase bg-[#050505] border border-neutral-800 text-neutral-300 placeholder:text-neutral-700 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2.5 text-[10px] font-mono uppercase bg-[#050505] border border-neutral-800 text-neutral-400 focus:outline-none focus:border-cyan-500/50 min-w-[160px]"
                    >
                      <option value="all">[ ALL_TYPES ]</option>
                      <option value="rental">RENTAL</option>
                      <option value="employment">EMPLOYMENT</option>
                      <option value="loan">LOAN</option>
                      <option value="freelance">FREELANCE</option>
                      <option value="nda">NDA</option>
                      <option value="tos">TERMS OF SERVICE</option>
                      <option value="other">OTHER</option>
                    </select>
                  </div>

                  {(searchQuery || filterType !== "all") && (
                    <p className="text-[9px] font-mono text-cyan-600 mt-3 tracking-widest uppercase">
                      QUERY RESULTS: {filteredDocuments.length} / {documents.length} ENTITIES LOCATED
                    </p>
                  )}
                </div>

                <div className="divide-y divide-neutral-900/50">
                  {filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#050505]">
                      <Search className="w-8 h-8 text-neutral-800 mb-4" />
                      {searchQuery || filterType !== "all" ? (
                        <>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
                            [ NO_MATCHES_FOUND ]
                          </p>
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setFilterType("all");
                            }}
                            className="text-[9px] font-mono uppercase tracking-widest text-cyan-600 hover:text-cyan-400 mt-4 transition-colors"
                          >
                            [ CLEAR_QUERY_PARAMETERS ]
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
                            [ ARCHIVE_EMPTY ]
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const riskLevel = getRiskLevel(doc.overall_risk_score);
                      const riskColor = RISK_COLORS[riskLevel] || "#3b82f6";

                      return (
                        <div
                          key={doc.id}
                          onClick={() => router.push(`/results/${doc.id}`)}
                          className="group bg-[#0a0a0a] hover:bg-[#111111] transition-colors cursor-pointer block border-l-2 border-transparent hover:border-cyan-500/50"
                        >
                          <div className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4">
                              {/* Left Side */}
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="h-10 w-10 flex items-center justify-center flex-shrink-0 bg-[#050505] border border-neutral-900 rounded-sm overflow-hidden relative">
                                  <div className="absolute inset-x-0 bottom-0 top-auto h-0.5" style={{ backgroundColor: riskColor, opacity: 0.5 }} />
                                  <span
                                    className="text-[14px] font-mono tracking-tighter"
                                    style={{ color: riskColor === "#a855f7" ? "#c084fc" : riskColor }}
                                  >
                                    {doc.overall_risk_score ?? "-"}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {getStatusIcon(doc.analysis_status)}
                                    <p className="font-mono text-xs truncate text-neutral-200">
                                      {doc.original_filename || "UNNAMED_ENTITY"}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                                    <span>{getDocumentTypeLabel(doc.document_type)}</span>
                                    <span className="opacity-30">/</span>
                                    <span>{getStateName(doc.jurisdiction)}</span>
                                    <span className="opacity-30">/</span>
                                    <span>{formatDate(doc.created_at)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Side */}
                              <div className="flex items-center flex-col sm:flex-row gap-4 flex-shrink-0">
                                {doc.analysis_status === "completed" && (
                                  <div className="hidden sm:flex items-center gap-2">
                                    {doc.illegal_count > 0 && (
                                      <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 border border-purple-900/40 text-purple-400 bg-purple-950/20">
                                        ILLEGAL:{doc.illegal_count}
                                      </span>
                                    )}
                                    {doc.dangerous_count > 0 && (
                                      <span className="text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 border border-red-900/40 text-red-400 bg-red-950/20">
                                        DANGER:{doc.dangerous_count}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${
                                      doc.analysis_status === "completed"
                                        ? "border-emerald-900/30 text-emerald-500 bg-emerald-950/10"
                                        : doc.analysis_status === "failed"
                                          ? "border-red-900/30 text-red-500 bg-red-950/10"
                                          : "border-cyan-900/30 text-cyan-500 bg-cyan-950/10"
                                    }`}
                                  >
                                    [{doc.analysis_status}]
                                  </span>

                                  <div className="hidden md:flex items-center text-[9px] font-mono uppercase tracking-widest text-neutral-600 group-hover:text-cyan-500 transition-colors">
                                    OPEN <ChevronRight className="w-3 h-3 ml-0.5" />
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
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  {/* NOTE: Child component styling untouched */}
                  <RiskTrendChart data={chartData} />
                </div>
                <div className="lg:col-span-2">
                  {stats && <InsightsSection stats={stats} documents={documents} />}
                </div>
              </div>

              <LawChangeDashboardWidget />

              {/* Wrapped CTA Redesign */}
              {showWrapped && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="bg-pink-950/10 border border-pink-900/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                    
                    <button
                      onClick={() => {
                        setShowWrapped(false);
                        if (typeof window !== "undefined") {
                          localStorage.setItem(`clausewall_wrapped_dismissed_${currentYear}`, "true");
                        }
                      }}
                      className="absolute top-2 right-2 p-1 text-pink-700 hover:text-pink-400 transition-colors z-10"
                      aria-label="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="h-10 w-10 flex items-center justify-center bg-pink-950/30 border border-pink-900/50">
                            <Gift className="h-5 w-5 text-pink-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-[12px] font-mono uppercase tracking-widest text-pink-100">
                                {currentYear}_CONTRACT_WRAPPED
                              </h3>
                              <span className="text-[8px] font-mono text-pink-400 border border-pink-500/50 px-1 py-0.5 animate-pulse">
                                [ SYSTEM ALERT ]
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-pink-600/80 uppercase tracking-widest">
                              ANNUAL TELEMETRY COMPILED. VIEW SAVINGS AND BADGES.
                            </p>
                          </div>
                        </div>
                        <Link href="/wrapped" className="w-full sm:w-auto">
                           <div className="group relative px-5 py-2.5 bg-pink-950/20 border border-pink-800 hover:border-pink-500 transition-colors cursor-pointer flex items-center justify-center gap-2">
                             <Sparkles className="h-3 w-3 text-pink-400" />
                             <span className="font-mono text-[9px] uppercase tracking-widest text-pink-400 group-hover:text-pink-300">
                               [ INIT_WRAPPED ]
                             </span>
                           </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            {/* TAB 3: WORKSPACE & DISCOVERY */}
            <TabsContent value="workspace" className="space-y-8 mt-6 outline-none">
              
              {/* Live Negotiation CTA Redesign */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-blue-950/10 border border-blue-900/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="h-10 w-10 flex items-center justify-center bg-blue-950/30 border border-blue-900/50">
                          <Handshake className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-[12px] font-mono uppercase tracking-widest text-blue-100">
                              LIVE NEGOTIATION COMPANION
                            </h3>
                            <span className="text-[8px] font-mono text-blue-400 border border-blue-500/50 px-1 py-0.5 animate-pulse">
                              [ REALTIME_MODULE ]
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-blue-600/80 uppercase tracking-widest">
                            TACTICAL INTELLIGENCE UPLINK FOR IN-PERSON DISPUTES.
                          </p>
                        </div>
                      </div>
                      <Link href="/negotiate/live" className="w-full sm:w-auto">
                         <div className="group relative px-5 py-2.5 bg-blue-950/20 border border-blue-800 hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-center gap-2">
                           <Handshake className="h-3 w-3 text-blue-400" />
                           <span className="font-mono text-[9px] uppercase tracking-widest text-blue-400 group-hover:text-blue-300">
                             [ ENGAGE_SESSION ]
                           </span>
                         </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>

              <MyCollectivesSection />
              <ComplaintDashboardWidgetWrapper />

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
      transition={{ delay: 0.1 }}
      className="mt-8 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
          <Timer className="w-3 h-3 text-orange-500" />
          [ TIMEBOMB_DECTECTOR: OBLIGATION DEADLINES ]
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {deadlines.map((d) => {
          const days = getDaysUntil(d.deadline_date);
          const isUrgent = days <= 3;
          const isWarning = days > 3 && days <= 7;
          
          let borderColor = "border-neutral-900";
          let bgColor = "bg-[#0a0a0a]";
          let accentColor = "text-neutral-500";
          let badgeClass = "text-neutral-500 border-neutral-800";

          if (isUrgent) {
             borderColor = "border-red-900/50";
             bgColor = "bg-red-950/10";
             accentColor = "text-red-400";
             badgeClass = "text-red-400 border-red-900/50 bg-red-950/20";
          } else if (isWarning) {
             borderColor = "border-orange-900/50";
             bgColor = "bg-orange-950/10";
             accentColor = "text-orange-400";
             badgeClass = "text-orange-400 border-orange-900/50 bg-orange-950/20";
          } else if (days <= 30) {
             borderColor = "border-yellow-900/30";
             badgeClass = "text-yellow-500 border-yellow-900/30";
             accentColor = "text-yellow-500";
          }

          return (
            <Link
              key={d.id}
              href={`/timebomb/${d.document_id}`}
              className={`block border p-4 ${borderColor} ${bgColor} hover:bg-[#111111] transition-colors relative group`}
            >
              {isUrgent && <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500" />}
              {isWarning && <div className="absolute top-0 left-0 w-full h-0.5 bg-orange-500" />}

              <div className="flex items-center justify-between mb-3">
                <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${badgeClass}`}>
                  {days <= 0 ? "[ DEADLINE_BREACHED ]" : `[ T_MINUS: ${days}D ]`}
                </span>
                <ChevronRight className="w-3 h-3 text-neutral-600 group-hover:text-cyan-500 transition-colors" />
              </div>
              <p className="text-[11px] font-mono text-neutral-200 truncate mt-2">
                {d.title}
              </p>
              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1.5 ${accentColor}`}>
                EXECUTE BY: {new Date(d.deadline_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).replace(/ /g, '-')}
              </p>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Skull,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Flag,
  Loader2,
  Search,
  Shield,
  Users,
  ArrowRight,
  ExternalLink,
  Filter,
  Building2,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getStateName, JURISDICTIONS } from "@/lib/utils/constants";
import type { FlaggedEntity } from "@/types";

export default function WallOfShamePage() {
  const [entities, setEntities] = useState<FlaggedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJurisdiction, setFilterJurisdiction] = useState("all");
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [marketAvgRisk, setMarketAvgRisk] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const { data, error } = await supabase
          .from("flagged_entities")
          .select("*")
          .order("total_flags", { ascending: false })
          .limit(100);

        if (error) throw error;
        setEntities((data as FlaggedEntity[]) || []);

        // Get total documents count for stats
        const { count } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("analysis_status", "completed");

        setTotalDocuments(count || 0);

        // Fetch market average risk score
        try {
          const marketRes = await fetch("/api/market/stats");
          const marketData = await marketRes.json();
          if (marketData.success && marketData.stats) {
            // Use entity_risk_summary or overall average
            const { data: benchmarkData } = await supabase
              .from("market_benchmarks")
              .select("mean_value")
              .eq("benchmark_type", "overall_risk_score")
              .eq("scope_type", "national")
              .maybeSingle();
            if (benchmarkData?.mean_value) {
              setMarketAvgRisk(Math.round(benchmarkData.mean_value));
            }
          }
        } catch {
          // Non-critical — market comparison is optional
        }
      } catch (err) {
        console.error("Failed to load entities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, []);

  // Filter entities
  const filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      searchQuery === "" ||
      entity.entity_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesJurisdiction =
      filterJurisdiction === "all" ||
      entity.jurisdiction === filterJurisdiction;

    return matchesSearch && matchesJurisdiction;
  });

  // Stats
  const totalFlags = entities.reduce((sum, e) => sum + (e.total_flags || 0), 0);
  const avgRiskScore =
    entities.length > 0
      ? Math.round(
          entities.reduce((sum, e) => sum + (e.avg_risk_score || 0), 0) /
            entities.length,
        )
      : 0;

  // Get rank badge
  const getRankBadge = (index: number) => {
    if (index === 0)
      return (
        <span className="text-2xl" title="Most flagged">
          🥇
        </span>
      );
    if (index === 1)
      return (
        <span className="text-2xl" title="2nd most flagged">
          🥈
        </span>
      );
    if (index === 2)
      return (
        <span className="text-2xl" title="3rd most flagged">
          🥉
        </span>
      );
    return (
      <div className="h-10 w-10 rounded-none bg-red-500/10 flex items-center justify-center">
        <span className="text-sm font-bold text-red-400">#{index + 1}</span>
      </div>
    );
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80)
      return (
        <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">
          ⛔ Critical
        </Badge>
      );
    if (score >= 60)
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
          🔴 High Risk
        </Badge>
      );
    if (score >= 30)
      return (
        <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px]">
          🟡 Medium
        </Badge>
      );
    return (
      <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px]">
        🟢 Low
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-red-500 animate-spin" />
        <p className="text-foreground">Loading Wall of Shame...</p>
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-red-500/10 mb-6">
            <Skull className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Wall of <span className="text-red-400">Shame</span>
          </h1>
          <p className="text-foreground max-w-lg mx-auto">
            Community-flagged entities with a history of predatory contracts.
            Check here before signing with any landlord, employer, or company.
          </p>
        </div>

        {/* Stats */}
        {entities.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {entities.length}
                </p>
                <p className="text-xs text-foreground">
                  Flagged Entities
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-400">
                  {totalFlags}
                </p>
                <p className="text-xs text-foreground">Total Flags</p>
              </CardContent>
            </Card>
            <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {avgRiskScore}
                </p>
                <p className="text-xs text-foreground">Avg Risk Score</p>
              </CardContent>
            </Card>
            <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {totalDocuments}
                </p>
                <p className="text-xs text-foreground">
                  Contracts Scanned
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input
              placeholder="Search by entity name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background border-2 border-foreground card-impact/50 border-foreground border-2"
            />
          </div>
          <Select
            value={filterJurisdiction}
            onValueChange={setFilterJurisdiction}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
              <Filter className="h-4 w-4 mr-2 text-foreground" />
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {JURISDICTIONS.map((j) => (
                <SelectItem key={j.value} value={j.value}>
                  {j.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Empty State */}
        {entities.length === 0 && (
          <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-background">
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Flagged Entities Yet
              </h3>
              <p className="text-foreground mb-6 max-w-md mx-auto">
                When users flag landlords, employers, or companies with
                predatory contracts, they&apos;ll appear here. Be the first to
                contribute!
              </p>
              <Link href="/upload">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Shield className="h-4 w-4" />
                  Analyze a Contract
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Filtered Empty State */}
        {entities.length > 0 && filteredEntities.length === 0 && (
          <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-background">
            <CardContent className="p-8 text-center">
              <Search className="h-8 w-8 text-foreground mx-auto mb-3" />
              <p className="text-foreground">
                No entities found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterJurisdiction("all");
                }}
                className="text-blue-400 text-sm mt-2 hover:underline"
              >
                Clear filters
              </button>
            </CardContent>
          </Card>
        )}

        {/* Entities List */}
        <div className="space-y-4">
          {filteredEntities.map((entity, index) => (
            <Card
              key={entity.id}
              className={`card-impact border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background hover:translate-y-1 hover:shadow-none transition-all overflow-hidden ${index < 3 ? "border-l-8 border-l-red-500" : ""}`}
            >
              {/* Top 3 get a red stripe */}
              {index < 3 && <div className="h-0.5 bg-red-500" />}

              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left Side */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getRankBadge(index)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {entity.entity_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-foreground mb-3">
                        <Badge
                          variant="outline"
                          className="text-xs border-foreground border-2"
                        >
                          {entity.entity_type}
                        </Badge>
                        {entity.jurisdiction && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {getStateName(entity.jurisdiction)}
                          </span>
                        )}
                        {getRiskBadge(entity.avg_risk_score)}
                        {marketAvgRisk !== null &&
                          entity.avg_risk_score > 0 && (
                            <Badge
                              className={`text-[10px] ${entity.avg_risk_score > marketAvgRisk ? "bg-red-500/10 text-red-800 dark:text-red-100 font-bold border-red-500/20" : "bg-green-500/10 text-green-800 dark:text-green-100 font-bold border-green-500/20"}`}
                            >
                              Market avg: {marketAvgRisk} | This entity:{" "}
                              {entity.avg_risk_score}
                            </Badge>
                          )}
                      </div>

                      {/* Common Violations */}
                      {entity.common_violations &&
                        entity.common_violations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entity.common_violations
                              .slice(0, 4)
                              .map((violation, i) => (
                                <Badge
                                  key={i}
                                  className="bg-red-500/10 text-red-800 dark:text-red-100 font-bold border-red-500/20 text-xs"
                                >
                                  {violation.length > 50
                                    ? violation.substring(0, 50) + "..."
                                    : violation}
                                </Badge>
                              ))}
                          </div>
                        )}

                      {/* Collective info */}
                      {entity.total_flags >= 3 && (
                        <div className="mt-2">
                          <Link href={`/collective`}>
                            <Badge className="bg-amber-500/10 text-amber-800 dark:text-amber-100 font-bold border-amber-500/20 text-xs gap-1.5 cursor-pointer hover:bg-amber-500/20 transition-colors">
                              <Users className="h-3 w-3" />
                              Collective Available — Join {entity.total_flags}+
                              affected people
                              <ArrowRight className="h-3 w-3" />
                            </Badge>
                          </Link>
                        </div>
                      )}

                      {/* File Complaint at Authority */}
                      <div className="mt-2">
                        <Link
                          href={`/authority?entity=${encodeURIComponent(entity.entity_name)}&jurisdiction=${entity.jurisdiction || "general"}`}
                        >
                          <Badge className="bg-purple-500/10 text-purple-800 dark:text-purple-100 font-bold border-purple-500/20 text-xs gap-1.5 cursor-pointer hover:bg-purple-500/20 transition-colors">
                            <Gavel className="h-3 w-3" />
                            File complaint →{" "}
                            {(entity.entity_type as string) === "landlord"
                              ? "Rent Authority"
                              : (entity.entity_type as string) === "employer"
                                ? "Labour Court"
                                : (entity.entity_type as string) === "bank" ||
                                    (entity.entity_type as string) === "nbfc"
                                  ? "RBI Ombudsman"
                                  : (entity.entity_type as string) ===
                                      "insurance"
                                    ? "IRDAI"
                                    : (entity.entity_type as string) ===
                                        "telecom"
                                      ? "TRAI/TDSAT"
                                      : "Consumer Forum"}
                            {entity.jurisdiction
                              ? ` in ${getStateName(entity.jurisdiction)}`
                              : ""}
                          </Badge>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="h-4 w-4 text-red-400" />
                      <span className="text-2xl font-bold text-red-400">
                        {entity.total_flags}
                      </span>
                    </div>
                    <p className="text-xs text-foreground mb-2">flags</p>
                    {entity.avg_risk_score > 0 && (
                      <div className="flex items-center gap-1 text-sm text-foreground justify-end">
                        <TrendingUp className="h-3 w-3" />
                        Avg: {entity.avg_risk_score}/100
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        {entities.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-foreground mb-4">
              Know a predatory landlord or company? Help others by flagging
              them.
            </p>
            <Link href="/upload">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Shield className="h-4 w-4" />
                Analyze & Flag a Contract
              </Button>
            </Link>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 p-4 border-4 border-yellow-500 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)] bg-background">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium mb-1">Disclaimer</p>
              <p className="text-yellow-300/80">
                This list is community-generated based on anonymous user
                reports. Being listed here does not constitute a legal judgment.
                Always verify information independently and consult legal
                professionals when needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

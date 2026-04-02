"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Scale,
  BookOpen,
  Gavel,
  Building2,
  ShieldCheck,
  Trophy,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Landmark,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClauseGraphContext, GraphVisualizationData } from "@/lib/graph/types";
import { GraphCanvas } from "@/components/graph/graph-canvas";

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  clauseType: string;
  jurisdiction: string;
  clauseText: string;
  riskLevel: string;
}

type ViewMode = "details" | "graph";

interface ExpandedSections {
  laws: boolean;
  cases: boolean;
  authorities: boolean;
  penalties: boolean;
  interpretations: boolean;
  remedies: boolean;
}

export function KnowledgeGraphModal({
  isOpen,
  onClose,
  clauseType,
  jurisdiction,
  clauseText,
  riskLevel,
}: KnowledgeGraphModalProps) {
  const [context, setContext] = useState<ClauseGraphContext | null>(null);
  const [graphData, setGraphData] = useState<GraphVisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("details");
  const [expanded, setExpanded] = useState<ExpandedSections>({
    laws: true,
    cases: true,
    authorities: false,
    penalties: false,
    interpretations: false,
    remedies: false,
  });

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [contextRes, graphRes] = await Promise.all([
        fetch(
          `/api/graph/clause?clauseType=${encodeURIComponent(clauseType)}&jurisdiction=${encodeURIComponent(jurisdiction)}`
        ),
        fetch(
          `/api/graph/traverse?clauseType=${encodeURIComponent(clauseType)}&jurisdiction=${encodeURIComponent(jurisdiction)}&maxDepth=3`
        ),
      ]);

      if (contextRes.ok) {
        const contextData = await contextRes.json();
        setContext(contextData.context);
      }

      if (graphRes.ok) {
        const graphResult = await graphRes.json();
        setGraphData(graphResult.graph);
      }
    } catch (err) {
      setError("Failed to load knowledge graph data");
    } finally {
      setLoading(false);
    }
  }, [clauseType, jurisdiction]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const hasData =
    context &&
    (context.primary_law ||
      context.supporting_laws.length > 0 ||
      context.court_cases.length > 0 ||
      context.authorities.length > 0 ||
      context.penalties.length > 0);

  const outcomeLabel = (outcome: string | null) => {
    const map: Record<string, { label: string; color: string }> = {
      tenant_won: { label: "Tenant Won", color: "text-green-400" },
      employee_won: { label: "Employee Won", color: "text-green-400" },
      consumer_won: { label: "Consumer Won", color: "text-green-400" },
      borrower_won: { label: "Borrower Won", color: "text-green-400" },
      landlord_won: { label: "Landlord Won", color: "text-red-400" },
      employer_won: { label: "Employer Won", color: "text-red-400" },
      company_won: { label: "Company Won", color: "text-red-400" },
      lender_won: { label: "Lender Won", color: "text-red-400" },
      mixed: { label: "Mixed", color: "text-yellow-400" },
      settled: { label: "Settled", color: "text-blue-400" },
    };
    return map[outcome || ""] || { label: outcome || "Unknown", color: "text-slate-400" };
  };

  const formattedClauseType = clauseType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-[#0A0A0F] border-slate-800 p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Legal Knowledge Map</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Network className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Legal Web</h2>
              <p className="text-xs text-muted-foreground">
                {formattedClauseType} • {jurisdiction}
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode("details")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${ viewMode === "details" ? "bg-white dark:bg-slate-900/10 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-300" }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Details
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${ viewMode === "graph" ? "bg-white dark:bg-slate-900/10 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-300" }`}
            >
              <Network className="h-3.5 w-3.5" />
              Graph
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading legal web data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertTriangle className="h-8 w-8 text-yellow-400 mb-3" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
                Try Again
              </Button>
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Network className="h-8 w-8 text-slate-600 dark:text-slate-400 mb-3" />
              <p className="text-sm text-muted-foreground">
                No knowledge graph data available for this clause type yet.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">The graph database is being expanded.</p>
            </div>
          ) : viewMode === "graph" ? (
            /* ═══ D3 GRAPH VIEW ═══ */
            <div className="relative w-full aspect-[3/2] bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 rounded-xl overflow-hidden border border-white/5">
              {graphData && graphData.nodes.length > 0 ? (
                <GraphCanvas data={graphData} highlightType={clauseType} />
              ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No graph visualization available</p>
                  </div>
                )}
              </div>
            ) : (
            /* ═══ DETAILS VIEW ═══ */
            <div className="space-y-4">
              {/* Stats Bar */}
              {context && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {context.win_rate !== null && (
                    <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15 text-center">
                      <Trophy className="h-4 w-4 text-green-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-400">{context.win_rate}%</p>
                      <p className="text-[10px] text-muted-foreground">Win Rate</p>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-blue-500/15 text-center">
                    <Landmark className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-400">{context.total_related_cases}</p>
                    <p className="text-[10px] text-muted-foreground">Court Cases</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-center">
                    <Scale className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-purple-400">
                      {(context.supporting_laws?.length || 0) + (context.primary_law ? 1 : 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Laws</p>
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15 text-center">
                    <Building2 className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-yellow-400">{context.authorities.length}</p>
                    <p className="text-[10px] text-muted-foreground">Authorities</p>
                  </div>
                </div>
              )}

              {/* ── PRIMARY LAW ── */}
              {context?.primary_law && (
                <CollapsibleSection
                  title="Primary Applicable Law"
                  icon={<Scale className="h-4 w-4 text-blue-400" />}
                  isOpen={expanded.laws}
                  onToggle={() => toggleSection("laws")}
                  count={(context.supporting_laws?.length || 0) + 1}
                  color="blue"
                >
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-indigo-500/5 border border-blue-500/15">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">
                          {context.primary_law.name}
                        </span>
                      </div>
                      <p className="text-xs text-blue-200/70">{context.primary_law.section}</p>
                      {context.primary_law.description && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {context.primary_law.description}
                        </p>
                      )}
                    </div>

                    {context.supporting_laws.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Supporting Laws</p>
                        {context.supporting_laws.map((law, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 mb-2 p-2 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-slate-300">
                                {law.name} — {law.section}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{law.relationship}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* ── COURT CASES ── */}
              {context && context.court_cases.length > 0 && (
                <CollapsibleSection
                  title="Court Cases & Precedents"
                  icon={<Gavel className="h-4 w-4 text-green-400" />}
                  isOpen={expanded.cases}
                  onToggle={() => toggleSection("cases")}
                  count={context.court_cases.length}
                  color="green"
                >
                  <div className="space-y-3">
                    {context.court_cases.map((c, i) => {
                      const outcome = outcomeLabel(c.outcome);
                      return (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-green-500/5 border border-green-500/15"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-green-300">
                                {c.case_name}
                              </span>
                              {c.is_landmark && (
                                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[9px]">
                                  ⭐ Landmark
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {c.year}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1.5">{c.court}</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{c.key_ruling}</p>
                          <div className="mt-2">
                            <Badge
                              className={`text-[10px] ${outcome.color} bg-white dark:bg-slate-900/5 border-white/10`}
                            >
                              {outcome.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              )}

              {/* ── AUTHORITIES ── */}
              {context && context.authorities.length > 0 && (
                <CollapsibleSection
                  title="Where to Complain"
                  icon={<Building2 className="h-4 w-4 text-yellow-400" />}
                  isOpen={expanded.authorities}
                  onToggle={() => toggleSection("authorities")}
                  count={context.authorities.length}
                  color="yellow"
                >
                  <div className="space-y-3">
                    {context.authorities.map((auth, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15"
                      >
                        <p className="text-sm font-medium text-yellow-300 mb-1">{auth.name}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {auth.filing_fee && (
                            <div>
                              <span className="text-muted-foreground">Filing Fee:</span>{" "}
                              <span className="text-slate-300">{auth.filing_fee}</span>
                            </div>
                          )}
                          {auth.timeline && (
                            <div>
                              <span className="text-muted-foreground">Timeline:</span>{" "}
                              <span className="text-slate-300">{auth.timeline}</span>
                            </div>
                          )}
                        </div>
                        {auth.how_to_file && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {auth.how_to_file}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* ── PENALTIES ── */}
              {context && context.penalties.length > 0 && (
                <CollapsibleSection
                  title="Penalties & Consequences"
                  icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
                  isOpen={expanded.penalties}
                  onToggle={() => toggleSection("penalties")}
                  count={context.penalties.length}
                  color="orange"
                >
                  <div className="space-y-2">
                    {context.penalties.map((p, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15"
                      >
                        <p className="text-sm text-orange-300">{p.description}</p>
                        {p.law_reference && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Ref: {p.law_reference}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* ── INTERPRETATIONS ── */}
              {context && context.interpretations.length > 0 && (
                <CollapsibleSection
                  title="Legal Interpretations"
                  icon={<BookOpen className="h-4 w-4 text-purple-400" />}
                  isOpen={expanded.interpretations}
                  onToggle={() => toggleSection("interpretations")}
                  count={context.interpretations.length}
                  color="purple"
                >
                  <div className="space-y-2">
                    {context.interpretations.map((interp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15"
                      >
                        <p className="text-sm text-purple-300">{interp.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Source: {interp.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* ── REMEDIES ── */}
              {context && context.remedies.length > 0 && (
                <CollapsibleSection
                  title="Available Remedies"
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
                  isOpen={expanded.remedies}
                  onToggle={() => toggleSection("remedies")}
                  count={context.remedies.length}
                  color="emerald"
                >
                  <div className="space-y-2">
                    {context.remedies.map((r, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15"
                      >
                        <p className="text-sm text-emerald-300">{r.description}</p>
                        {r.authority && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Via: {r.authority}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center">
            🕸️ ClauseWall Legal Knowledge Graph • {context?.total_related_cases || 0} cases •{" "}
            {context?.win_rate !== null ? `${context?.win_rate}% win rate` : "No case data"} •
            Data verified from Indian legal databases
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════
// Collapsible Section Component
// ═══════════════════════════════════════════════

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  count,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/20 hover:border-blue-500/30",
    green: "border-green-500/20 hover:border-green-500/30",
    yellow: "border-yellow-500/20 hover:border-yellow-500/30",
    orange: "border-orange-500/20 hover:border-orange-500/30",
    purple: "border-indigo-500/20 hover:border-indigo-500/30",
    emerald: "border-emerald-500/20 hover:border-emerald-500/30",
  };

  return (
    <div
      className={`rounded-xl border ${colorMap[color] || colorMap.blue} overflow-hidden transition-colors`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-200">{title}</span>
          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 dark:text-slate-400">
            {count}
          </Badge>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
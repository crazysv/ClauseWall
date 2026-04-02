"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  FileText,
  Scale,
  Search,
  Zap,
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProofNode, ProofTree } from "@/lib/reasoning/types";

// ---- Node icon mapping ----
function getNodeIcon(type: ProofNode["type"]) {
  switch (type) {
    case "extraction": return <BarChart3 className="h-4 w-4" />;
    case "fact": return <FileText className="h-4 w-4" />;
    case "rule": return <Scale className="h-4 w-4" />;
    case "condition_check": return <Search className="h-4 w-4" />;
    case "comparison": return <Zap className="h-4 w-4" />;
    case "inference": return <Link2 className="h-4 w-4" />;
    case "conclusion": return <CheckCircle2 className="h-4 w-4" />;
    default: return <HelpCircle className="h-4 w-4" />;
  }
}

function getStatusIcon(status: ProofNode["status"]) {
  switch (status) {
    case "proven": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "failed": return <XCircle className="h-4 w-4 text-rose-500" />;
    case "uncertain": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "assumed": return <HelpCircle className="h-4 w-4 text-blue-500" />;
  }
}

function getNodeColors(node: ProofNode): { bg: string; border: string; text: string; icon: string; leftBorder: string } {
  if (node.type === "conclusion") {
    const risk = node.metadata?.riskLevel || (node.metadata as any)?.risk;
    if (risk === "illegal") return { bg: "bg-white", border: "border-purple-200", text: "text-purple-900", icon: "text-purple-600", leftBorder: "border-l-purple-600" };
    if (risk === "dangerous") return { bg: "bg-white", border: "border-rose-200", text: "text-rose-900", icon: "text-rose-600", leftBorder: "border-l-rose-500" };
    if (risk === "safe") return { bg: "bg-white", border: "border-emerald-200", text: "text-emerald-900", icon: "text-emerald-600", leftBorder: "border-l-emerald-500" };
    return { bg: "bg-white", border: "border-amber-200", text: "text-amber-900", icon: "text-amber-600", leftBorder: "border-l-amber-500" };
  }

  if (node.status === "failed") return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-900", icon: "text-rose-600", leftBorder: "border-l-rose-400" };
  if (node.status === "uncertain") return { bg: "bg-amber-50", border: "border-amber-200 border-dashed", text: "text-amber-800", icon: "text-amber-500", leftBorder: "border-l-amber-400" };

  switch (node.type) {
    case "rule": 
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "text-amber-600", leftBorder: "border-l-amber-500" };
    case "fact":
    case "extraction": 
      return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "text-blue-600", leftBorder: "border-l-blue-500" };
    case "comparison": {
      const passed = node.metadata.comparisonResult;
      return passed
        ? { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-900", icon: "text-rose-600", leftBorder: "border-l-rose-400" }
        : { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: "text-emerald-600", leftBorder: "border-l-emerald-400" };
    }
    default: 
      return { bg: "bg-white", border: "border-slate-200", text: "text-slate-800", icon: "text-slate-500", leftBorder: "border-l-slate-300" };
  }
}

// ---- Props ----
interface ProofTreeViewProps {
  proofTree: ProofTree;
  mode: "visual" | "text";
  eli5: boolean;
  onNodeClick: (node: ProofNode) => void;
  activeNodeId?: string;
}

// ---- Tree Node Component ----
function TreeNodeCard({
  node,
  depth,
  onNodeClick,
  activeNodeId,
  staggerIndex,
  isWalkthroughActive,
}: {
  node: ProofNode;
  depth: number;
  onNodeClick: (node: ProofNode) => void;
  activeNodeId?: string;
  staggerIndex: number;
  isWalkthroughActive: boolean;
}) {
  const [isChildrenExpanded, setIsChildrenExpanded] = useState(depth < 3);
  const isActive = activeNodeId === node.id;
  const colors = getNodeColors(node);
  const hasChildren = node.children.length > 0;

  const prefersReduced = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const label = node.label.length > 80 ? node.label.substring(0, 77) + "..." : node.label;
  const conf = node.metadata.confidence !== undefined
    ? Math.round(node.metadata.confidence * 100)
    : null;

  // Render Verdict badge for the root conclusion node
  const renderVerdictBadge = () => {
    if (depth !== 0) return null;
    const risk = (node.metadata as any)?.riskLevel || (node.metadata as any)?.risk;
    
    let pillColor = "bg-slate-500";
    let pillText = "Proven";

    if (risk === "illegal") { pillColor = "bg-purple-600"; pillText = "Proven Illegal"; }
    else if (risk === "dangerous") { pillColor = "bg-rose-500"; pillText = "Proven Dangerous"; }
    else if (risk === "safe") { pillColor = "bg-emerald-500"; pillText = "Proven Safe"; }
    else if (risk === "warning") { pillColor = "bg-amber-500 text-white"; pillText = "Proven Warning"; }

    return (
      <div className="flex justify-center mb-6">
        <Badge className={`${pillColor} text-white hover:${pillColor} px-4 md:px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-md flex items-center gap-2`}>
          <ShieldCheck className="w-5 h-5 text-white" />
          {pillText}
        </Badge>
      </div>
    );
  };

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: prefersReduced ? 0 : staggerIndex * 0.05 }}
      className="relative"
    >
      {renderVerdictBadge()}

      {/* Connecting line up to parent */}
      {depth > 0 && (
        <div className="absolute -top-4 left-6 h-4 w-[2px] bg-slate-300" />
      )}

      {/* Node card */}
      <motion.button
        animate={{
          opacity: isWalkthroughActive && !isActive ? 0.6 : 1,
          scale: isActive ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          e.stopPropagation();
          onNodeClick(node);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNodeClick(node);
          }
        }}
        tabIndex={0}
        aria-label={`${node.type} node: ${node.label}. Status: ${node.status}`}
        className={`w-full text-left p-4 rounded-xl border border-l-4 shadow-sm dark:shadow-slate-900/20 transition-all duration-200 ${colors.bg} ${colors.border} ${colors.leftBorder} ${ isActive ? "ring-2 ring-indigo-500/50 shadow-md bg-indigo-50 border-indigo-200" : "hover:shadow-md hover:border-slate-300 dark:border-slate-600" } ${depth === 0 ? "mb-2 shadow-md border-l-8 p-5" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`mt-0.5 flex-shrink-0 bg-white dark:bg-card p-1 rounded-md shadow-sm dark:shadow-slate-900/20 border border-slate-100 ${colors.icon}`}>
              {getNodeIcon(node.type)}
            </span>
            <div className="min-w-0">
              <p className={`text-sm ${depth === 0 ? "font-black text-lg" : "font-bold"} leading-snug ${colors.text}`}>
                {label}
              </p>
              {node.type === "comparison" && node.metadata.leftOperand !== undefined && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono font-medium bg-white dark:bg-slate-900 px-2 py-0.5 inline-block rounded border border-slate-100">
                  {String(node.metadata.leftOperand)} {node.metadata.operator} {String(node.metadata.rightOperand)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 bg-white dark:bg-card px-2 py-1 rounded-full border border-slate-100 shadow-sm dark:shadow-slate-900/20">
            {conf !== null && conf < 100 && (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {conf}%
              </span>
            )}
            {getStatusIcon(node.status)}
          </div>
        </div>
      </motion.button>

      {/* Children */}
      {hasChildren && (
        <div className="mt-2 ml-4 relative">
          {/* Vertical stem line going down to children */}
          <div className="absolute top-0 bottom-0 left-2 w-[2px] bg-slate-300 z-0" />
          
          {node.children.length > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsChildrenExpanded(!isChildrenExpanded);
              }}
              className="relative z-10 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-card border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 shadow-sm dark:shadow-slate-900/20 px-3 py-1 rounded-full mb-3 ml-6 transition-all"
            >
              {isChildrenExpanded ? (
                <><ChevronUp className="h-4 w-4" /> Collapse chain</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> Expand {node.children.length} structural proofs</>
              )}
            </button>
          )}

          <AnimatePresence>
            {(isChildrenExpanded || node.children.length <= 2) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden relative z-10"
              >
                <div className="pl-6 space-y-3 pb-2 pt-1">
                  {node.children.map((child, i) => (
                    <TreeNodeCard
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                      onNodeClick={onNodeClick}
                      activeNodeId={activeNodeId}
                      staggerIndex={staggerIndex + i + 1}
                      isWalkthroughActive={isWalkthroughActive}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ---- Node Detail Panel ----
function NodeDetailPanel({
  node,
  onClose,
  onChallenge,
}: {
  node: ProofNode;
  onClose: () => void;
  onChallenge: (nodeId: string) => void;
}) {
  const colors = getNodeColors(node);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 ${colors.icon}`}>{getNodeIcon(node.type)}</span>
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {node.type.replace(/_/g, " ")} Node
          </span>
          {getStatusIcon(node.status)}
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-full transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 shadow-inner">
        {node.description}
      </p>

      {/* Metadata grid */}
      <div className="space-y-3 bg-white dark:bg-card p-3 rounded-xl border border-slate-100 shadow-sm dark:shadow-slate-900/20">
        {node.metadata.extractedValue !== undefined && (
          <MetaRow label="Parsed Value" value={String(node.metadata.extractedValue)} />
        )}
        {node.metadata.confidence !== undefined && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Machine Confidence</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.round(node.metadata.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs font-black text-indigo-700">
                {Math.round(node.metadata.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
        {node.metadata.statute && <MetaRow label="Statute Authority" value={node.metadata.statute} />}
        {node.metadata.statuteText && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Statute Text</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic font-serif leading-relaxed border-l-2 border-indigo-200 pl-2">
              &quot;{node.metadata.statuteText}&quot;
            </p>
          </div>
        )}
        {node.metadata.leftOperand !== undefined && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Algorithmic Match</p>
            <p className="text-xs font-bold text-indigo-900 bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center gap-2">
              <span className="font-mono">{String(node.metadata.leftOperand)} {node.metadata.operator} {String(node.metadata.rightOperand)}</span>
              {" → "}
              <span className={node.metadata.comparisonResult ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded" : "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"}>
                {node.metadata.comparisonResult ? "VIOLATION" : "PASS"}
              </span>
            </p>
          </div>
        )}
        {node.metadata.violation && <MetaRow label="Identified Violation" value={node.metadata.violation} />}
        {node.metadata.remedy && <MetaRow label="Suggested Remedy" value={node.metadata.remedy} />}
        {node.metadata.penalty && <MetaRow label="Legal Penalty" value={node.metadata.penalty} />}
        {node.metadata.originalText && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source Contract DNA</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg leading-relaxed">
              &quot;{node.metadata.originalText.substring(0, 200)}
              {node.metadata.originalText.length > 200 ? "..." : ""}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Vibrant Shield Custom Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={() => onChallenge(node.id)}
          className="w-full justify-center text-xs font-black text-rose-600 bg-white dark:bg-card border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 p-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm dark:shadow-slate-900/20"
        >
          <Zap className="h-4 w-4" /> Challenge This Proof
        </button>
        <button
          className="w-full justify-center text-xs font-black text-teal-600 bg-white dark:bg-card border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 p-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm dark:shadow-slate-900/20"
        >
          <HelpCircle className="h-4 w-4" /> Explain Like I'm 5
        </button>
      </div>
    </motion.div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

// ---- Main ProofTree Component ----
export function ProofTreeView({
  proofTree,
  mode,
  eli5,
  onNodeClick,
  activeNodeId,
}: ProofTreeViewProps) {
  const [selectedNode, setSelectedNode] = useState<ProofNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback((node: ProofNode) => {
    setSelectedNode(node);
    onNodeClick(node);
  }, [onNodeClick]);

  const handleChallenge = useCallback((nodeId: string) => {
    const event = new CustomEvent("clausewall:challenge-step", {
      detail: { nodeId, proofTree },
    });
    window.dispatchEvent(event);
  }, [proofTree]);

  useEffect(() => {
    if (activeNodeId && selectedNode?.id !== activeNodeId) {
      const found = findNodeById(proofTree.conclusion, activeNodeId);
      if (found) setSelectedNode(found);
    }
  }, [activeNodeId, proofTree.conclusion, selectedNode?.id]);

  if (mode === "text") {
    const chain = eli5 ? getELI5Chain(proofTree) : proofTree.derivationChain;

    return (
      <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        {chain.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-xl border text-sm font-medium leading-relaxed shadow-sm dark:shadow-slate-900/20 transition-all ${ activeNodeId && i === getActiveStepIndex(proofTree, activeNodeId) ? "ring-2 ring-indigo-500 bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-700" }`}
          >
            {step}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tree Container */}
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto">
          <div className="min-w-[320px]">
            <TreeNodeCard
              node={proofTree.conclusion}
              depth={0}
              onNodeClick={handleNodeClick}
              activeNodeId={activeNodeId || selectedNode?.id}
              staggerIndex={0}
              isWalkthroughActive={!!activeNodeId}
            />
          </div>
        </div>

        {/* Detail panel sidecar */}
        <AnimatePresence>
          {selectedNode && (
            <div className="lg:w-[360px] flex-shrink-0">
              <NodeDetailPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onChallenge={handleChallenge}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- Helpers ----
function findNodeById(node: ProofNode, id: string): ProofNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function getELI5Chain(proofTree: ProofTree): string[] {
  return proofTree.derivationChain.map((step) =>
    step
      .replace(/EXTRACTION:/g, "We found:")
      .replace(/FACT:/g, "We know:")
      .replace(/RULE MATCH:/g, "The law says:")
      .replace(/COMPARISON:/g, "Comparing:")
      .replace(/CONCLUSION:/g, "Result:")
      .replace(/DERIVATION:/g, "Therefore:")
      .replace(/CHECK:/g, "Checking:")
  );
}

function getActiveStepIndex(proofTree: ProofTree, nodeId: string): number {
  const nodes: ProofNode[] = [];
  const flatten = (node: ProofNode): void => {
    for (const child of node.children) flatten(child);
    nodes.push(node);
  };
  flatten(proofTree.conclusion);
  return nodes.findIndex((n) => n.id === nodeId);
}

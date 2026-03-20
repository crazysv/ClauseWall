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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProofNode, ProofTree } from "@/lib/reasoning/types";

// ---- Node icon mapping ----

function getNodeIcon(type: ProofNode["type"]) {
  switch (type) {
    case "extraction": return <BarChart3 className="h-3.5 w-3.5" />;
    case "fact": return <FileText className="h-3.5 w-3.5" />;
    case "rule": return <Scale className="h-3.5 w-3.5" />;
    case "condition_check": return <Search className="h-3.5 w-3.5" />;
    case "comparison": return <Zap className="h-3.5 w-3.5" />;
    case "inference": return <Link2 className="h-3.5 w-3.5" />;
    case "conclusion": return <CheckCircle2 className="h-3.5 w-3.5" />;
    default: return <HelpCircle className="h-3.5 w-3.5" />;
  }
}

function getStatusIcon(status: ProofNode["status"]) {
  switch (status) {
    case "proven": return <CheckCircle2 className="h-3 w-3 text-green-400" />;
    case "failed": return <XCircle className="h-3 w-3 text-red-400" />;
    case "uncertain": return <AlertTriangle className="h-3 w-3 text-amber-400" />;
    case "assumed": return <HelpCircle className="h-3 w-3 text-blue-400" />;
  }
}

function getNodeColors(node: ProofNode): { bg: string; border: string; text: string; icon: string } {
  if (node.type === "conclusion") {
    const risk = node.metadata.riskLevel;
    if (risk === "illegal") return { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-300", icon: "text-red-400" };
    if (risk === "dangerous") return { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-300", icon: "text-orange-400" };
    if (risk === "safe") return { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-300", icon: "text-emerald-400" };
    return { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-300", icon: "text-amber-400" };
  }

  if (node.status === "failed") return { bg: "bg-red-500/5", border: "border-red-500/30", text: "text-red-300", icon: "text-red-400" };
  if (node.status === "uncertain") return { bg: "bg-amber-500/5", border: "border-amber-500/30 border-dashed", text: "text-amber-300", icon: "text-amber-400" };

  switch (node.type) {
    case "rule": return { bg: "bg-blue-500/8", border: "border-blue-500/30", text: "text-blue-300", icon: "text-blue-400" };
    case "comparison": {
      const passed = node.metadata.comparisonResult;
      return passed
        ? { bg: "bg-red-500/8", border: "border-red-500/30", text: "text-red-300", icon: "text-red-400" }
        : { bg: "bg-green-500/8", border: "border-green-500/30", text: "text-green-300", icon: "text-green-400" };
    }
    case "extraction": return { bg: "bg-purple-500/8", border: "border-purple-500/30", text: "text-purple-300", icon: "text-purple-400" };
    default: return { bg: "bg-white/[0.03]", border: "border-white/10", text: "text-gray-300", icon: "text-gray-400" };
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

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: prefersReduced ? 0 : staggerIndex * 0.05 }}
      className="relative"
    >
      {/* Connecting line from parent */}
      {depth > 0 && (
        <div className="absolute -top-3 left-5 h-3 w-px bg-white/10" />
      )}

      {/* Node card */}
      <motion.button
        animate={{
          opacity: isWalkthroughActive && !isActive ? 0.4 : 1,
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
        className={`w-full text-left p-3 rounded-lg border transition-all ${colors.bg} ${colors.border} ${
          isActive
            ? "ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/10"
            : "hover:brightness-125"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>
              {getNodeIcon(node.type)}
            </span>
            <div className="min-w-0">
              <p className={`text-xs font-medium leading-snug ${colors.text}`}>
                {label}
              </p>
              {node.type === "comparison" && node.metadata.leftOperand !== undefined && (
                <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                  {String(node.metadata.leftOperand)} {node.metadata.operator} {String(node.metadata.rightOperand)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {conf !== null && conf < 100 && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-white/10 text-gray-500">
                {conf}%
              </Badge>
            )}
            {getStatusIcon(node.status)}
          </div>
        </div>
      </motion.button>

      {/* Children */}
      {hasChildren && (
        <div className="mt-1 ml-2">
          {node.children.length > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsChildrenExpanded(!isChildrenExpanded);
              }}
              className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 mb-1 ml-3"
            >
              {isChildrenExpanded ? (
                <><ChevronUp className="h-3 w-3" /> Hide sub-steps</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Show {node.children.length} sub-steps</>
              )}
            </button>
          )}

          <AnimatePresence>
            {(isChildrenExpanded || node.children.length <= 2) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="pl-4 border-l border-white/5 space-y-1.5">
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
      transition={{ duration: 0.15 }}
      className={`p-4 rounded-xl border ${colors.bg} ${colors.border} space-y-3`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={colors.icon}>{getNodeIcon(node.type)}</span>
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            {node.type.replace(/_/g, " ")}
          </span>
          {getStatusIcon(node.status)}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 leading-relaxed">{node.description}</p>

      {/* Metadata grid */}
      <div className="space-y-2">
        {node.metadata.extractedValue !== undefined && (
          <MetaRow label="Value" value={String(node.metadata.extractedValue)} />
        )}
        {node.metadata.confidence !== undefined && (
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded bg-white/5">
                <div
                  className="h-full rounded bg-cyan-500"
                  style={{ width: `${Math.round(node.metadata.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {Math.round(node.metadata.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
        {node.metadata.statute && <MetaRow label="Statute" value={node.metadata.statute} />}
        {node.metadata.statuteText && (
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Statute Text</p>
            <p className="text-xs text-gray-400 italic leading-relaxed">
              &quot;{node.metadata.statuteText}&quot;
            </p>
          </div>
        )}
        {node.metadata.leftOperand !== undefined && (
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Comparison</p>
            <p className="text-xs text-gray-300 font-mono">
              {String(node.metadata.leftOperand)} {node.metadata.operator} {String(node.metadata.rightOperand)}
              {" → "}
              <span className={node.metadata.comparisonResult ? "text-red-400" : "text-green-400"}>
                {node.metadata.comparisonResult ? "EXCEEDS" : "WITHIN LIMIT"}
              </span>
            </p>
          </div>
        )}
        {node.metadata.violation && <MetaRow label="Violation" value={node.metadata.violation} />}
        {node.metadata.remedy && <MetaRow label="Remedy" value={node.metadata.remedy} />}
        {node.metadata.penalty && <MetaRow label="Penalty" value={node.metadata.penalty} />}
        {node.metadata.originalText && (
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Source Text</p>
            <p className="text-xs text-gray-400 italic leading-relaxed">
              &quot;{node.metadata.originalText.substring(0, 200)}
              {node.metadata.originalText.length > 200 ? "..." : ""}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onChallenge(node.id)}
          className="text-[10px] text-amber-400 hover:text-amber-300 font-medium"
        >
          ⚡ Challenge this step
        </button>
      </div>
    </motion.div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-xs text-gray-300">{value}</p>
    </div>
  );
}

// ---- Main ProofTree Component ----

export default function ProofTreeView({
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
    // Trigger challenge — handled by parent modal
    const event = new CustomEvent("clausewall:challenge-step", {
      detail: { nodeId, proofTree },
    });
    window.dispatchEvent(event);
  }, [proofTree]);

  // Close detail panel when active node changes externally
  useEffect(() => {
    if (activeNodeId && selectedNode?.id !== activeNodeId) {
      const found = findNodeById(proofTree.conclusion, activeNodeId);
      if (found) setSelectedNode(found);
    }
  }, [activeNodeId, proofTree.conclusion, selectedNode?.id]);

  if (mode === "text") {
    // Text mode — render derivation chain
    const chain = eli5 ? getELI5Chain(proofTree) : proofTree.derivationChain;

    return (
      <div className="space-y-2">
        {chain.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-3 rounded-lg border text-sm leading-relaxed ${
              activeNodeId && i === getActiveStepIndex(proofTree, activeNodeId)
                ? "ring-2 ring-cyan-500/50 bg-cyan-500/5 border-cyan-500/30 text-gray-200"
                : "bg-white/[0.02] border-white/5 text-gray-400"
            }`}
          >
            {step}
          </motion.div>
        ))}
      </div>
    );
  }

  // Visual mode
  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tree */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <TreeNodeCard
            node={proofTree.conclusion}
            depth={0}
            onNodeClick={handleNodeClick}
            activeNodeId={activeNodeId || selectedNode?.id}
            staggerIndex={0}
            isWalkthroughActive={!!activeNodeId}
          />
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <div className="lg:w-80 flex-shrink-0">
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
  // Import is dynamic to avoid SSR issues, but we have the data already
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
  // Flatten tree to find step index
  const nodes: ProofNode[] = [];
  const flatten = (node: ProofNode): void => {
    for (const child of node.children) flatten(child);
    nodes.push(node);
  };
  flatten(proofTree.conclusion);
  return nodes.findIndex((n) => n.id === nodeId);
}

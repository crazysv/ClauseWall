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
    case "extraction":
      return <BarChart3 className="h-3.5 w-3.5" />;
    case "fact":
      return <FileText className="h-3.5 w-3.5" />;
    case "rule":
      return <Scale className="h-3.5 w-3.5" />;
    case "condition_check":
      return <Search className="h-3.5 w-3.5" />;
    case "comparison":
      return <Zap className="h-3.5 w-3.5" />;
    case "inference":
      return <Link2 className="h-3.5 w-3.5" />;
    case "conclusion":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    default:
      return <HelpCircle className="h-3.5 w-3.5" />;
  }
}

function getStatusIcon(status: ProofNode["status"]) {
  switch (status) {
    case "proven":
      return <CheckCircle2 className="h-3 w-3 text-green-400" />;
    case "failed":
      return <XCircle className="h-3 w-3 text-red-400" />;
    case "uncertain":
      return <AlertTriangle className="h-3 w-3 text-amber-400" />;
    case "assumed":
      return <HelpCircle className="h-3 w-3 text-blue-400" />;
  }
}

function getNodeColors(node: ProofNode): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  if (node.type === "conclusion") {
    const risk = node.metadata.riskLevel;
    if (risk === "illegal")
      return {
        bg: "bg-background",
        border: "border-red-600",
        text: "text-red-600",
        icon: "text-red-600",
      };
    if (risk === "dangerous")
      return {
        bg: "bg-background",
        border: "border-orange-600",
        text: "text-orange-600",
        icon: "text-orange-600",
      };
    if (risk === "safe")
      return {
        bg: "bg-background",
        border: "border-green-600",
        text: "text-green-600",
        icon: "text-green-600",
      };
    return {
      bg: "bg-background",
      border: "border-yellow-600",
      text: "text-yellow-600",
      icon: "text-yellow-600",
    };
  }

  if (node.status === "failed")
    return {
      bg: "bg-background",
      border: "border-red-600",
      text: "text-red-600",
      icon: "text-red-600",
    };
  if (node.status === "uncertain")
    return {
      bg: "bg-background",
      border: "border-yellow-600 border-dashed",
      text: "text-yellow-600",
      icon: "text-yellow-600",
    };

  switch (node.type) {
    case "rule":
      return {
        bg: "bg-muted",
        border: "border-foreground",
        text: "text-foreground",
        icon: "text-foreground",
      };
    case "comparison": {
      const passed = node.metadata.comparisonResult;
      return passed
        ? {
            bg: "bg-background",
            border: "border-red-600",
            text: "text-red-600",
            icon: "text-red-600",
          }
        : {
            bg: "bg-background",
            border: "border-green-600",
            text: "text-green-600",
            icon: "text-green-600",
          };
    }
    case "extraction":
      return {
        bg: "bg-background",
        border: "border-purple-600",
        text: "text-purple-600",
        icon: "text-purple-600",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-foreground",
        text: "text-foreground",
        icon: "text-muted-foreground",
      };
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

  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const label =
    node.label.length > 80 ? node.label.substring(0, 77) + "..." : node.label;
  const conf =
    node.metadata.confidence !== undefined
      ? Math.round(node.metadata.confidence * 100)
      : null;

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: prefersReduced ? 0 : staggerIndex * 0.05,
      }}
      className="relative"
    >
      {/* Connecting line from parent */}
      {depth > 0 && (
        <div className="absolute -top-3 left-5 h-3 w-px bg-muted" />
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
        aria-label={`${node.type} node: ${node.label}. Status: ${node.status}`}
        className={`w-full text-left p-3 border-2 card-impact transition-all ${colors.bg} ${colors.border} ${isActive ? "border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px]" : "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>
              {getNodeIcon(node.type)}
            </span>
            <div className="min-w-0">
              <p
                className={`text-xs font-black leading-snug uppercase tracking-wider ${colors.text}`}
              >
                {label}
              </p>
              {node.type === "comparison" &&
                node.metadata.leftOperand !== undefined && (
                  <p className="text-[10px] text-muted-foreground font-bold mt-0.5 font-mono">
                    {String(node.metadata.leftOperand)} {node.metadata.operator}{" "}
                    {String(node.metadata.rightOperand)}
                  </p>
                )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {conf !== null && conf < 100 && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 border-foreground text-foreground font-black uppercase tracking-wider"
              >
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
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground mb-1 ml-3"
            >
              {isChildrenExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Hide sub-steps
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> Show{" "}
                  {node.children.length} sub-steps
                </>
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
                <div className="pl-4 border-l-2 border-foreground space-y-1.5 pt-1">
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
      className={`p-4 card-impact border-2 ${colors.bg} ${colors.border} space-y-3`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={colors.icon}>{getNodeIcon(node.type)}</span>
          <span className="text-xs font-black text-foreground uppercase tracking-wider">
            {node.type.replace(/_/g, " ")}
          </span>
          {getStatusIcon(node.status)}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm font-bold text-foreground leading-relaxed">
        {node.description}
      </p>

      {/* Metadata grid */}
      <div className="space-y-2">
        {node.metadata.extractedValue !== undefined && (
          <MetaRow label="Value" value={String(node.metadata.extractedValue)} />
        )}
        {node.metadata.confidence !== undefined && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
              Confidence
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 border-2 border-foreground bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground"
                  style={{
                    width: `${Math.round(node.metadata.confidence * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs font-black text-foreground">
                {Math.round(node.metadata.confidence * 100)}%
              </span>
            </div>
          </div>
        )}
        {node.metadata.statute && (
          <MetaRow label="Statute" value={node.metadata.statute} />
        )}
        {node.metadata.statuteText && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-0.5">
              Statute Text
            </p>
            <p className="text-xs font-bold text-foreground italic leading-relaxed">
              &quot;{node.metadata.statuteText}&quot;
            </p>
          </div>
        )}
        {node.metadata.leftOperand !== undefined && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-0.5">
              Comparison
            </p>
            <p className="text-xs font-bold text-foreground font-mono">
              {String(node.metadata.leftOperand)} {node.metadata.operator}{" "}
              {String(node.metadata.rightOperand)}
              {" → "}
              <span
                className={
                  node.metadata.comparisonResult
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                {node.metadata.comparisonResult ? "EXCEEDS" : "WITHIN LIMIT"}
              </span>
            </p>
          </div>
        )}
        {node.metadata.violation && (
          <MetaRow label="Violation" value={node.metadata.violation} />
        )}
        {node.metadata.remedy && (
          <MetaRow label="Remedy" value={node.metadata.remedy} />
        )}
        {node.metadata.penalty && (
          <MetaRow label="Penalty" value={node.metadata.penalty} />
        )}
        {node.metadata.originalText && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-0.5">
              Source Text
            </p>
            <p className="text-xs font-bold text-foreground italic leading-relaxed">
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
          className="text-[10px] text-red-600 hover:text-red-700 font-black uppercase tracking-wider mt-2 bg-red-100 p-2 border-2 border-red-600"
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
      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-xs font-bold text-foreground">{value}</p>
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

  const handleNodeClick = useCallback(
    (node: ProofNode) => {
      setSelectedNode(node);
      onNodeClick(node);
    },
    [onNodeClick],
  );

  const handleChallenge = useCallback(
    (nodeId: string) => {
      // Trigger challenge — handled by parent modal
      const event = new CustomEvent("clausewall:challenge-step", {
        detail: { nodeId, proofTree },
      });
      window.dispatchEvent(event);
    },
    [proofTree],
  );

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
            className={`p-3 card-impact border-2 text-sm font-bold leading-relaxed ${activeNodeId && i === getActiveStepIndex(proofTree, activeNodeId) ? "border-foreground bg-foreground text-background" : "bg-muted border-foreground text-muted-foreground"}`}
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
      .replace(/CHECK:/g, "Checking:"),
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

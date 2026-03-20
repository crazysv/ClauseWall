"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  FileText,
  Scale,
  Search,
  Zap,
  Link2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProofTree, ProofNode } from "@/lib/reasoning/types";

interface ProofWalkthroughProps {
  proofTree: ProofTree;
  eli5: boolean;
  currentStep: number;
  onStepChange: (step: number) => void;
}

// ---- Step icon mapping ----

function getStepIcon(stepText: string) {
  if (stepText.includes("EXTRACTION") || stepText.includes("We found")) return <BarChart3 className="h-4 w-4" />;
  if (stepText.includes("FACT") || stepText.includes("We know")) return <FileText className="h-4 w-4" />;
  if (stepText.includes("RULE") || stepText.includes("law says")) return <Scale className="h-4 w-4" />;
  if (stepText.includes("CHECK") || stepText.includes("Checking")) return <Search className="h-4 w-4" />;
  if (stepText.includes("COMPARISON") || stepText.includes("Comparing")) return <Zap className="h-4 w-4" />;
  if (stepText.includes("DERIVATION") || stepText.includes("Therefore")) return <Link2 className="h-4 w-4" />;
  if (stepText.includes("CONCLUSION") || stepText.includes("Result")) return <CheckCircle2 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function getStepType(stepText: string): string {
  if (stepText.includes("EXTRACTION") || stepText.includes("We found")) return "extraction";
  if (stepText.includes("FACT") || stepText.includes("We know")) return "fact";
  if (stepText.includes("RULE") || stepText.includes("law says")) return "rule";
  if (stepText.includes("CHECK") || stepText.includes("Checking")) return "check";
  if (stepText.includes("COMPARISON") || stepText.includes("Comparing")) return "comparison";
  if (stepText.includes("DERIVATION") || stepText.includes("Therefore")) return "derivation";
  if (stepText.includes("CONCLUSION") || stepText.includes("Result")) return "conclusion";
  return "other";
}

function getStepColor(type: string): { bg: string; border: string; text: string; icon: string; badge: string } {
  switch (type) {
    case "extraction":
      return { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-300", icon: "text-purple-400", badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
    case "fact":
      return { bg: "bg-slate-500/5", border: "border-slate-500/20", text: "text-slate-300", icon: "text-slate-400", badge: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
    case "rule":
      return { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-300", icon: "text-blue-400", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
    case "check":
      return { bg: "bg-cyan-500/5", border: "border-cyan-500/20", text: "text-cyan-300", icon: "text-cyan-400", badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
    case "comparison":
      return { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-300", icon: "text-amber-400", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    case "derivation":
      return { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-300", icon: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    case "conclusion":
      return { bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-300", icon: "text-red-400", badge: "bg-red-500/15 text-red-400 border-red-500/30" };
    default:
      return { bg: "bg-white/[0.02]", border: "border-white/10", text: "text-gray-300", icon: "text-gray-400", badge: "bg-white/5 text-gray-400 border-white/10" };
  }
}

// ---- Step label parsing ----

function parseStepContent(step: string): { stepNumber: string; type: string; content: string } {
  // Matches "Step N — TYPE: content" or "Step N: content"
  const match = step.match(/^(Step \d+)\s*[—–-]\s*(\w+):\s*(.+)$/);
  if (match) {
    return { stepNumber: match[1], type: match[2], content: match[3] };
  }
  // Simpler format: "Step N: content"
  const simpleMatch = step.match(/^(Step \d+):\s*(.+)$/);
  if (simpleMatch) {
    return { stepNumber: simpleMatch[1], type: "", content: simpleMatch[2] };
  }
  return { stepNumber: "", type: "", content: step };
}

export default function ProofWalkthrough({
  proofTree,
  eli5,
  currentStep,
  onStepChange,
}: ProofWalkthroughProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const chain = eli5
    ? proofTree.derivationChain.map((step) =>
        step
          .replace(/EXTRACTION:/g, "We found:")
          .replace(/FACT:/g, "We know:")
          .replace(/RULE MATCH:/g, "The law says:")
          .replace(/COMPARISON:/g, "Comparing:")
          .replace(/CONCLUSION:/g, "Result:")
          .replace(/DERIVATION:/g, "Therefore:")
          .replace(/CHECK:/g, "Checking:")
      )
    : proofTree.derivationChain;

  const toggleExpand = (index: number) => {
    const next = new Set(expandedSteps);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExpandedSteps(next);
  };

  return (
    <div className="space-y-2">
      {chain.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isUpcoming = index > currentStep;
        const parsed = parseStepContent(step);
        const type = getStepType(step);
        const colors = getStepColor(type);
        const isExpanded = expandedSteps.has(index);

        // Find matching proof node for details
        const nodes = flattenTree(proofTree.conclusion);
        const matchingNode = nodes[index];

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <div
              onClick={() => onStepChange(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onStepChange(index);
                }
              }}
              role="button"
              tabIndex={0}
              className={`w-full text-left p-4 rounded-xl border transition-all ${colors.bg} ${colors.border} ${
                isActive
                  ? "ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/5"
                  : isCompleted
                    ? "opacity-80"
                    : isUpcoming
                      ? "opacity-40"
                      : ""
              } hover:brightness-110 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-500`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Step number + icon */}
                  <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg ${isActive ? "bg-cyan-500/20" : "bg-white/5"}`}>
                    <span className={isActive ? "text-cyan-400" : colors.icon}>
                      {getStepIcon(step)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {parsed.stepNumber && (
                        <span className="text-[10px] text-gray-600 font-mono">
                          {parsed.stepNumber}
                        </span>
                      )}
                      {parsed.type && (
                        <Badge className={`${colors.badge} text-[9px] px-1.5 py-0`}>
                          {parsed.type}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${isActive ? "text-gray-200" : colors.text}`}>
                      {parsed.content}
                    </p>
                  </div>
                </div>

                {/* Expand toggle */}
                {matchingNode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(index);
                    }}
                    className="text-gray-600 hover:text-gray-400 flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && matchingNode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500 space-y-1"
                >
                  {matchingNode.metadata.statute && (
                    <p>📜 Statute: {matchingNode.metadata.statute}</p>
                  )}
                  {matchingNode.metadata.statuteText && (
                    <p className="italic">&quot;{matchingNode.metadata.statuteText}&quot;</p>
                  )}
                  {matchingNode.metadata.confidence !== undefined && (
                    <p>📊 Confidence: {Math.round(matchingNode.metadata.confidence * 100)}%</p>
                  )}
                  {matchingNode.metadata.remedy && (
                    <p>💡 Remedy: {matchingNode.metadata.remedy}</p>
                  )}
                  {matchingNode.metadata.penalty && (
                    <p>⚖️ Penalty: {matchingNode.metadata.penalty}</p>
                  )}
                  {matchingNode.description && matchingNode.description !== parsed.content && (
                    <p>{matchingNode.description}</p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---- Helper: flatten tree bottom-up ----

function flattenTree(node: ProofNode): ProofNode[] {
  const result: ProofNode[] = [];
  const walk = (n: ProofNode): void => {
    for (const child of n.children) walk(child);
    result.push(n);
  };
  walk(node);
  return result;
}

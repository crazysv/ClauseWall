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
  if (stepText.includes("EXTRACTION") || stepText.includes("We found"))
    return <BarChart3 className="h-4 w-4" />;
  if (stepText.includes("FACT") || stepText.includes("We know"))
    return <FileText className="h-4 w-4" />;
  if (stepText.includes("RULE") || stepText.includes("law says"))
    return <Scale className="h-4 w-4" />;
  if (stepText.includes("CHECK") || stepText.includes("Checking"))
    return <Search className="h-4 w-4" />;
  if (stepText.includes("COMPARISON") || stepText.includes("Comparing"))
    return <Zap className="h-4 w-4" />;
  if (stepText.includes("DERIVATION") || stepText.includes("Therefore"))
    return <Link2 className="h-4 w-4" />;
  if (stepText.includes("CONCLUSION") || stepText.includes("Result"))
    return <CheckCircle2 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function getStepType(stepText: string): string {
  if (stepText.includes("EXTRACTION") || stepText.includes("We found"))
    return "extraction";
  if (stepText.includes("FACT") || stepText.includes("We know")) return "fact";
  if (stepText.includes("RULE") || stepText.includes("law says")) return "rule";
  if (stepText.includes("CHECK") || stepText.includes("Checking"))
    return "check";
  if (stepText.includes("COMPARISON") || stepText.includes("Comparing"))
    return "comparison";
  if (stepText.includes("DERIVATION") || stepText.includes("Therefore"))
    return "derivation";
  if (stepText.includes("CONCLUSION") || stepText.includes("Result"))
    return "conclusion";
  return "other";
}

function getStepColor(type: string): {
  bg: string;
  border: string;
  text: string;
  icon: string;
  badge: string;
} {
  switch (type) {
    case "extraction":
      return {
        bg: "bg-background",
        border: "border-purple-600",
        text: "text-purple-600",
        icon: "text-purple-600",
        badge: "bg-background text-purple-600 border-purple-600",
      };
    case "fact":
      return {
        bg: "bg-muted",
        border: "border-foreground",
        text: "text-foreground",
        icon: "text-foreground",
        badge: "bg-background text-foreground border-foreground",
      };
    case "rule":
      return {
        bg: "bg-muted",
        border: "border-foreground",
        text: "text-foreground",
        icon: "text-foreground",
        badge: "bg-background text-foreground border-foreground",
      };
    case "check":
      return {
        bg: "bg-background",
        border: "border-cyan-600",
        text: "text-cyan-600",
        icon: "text-cyan-600",
        badge: "bg-background text-cyan-600 border-cyan-600",
      };
    case "comparison":
      return {
        bg: "bg-background",
        border: "border-amber-600",
        text: "text-amber-600",
        icon: "text-amber-600",
        badge: "bg-background text-amber-600 border-amber-600",
      };
    case "derivation":
      return {
        bg: "bg-background",
        border: "border-emerald-600",
        text: "text-emerald-600",
        icon: "text-emerald-600",
        badge: "bg-background text-emerald-600 border-emerald-600",
      };
    case "conclusion":
      return {
        bg: "bg-background",
        border: "border-red-600",
        text: "text-red-600",
        icon: "text-red-600",
        badge: "bg-background text-red-600 border-red-600",
      };
    default:
      return {
        bg: "bg-muted",
        border: "border-foreground",
        text: "text-foreground",
        icon: "text-muted-foreground",
        badge: "bg-background text-foreground border-foreground",
      };
  }
}

// ---- Step label parsing ----

function parseStepContent(step: string): {
  stepNumber: string;
  type: string;
  content: string;
} {
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
          .replace(/CHECK:/g, "Checking:"),
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
              className={`w-full text-left p-4 card-impact border-2 transition-all ${colors.bg} ${colors.border} ${isActive ? "border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px]" : isCompleted ? "opacity-80" : isUpcoming ? "opacity-40" : ""} hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-foreground`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Step number + icon */}
                  <div
                    className={`flex-shrink-0 flex items-center justify-center h-8 w-8 border-2 border-foreground bg-background`}
                  >
                    <span
                      className={isActive ? "text-foreground" : colors.icon}
                    >
                      {getStepIcon(step)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {parsed.stepNumber && (
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                          {parsed.stepNumber}
                        </span>
                      )}
                      {parsed.type && (
                        <Badge
                          variant="outline"
                          className={`${colors.badge} text-[9px] px-1.5 py-0 border-2 font-black uppercase tracking-wider`}
                        >
                          {parsed.type}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-sm leading-relaxed font-bold ${isActive ? "text-foreground" : colors.text}`}
                    >
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
                    className="text-muted-foreground hover:text-muted-foreground flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
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
                  className="mt-3 pt-3 border-t-2 border-foreground text-xs text-muted-foreground font-bold space-y-1"
                >
                  {matchingNode.metadata.statute && (
                    <p>📜 Statute: {matchingNode.metadata.statute}</p>
                  )}
                  {matchingNode.metadata.statuteText && (
                    <p className="italic">
                      &quot;{matchingNode.metadata.statuteText}&quot;
                    </p>
                  )}
                  {matchingNode.metadata.confidence !== undefined && (
                    <p>
                      📊 Confidence:{" "}
                      {Math.round(matchingNode.metadata.confidence * 100)}%
                    </p>
                  )}
                  {matchingNode.metadata.remedy && (
                    <p>💡 Remedy: {matchingNode.metadata.remedy}</p>
                  )}
                  {matchingNode.metadata.penalty && (
                    <p>⚖️ Penalty: {matchingNode.metadata.penalty}</p>
                  )}
                  {matchingNode.description &&
                    matchingNode.description !== parsed.content && (
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

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  FileText,
  TreePine,
  Baby,
  Briefcase,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProofTreeView from "./proof-tree";
import ProofWalkthrough from "./proof-walkthrough";
import type { ProofNode, ProofTree } from "@/lib/reasoning/types";
import { getProofSummary } from "@/lib/reasoning/proof-formatter";

interface ProofTreeModalProps {
  proofTree: ProofTree;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProofTreeModal({
  proofTree,
  isOpen,
  onClose,
}: ProofTreeModalProps) {
  const [mode, setMode] = useState<"visual" | "text">("visual");
  const [eli5, setEli5] = useState(false);
  const [walkthrough, setWalkthrough] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState<ProofNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const summary = getProofSummary(proofTree);

  // Flatten tree for walkthrough navigation
  const flatNodes = useRef<ProofNode[]>([]);
  useEffect(() => {
    const nodes: ProofNode[] = [];
    const flatten = (node: ProofNode): void => {
      for (const child of node.children) flatten(child);
      nodes.push(node);
    };
    flatten(proofTree.conclusion);
    flatNodes.current = nodes;
  }, [proofTree]);

  const totalSteps = flatNodes.current.length || proofTree.totalSteps;

  // Walkthrough auto-play
  useEffect(() => {
    if (walkthrough) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= totalSteps) {
            setWalkthrough(false);
            return prev;
          }
          return next;
        });
      }, 1500);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [walkthrough, totalSteps]);

  // Update selected node when step changes
  useEffect(() => {
    if (flatNodes.current[currentStep]) {
      setSelectedNode(flatNodes.current[currentStep]);
    }
  }, [currentStep]);

  const handleNodeClick = useCallback((node: ProofNode) => {
    setSelectedNode(node);
    const idx = flatNodes.current.findIndex((n) => n.id === node.id);
    if (idx >= 0) setCurrentStep(idx);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const toggleWalkthrough = useCallback(() => {
    if (!walkthrough) {
      setCurrentStep(0);
    }
    setWalkthrough((prev) => !prev);
  }, [walkthrough]);

  const exportAsPNG = useCallback(async () => {
    if (!contentRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(contentRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#111827",
      });
      const link = document.createElement("a");
      link.download = `clausewall-proof-${proofTree.id.substring(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      console.error("[ClauseWall] Failed to export proof tree as PNG");
    }
  }, [proofTree.id]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const verdictLabel = summary.verdict.replace("proven_", "").toUpperCase();
  const verdictColor =
    summary.riskLevel === "illegal"
      ? "text-red-600"
      : summary.riskLevel === "dangerous"
        ? "text-orange-600"
        : summary.riskLevel === "warning"
          ? "text-yellow-600"
          : "text-green-600";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[90vh] bg-background card-impact border-2 border-foreground overflow-hidden flex flex-col rounded-none"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b-2 border-foreground flex items-center justify-between flex-shrink-0 bg-muted">
              <div className="flex items-center gap-3">
                <TreePine className="h-5 w-5 text-foreground" />
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-foreground">Proof Tree</h2>
                  <p className="text-xs font-bold text-muted-foreground">
                    {proofTree.clauseText.substring(0, 80)}
                    {proofTree.clauseText.length > 80 ? "..." : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${verdictColor} border-2 border-foreground bg-background text-xs font-black uppercase tracking-wider`}>
                  {verdictLabel}
                </Badge>
                <Badge variant="outline" className="text-xs border-2 border-foreground text-foreground font-black uppercase tracking-wider bg-background">
                  {summary.stepsCount} steps
                </Badge>
                <Badge variant="outline" className="text-xs border-2 border-foreground text-foreground font-black uppercase tracking-wider bg-background">
                  {Math.round(summary.confidence * 100)}% conf
                </Badge>
                <button
                  onClick={onClose}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
              {mode === "visual" ? (
                <ProofTreeView
                  proofTree={proofTree}
                  mode="visual"
                  eli5={eli5}
                  onNodeClick={handleNodeClick}
                  activeNodeId={selectedNode?.id}
                />
              ) : (
                <ProofWalkthrough
                  proofTree={proofTree}
                  eli5={eli5}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                />
              )}
            </div>

            {/* Footer controls */}
            <div className="px-6 py-3 border-t-2 border-foreground bg-muted flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep <= 0}
                  className="gap-1 h-8 button text-impact-heading bg-background border-foreground text-foreground hover:bg-foreground hover:text-background"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <span className="text-xs font-black uppercase tracking-wider text-foreground min-w-[4rem] text-center">
                  {currentStep + 1} / {totalSteps}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentStep >= totalSteps - 1}
                  className="gap-1 h-8 button text-impact-heading bg-background border-foreground text-foreground hover:bg-foreground hover:text-background"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleWalkthrough}
                  className={`gap-1 h-8 button text-impact-heading border-foreground ${walkthrough ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground hover:text-background"}`}
                >
                  {walkthrough ? (
                    <><Pause className="h-3.5 w-3.5" /> Stop</>
                  ) : (
                    <><Play className="h-3.5 w-3.5" /> Walk Through</>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("visual")}
                  className={`gap-1 h-8 button text-impact-heading border-foreground ${mode === "visual" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground hover:text-background"}`}
                >
                  <TreePine className="h-3.5 w-3.5" />
                  Tree
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("text")}
                  className={`gap-1 h-8 button text-impact-heading border-foreground ${mode === "text" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground hover:text-background"}`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Text
                </Button>
                <span className="text-foreground font-black">|</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEli5(!eli5)}
                  className={`gap-1 h-8 button text-impact-heading border-foreground ${eli5 ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground hover:text-background"}`}
                >
                  <Baby className="h-3.5 w-3.5" />
                  ELI5
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAsPNG}
                  className="gap-1 h-8 button text-impact-heading bg-background border-foreground text-foreground hover:bg-foreground hover:text-background"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

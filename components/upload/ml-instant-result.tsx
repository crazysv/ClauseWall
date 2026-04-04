"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  Lock,
  Timer,
  Brain,
  Cpu,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MLScanResult } from "@/lib/ml/types";
import type { RiskLevel } from "@/types";

interface MLInstantResultProps {
  result: MLScanResult;
  isQuickScanLoading: boolean;
  quickScanReady: boolean;
  onContinueToQuickScan: () => void;
}

export default function MLInstantResult({
  result,
  isQuickScanLoading,
  quickScanReady,
  onContinueToQuickScan,
}: MLInstantResultProps) {
  const [showClauses, setShowClauses] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score counting up
  useEffect(() => {
    const target = result.overallScore;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [result.overallScore]);

  const getRiskConfig = (risk: RiskLevel) => {
    switch (risk) {
      case "illegal":
        return {
          color: "text-purple-600",
          bg: "bg-background",
          border:
            "border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(147,51,234,1)]",
          icon: <Scale className="h-5 w-5 text-purple-600" />,
          label: "CRITICAL",
        };
      case "dangerous":
        return {
          color: "text-primary",
          bg: "bg-background",
          border:
            "border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]",
          icon: <XCircle className="h-5 w-5 text-primary" />,
          label: "HIGH RISK",
        };
      case "warning":
        return {
          color: "text-yellow-600",
          bg: "bg-background",
          border:
            "border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(202,138,4,1)]",
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          label: "CAUTION",
        };
      default:
        return {
          color: "text-green-600",
          bg: "bg-background",
          border:
            "border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(22,163,74,1)]",
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          label: "LOW RISK",
        };
    }
  };

  const overallConfig = getRiskConfig(result.overallRisk);
  const confidencePercent = Math.round(result.overallConfidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Badge className="bg-foreground text-background font-black uppercase tracking-wider border-2 border-foreground gap-1.5 px-3 py-1 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
          <Zap className="h-3.5 w-3.5" />
          ON-DEVICE AI — No data sent to server
        </Badge>
      </div>

      {/* Main Score Card */}
      <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] overflow-hidden">
        <CardContent className="p-0">
          <div className={`${overallConfig.bg} p-6 text-center`}>
            {/* Risk Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-3"
            >
              {result.overallRisk === "illegal" && (
                <Scale className={`h-10 w-10 ${overallConfig.color}`} />
              )}
              {result.overallRisk === "dangerous" && (
                <ShieldAlert className={`h-10 w-10 ${overallConfig.color}`} />
              )}
              {result.overallRisk === "warning" && (
                <AlertTriangle className={`h-10 w-10 ${overallConfig.color}`} />
              )}
              {result.overallRisk === "safe" && (
                <ShieldCheck className={`h-10 w-10 ${overallConfig.color}`} />
              )}
            </motion.div>

            {/* Score */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span
                className={`text-6xl font-black tabular-nums ${overallConfig.color}`}
              >
                {animatedScore}
              </span>
              <span className="text-3xl font-bold text-muted-foreground">
                /100
              </span>
            </div>

            <p
              className={`text-lg font-black uppercase tracking-wider mt-2 ${overallConfig.color} mb-4`}
            >
              {overallConfig.label}
            </p>

            {/* Quick Stats Row */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-amber-400" />
                {result.totalClauses} clauses
              </span>
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-blue-400" />
                {result.inferenceTimeMs.toFixed(0)}ms
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-green-400" />
                {confidencePercent}% confidence
              </span>
            </div>
          </div>

          {/* Risk Breakdown Bar */}
          <div className="px-6 py-4">
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-2">
              {result.riskBreakdown.safe > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(result.riskBreakdown.safe / result.totalClauses) * 100}%`,
                  }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="bg-green-500 rounded-l-full"
                />
              )}
              {result.riskBreakdown.warning > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(result.riskBreakdown.warning / result.totalClauses) * 100}%`,
                  }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="bg-yellow-500"
                />
              )}
              {result.riskBreakdown.dangerous > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(result.riskBreakdown.dangerous / result.totalClauses) * 100}%`,
                  }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="bg-red-500"
                />
              )}
              {result.riskBreakdown.illegal > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(result.riskBreakdown.illegal / result.totalClauses) * 100}%`,
                  }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="bg-purple-500 rounded-r-full"
                />
              )}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Safe: {result.riskBreakdown.safe}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Warning: {result.riskBreakdown.warning}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Danger: {result.riskBreakdown.dangerous}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Illegal: {result.riskBreakdown.illegal}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Clause List */}
      <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] mt-6">
        <CardContent className="p-0">
          <button
            onClick={() => setShowClauses(!showClauses)}
            className="w-full flex items-center justify-between p-4 text-sm hover:bg-muted transition-colors border-b-2 border-transparent hover:border-foreground"
          >
            <span className="flex items-center gap-2 font-black uppercase tracking-wider text-foreground">
              <Brain className="h-4 w-4 text-amber-400" />
              Clause-by-Clause Preview ({result.totalClauses})
            </span>
            {showClauses ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {showClauses && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {result.clauseResults.map((clause, i) => {
                    const config = getRiskConfig(clause.riskLevel);
                    const confPercent = Math.round(clause.confidence * 100);

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-muted border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] hover:-translate-y-[1px] transition-transform"
                      >
                        <div className={`mt-0.5`}>{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-black uppercase tracking-wider bg-background shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] ${config.color} ${config.border}`}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              {confPercent}% confident
                            </span>
                            {clause.confidence < 0.65 && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                                (needs AI verification)
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-muted-foreground leading-relaxed truncate">
                            {clause.truncatedText}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Privacy + Tech Badge */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-green-400" />
          No data left your device
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="h-3 w-3 text-blue-400" />
          TF.js v{result.modelVersion}
        </span>
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-purple-400" />
          {result.featureCount} features
        </span>
      </div>

      {/* Continue / Loading Section */}
      <AnimatePresence mode="wait">
        {isQuickScanLoading && !quickScanReady && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] mt-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Running detailed AI scan...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Verifying against 750+ Indian legal rules. This takes 3-5
                      seconds.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {quickScanReady && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-green-100 mt-6">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Sparkles className="h-3 w-3 text-green-400 absolute -top-1 -right-1" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-green-800">
                      Detailed AI Scan Complete!
                    </p>
                    <p className="text-xs font-bold text-green-900">
                      Verified red flags, legal citations & negotiation scripts
                      ready
                    </p>
                  </div>
                </div>

                <Button
                  onClick={onContinueToQuickScan}
                  className="w-full button text-impact-heading border-2 border-foreground hover:-translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] gap-2 py-6 text-lg mt-4 group"
                  variant="default"
                >
                  <Shield className="h-5 w-5" />
                  View Detailed Results
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Includes legal citations • Negotiation scripts • Fair
                  alternatives • Penalty info
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

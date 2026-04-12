"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Check,
  Cpu,
  FileText,
  Eye,
  Fingerprint,
  Loader2,
  Lock,
  Globe,
  Brain,
  Scan,
} from "lucide-react";
import { usePrivacy } from "@/lib/privacy";
import type { ProcessingStep, RedactionResult } from "@/lib/privacy";

interface PrivacyDashboardProps {
  redactionStats?: RedactionResult["stats"] | null;
  isProcessing?: boolean;
}

export default function PrivacyDashboard({
  redactionStats,
  isProcessing,
}: PrivacyDashboardProps) {
  const { level, processingSteps, bytesSent } = usePrivacy();

  if (processingSteps.length === 0 && !isProcessing) return null;

  const completedSteps = processingSteps.filter((s) => s.status === "done");
  const deviceSteps = completedSteps.filter((s) => s.location === "device");
  const serverSteps = completedSteps.filter((s) => s.location === "server");

  const getStepIcon = (step: ProcessingStep) => {
    const iconMap: Record<string, React.ReactNode> = {
      pdf_parse: <FileText className="h-3.5 w-3.5" />,
      ocr: <Scan className="h-3.5 w-3.5" />,
      text_extract: <FileText className="h-3.5 w-3.5" />,
      clause_split: <Brain className="h-3.5 w-3.5" />,
      ml_classify: <Cpu className="h-3.5 w-3.5" />,
      pii_redact: <Fingerprint className="h-3.5 w-3.5" />,
      review: <Eye className="h-3.5 w-3.5" />,
      ai_send: <Globe className="h-3.5 w-3.5" />,
    };
    return iconMap[step.id] || <Check className="h-3.5 w-3.5" />;
  };

  const config = {
    maximum: {
      color: "text-emerald-500",
      badgeColor: "border-emerald-900/50 text-emerald-400 bg-[#0e0e0e]",
      label: "MAXIMUM",
      icon: <Lock className="h-3 w-3 mr-1" />,
    },
    balanced: {
      color: "text-cyan-500",
      badgeColor: "border-cyan-900/50 text-cyan-400 bg-[#0e0e0e]",
      label: "BALANCED",
      icon: <Shield className="h-3 w-3 mr-1" />,
    },
    standard: {
      color: "text-neutral-400",
      badgeColor: "border-neutral-800 text-neutral-400 bg-[#0e0e0e]",
      label: "STANDARD",
      icon: <Shield className="h-3 w-3 mr-1" />,
    },
  };
  const c = config[level as keyof typeof config] || config.standard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm h-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-500/20 to-transparent" />
        
        <div className="pb-4 pt-5 px-6 border-b border-neutral-900/50 bg-[#050505]/50">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono uppercase tracking-widest flex items-center gap-2 text-neutral-300">
              <Shield className={`h-4 w-4 ${c.color}`} />
              Telemetry
            </h3>
            <div
              className={`text-[9px] font-mono uppercase tracking-widest border px-2 py-0.5 rounded-sm flex items-center ${c.badgeColor}`}
            >
              {c.icon} {c.label} MODE
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          {/* Processing Steps */}
          <div className="space-y-4 mb-6 flex-1">
            <AnimatePresence mode="popLayout">
              {processingSteps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-sm"
                >
                  {step.status === "done" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  ) : step.status === "pending" ? (
                    <Loader2 className="h-3.5 w-3.5 text-cyan-500 animate-spin flex-shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 text-neutral-700 flex-shrink-0 flex items-center justify-center font-mono">
                      -
                    </span>
                  )}
                  <span
                    className={
                      step.status === "done"
                        ? "font-mono uppercase tracking-widest text-[10px] text-neutral-400"
                        : step.status === "pending"
                          ? "font-mono uppercase tracking-widest text-[10px] text-cyan-400"
                          : "font-mono uppercase tracking-widest text-[10px] text-neutral-700"
                    }
                  >
                    {step.label}
                  </span>
                  {step.location === "device" && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-sm border font-mono uppercase tracking-widest text-amber-500 border-amber-900/30 bg-[#0e0e0e] ml-auto"
                    >
                      LOCAL
                    </span>
                  )}
                  {step.location === "server" && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-sm border font-mono uppercase tracking-widest text-cyan-500 border-cyan-900/30 bg-[#0e0e0e] ml-auto"
                    >
                      SERVER
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Redaction Stats */}
          {redactionStats && redactionStats.total > 0 && (
            <div className="pt-5 border-t border-neutral-900/50">
              <p className="text-[10px] text-neutral-500 font-mono mb-3 uppercase tracking-widest flex items-center gap-2">
                <Fingerprint className="w-3.5 h-3.5" /> PII REDACTED
              </p>
              <div className="flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-widest text-neutral-400">
                {(redactionStats.names ?? 0) > 0 && (
                  <span className="border border-neutral-800 bg-[#0e0e0e] text-neutral-300 px-2 py-1 rounded-sm">
                    👤 {redactionStats.names} NAMES
                  </span>
                )}
                {(redactionStats.ids ?? 0) > 0 && (
                  <span className="border border-neutral-800 bg-[#0e0e0e] text-neutral-300 px-2 py-1 rounded-sm">
                    🪪 {redactionStats.ids} IDS
                  </span>
                )}
                {(redactionStats.contacts ?? 0) > 0 && (
                  <span className="border border-neutral-800 bg-[#0e0e0e] text-neutral-300 px-2 py-1 rounded-sm">
                    📱 {redactionStats.contacts} CONTACTS
                  </span>
                )}
                {(redactionStats.addresses ?? 0) > 0 && (
                  <span className="border border-neutral-800 bg-[#0e0e0e] text-neutral-300 px-2 py-1 rounded-sm">
                    📍 {redactionStats.addresses} ADDRESSES
                  </span>
                )}
                {(redactionStats.financial ?? 0) > 0 && (
                  <span className="border border-neutral-800 bg-[#0e0e0e] text-neutral-300 px-2 py-1 rounded-sm">
                    💰 {redactionStats.financial} AMOUNTS
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bytes Sent */}
          <div className="mt-5 pt-5 border-t border-neutral-900/50">
            <p className="text-[10px] font-mono text-neutral-500 flex items-center gap-2 uppercase tracking-widest">
              <Lock className="h-3.5 w-3.5" />
              EXFILTRATED VECTOR:{" "}
              <span className="text-emerald-500 bg-[#0e0e0e] border border-emerald-900/30 px-2 py-0.5 rounded-sm">
                {bytesSent === 0
                  ? "0 BYTES"
                  : bytesSent < 1024
                    ? `${bytesSent} BYTES`
                    : `${(bytesSent / 1024).toFixed(1)} KB`}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

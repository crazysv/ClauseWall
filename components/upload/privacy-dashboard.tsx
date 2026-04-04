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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      color: "text-green-600",
      badgeColor: "border-green-600 text-green-700",
      label: "MAXIMUM",
      icon: <Lock className="h-3 w-3 mr-1" />,
    },
    balanced: {
      color: "text-blue-600",
      badgeColor: "border-blue-600 text-blue-700",
      label: "BALANCED",
      icon: <Shield className="h-3 w-3 mr-1" />,
    },
    standard: {
      color: "text-slate-600",
      badgeColor: "border-slate-600 text-slate-700",
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
      <Card className="card-impact border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-card h-full flex flex-col">
        <CardHeader className="pb-3 border-b-2 border-foreground">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
              <Shield className={`h-5 w-5 ${c.color}`} />
              Live Processing
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-[10px] font-black uppercase tracking-wider border-2 ${c.badgeColor}`}
            >
              {c.icon} {c.label} Mode
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Processing Steps */}
          <div className="space-y-3 mb-6">
            <AnimatePresence mode="popLayout">
              {processingSteps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-sm"
                >
                  {step.status === "done" ? (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : step.status === "pending" ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                  ) : (
                    <span className="h-4 w-4 text-muted-foreground flex-shrink-0 flex items-center justify-center font-bold">
                      −
                    </span>
                  )}
                  <span
                    className={
                      step.status === "done"
                        ? "font-black uppercase tracking-wider text-foreground"
                        : step.status === "pending"
                          ? "font-black uppercase tracking-wider text-primary"
                          : "font-bold text-muted-foreground"
                    }
                  >
                    {step.label}
                  </span>
                  {step.location === "device" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-2 font-black uppercase tracking-wider text-muted-foreground border-foreground bg-muted"
                    >
                      LOCAL
                    </Badge>
                  )}
                  {step.location === "server" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-2 font-black uppercase tracking-wider border-blue-600 text-blue-700 bg-blue-100"
                    >
                      SERVER
                    </Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Redaction Stats */}
          {redactionStats && redactionStats.total > 0 && (
            <div className="pt-4 border-t-2 border-foreground border-dashed">
              <p className="text-xs text-muted-foreground font-black mb-2 uppercase tracking-wider">
                PII REDACTED LOCALLY
              </p>
              <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs font-black uppercase tracking-wider text-foreground">
                {(redactionStats.names ?? 0) > 0 && (
                  <span className="border-2 border-foreground bg-muted shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] px-2 py-1">
                    👤 {redactionStats.names} names
                  </span>
                )}
                {(redactionStats.ids ?? 0) > 0 && (
                  <span className="border-2 border-foreground bg-muted shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] px-2 py-1">
                    🪪 {redactionStats.ids} IDs
                  </span>
                )}
                {(redactionStats.contacts ?? 0) > 0 && (
                  <span className="border-2 border-foreground bg-muted shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] px-2 py-1">
                    📱 {redactionStats.contacts} contacts
                  </span>
                )}
                {(redactionStats.addresses ?? 0) > 0 && (
                  <span className="border-2 border-foreground bg-muted shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] px-2 py-1">
                    📍 {redactionStats.addresses} addresses
                  </span>
                )}
                {(redactionStats.financial ?? 0) > 0 && (
                  <span className="border-2 border-foreground bg-muted shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] px-2 py-1">
                    💰 {redactionStats.financial} amounts
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bytes Sent */}
          <div className="mt-4 pt-4 border-t-2 border-foreground border-dashed">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-bold">
              <Lock className="h-3.5 w-3.5" />
              Data sent to server:{" "}
              <span className="font-black uppercase tracking-wider text-background bg-foreground px-2 py-0.5 border-2 border-foreground">
                {bytesSent === 0
                  ? "0 bytes"
                  : bytesSent < 1024
                    ? `${bytesSent} bytes`
                    : `${(bytesSent / 1024).toFixed(1)} KB`}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

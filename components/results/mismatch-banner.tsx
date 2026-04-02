"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MapPin, FileText, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStateName, getDocumentTypeLabel, JURISDICTIONS } from "@/lib/utils/constants";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MismatchBannerProps {
  documentId: string;
  selectedJurisdiction: string;
  detectedJurisdiction: string | null;
  selectedDocType: string;
  detectedDocType: string | null;
}

export function MismatchBanner({
  documentId,
  selectedJurisdiction,
  detectedJurisdiction,
  selectedDocType,
  detectedDocType,
}: MismatchBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // ── Normalize jurisdiction for comparison ──
  const normalizeJurisdiction = (value: string | null): string | null => {
    if (!value) return null;
    
    const trimmed = value.trim();
    
    if (trimmed.toUpperCase().startsWith("IN-")) {
      return trimmed.toUpperCase();
    }
    
    const match = JURISDICTIONS.find(
      (j) => j.label.toLowerCase() === trimmed.toLowerCase()
    );
    
    return match?.value || trimmed.toUpperCase();
  };

  // ── Normalize document type for comparison ──
  const normalizeDocType = (value: string | null): string | null => {
    if (!value) return null;
    
    const normalized = value.toLowerCase().trim();
    
    const mappings: Record<string, string> = {
      "rental": "rental",
      "leave and license": "rental",
      "leave & license": "rental",
      "rent agreement": "rental",
      "lease": "rental",
      "employment": "employment",
      "offer letter": "employment",
      "job offer": "employment",
      "appointment letter": "employment",
      "terms of service": "tos",
      "terms and conditions": "tos",
      "privacy policy": "tos",
      "tos": "tos",
      "loan": "loan",
      "loan agreement": "loan",
      "sanction letter": "loan",
      "freelance": "freelance",
      "service contract": "freelance",
      "consulting": "freelance",
      "service agreement": "freelance",
      "sale": "sale",
      "sale agreement": "sale",
      "sale deed": "sale",
      "agreement to sell": "sale",
      "partnership": "partnership",
      "shareholder": "partnership",
      "shareholder agreement": "partnership",
      "llp agreement": "partnership",
      "nda": "nda",
      "non-disclosure": "nda",
      "non-disclosure agreement": "nda",
      "confidentiality": "nda",
      "confidentiality agreement": "nda",
    };
    
    return mappings[normalized] || normalized;
  };

  // ── Check for mismatches using normalized values ──
  const normalizedSelected = normalizeJurisdiction(selectedJurisdiction);
  const normalizedDetected = normalizeJurisdiction(detectedJurisdiction);

  const hasJurisdictionMismatch = 
    normalizedDetected !== null && 
    normalizedSelected !== null &&
    normalizedDetected !== normalizedSelected;

  const normalizedSelectedDocType = normalizeDocType(selectedDocType);
  const normalizedDetectedDocType = normalizeDocType(detectedDocType);

  const hasDocTypeMismatch = 
    normalizedDetectedDocType !== null && 
    normalizedSelectedDocType !== null &&
    normalizedDetectedDocType !== normalizedSelectedDocType && 
    normalizedDetectedDocType !== "other";

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          newJurisdiction: hasJurisdictionMismatch ? normalizedDetected : selectedJurisdiction,
          newDocumentType: hasDocTypeMismatch ? normalizedDetectedDocType : selectedDocType,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const changes = [];
        if (hasJurisdictionMismatch && detectedJurisdiction) {
          changes.push(getStateName(normalizedDetected!));
        }
        if (hasDocTypeMismatch && detectedDocType) {
          changes.push(getDocumentTypeLabel(normalizedDetectedDocType!));
        }
        
        toast.success(`Re-analyzing with ${changes.join(" + ")}...`);
        router.push(`/analyze/${documentId}`);
      } else {
        toast.error(data.error || "Failed to re-analyze");
        setReanalyzing(false);
      }
    } catch (err) {
      toast.error("Failed to re-analyze. Please try again.");
      setReanalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && (hasJurisdictionMismatch || hasDocTypeMismatch) && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-md relative overflow-hidden group"
        >
          {/* Decorative left accent */}
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-400 group-hover:bg-amber-500 transition-colors" />
          
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors focus:ring-2 focus:ring-amber-400 focus:outline-none"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4 pl-3">
            <div className="flex items-center justify-center flex-shrink-0 bg-amber-100 p-3 rounded-xl shadow-sm dark:shadow-slate-900/20 border border-amber-200">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>

            <div className="flex-1 pr-8">
              <h3 className="text-sm font-black text-amber-900 tracking-wider mb-2 uppercase flex items-center gap-2">
                {hasJurisdictionMismatch && hasDocTypeMismatch
                  ? "Multiple Validation Anomalies Detected"
                  : hasJurisdictionMismatch
                    ? "Jurisdiction Validation Anomaly"
                    : "Document Classification Anomaly"}
              </h3>

              <div className="text-sm font-medium text-amber-800/90 mb-4 space-y-3">
                {hasJurisdictionMismatch && (
                  <p className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    <span className="leading-relaxed">
                      We detected <strong className="text-amber-900 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded mx-1 border border-amber-200">{getStateName(normalizedDetected!)}</strong> laws locked within the contract DNA, but your analysis parameters are currently forcing <strong className="text-amber-900 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded mx-1 shadow-sm dark:shadow-slate-900/20 border border-amber-200">{getStateName(selectedJurisdiction)}</strong> logic blocks.
                    </span>
                  </p>
                )}

                {hasDocTypeMismatch && (
                  <p className="flex items-start gap-2.5">
                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    <span className="leading-relaxed">
                      Our structure analysis identifies this as a <strong className="text-amber-900 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded mx-1 shadow-sm dark:shadow-slate-900/20 border border-amber-200">{getDocumentTypeLabel(normalizedDetectedDocType!)}</strong>, but the scanner is running logic traps designed for a <strong className="text-amber-900 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded mx-1 shadow-sm dark:shadow-slate-900/20 border border-amber-200">{getDocumentTypeLabel(selectedDocType)}</strong>.
                    </span>
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900/50 border border-amber-200/50 p-2.5 rounded-lg mb-4 inline-flex items-center gap-2">
                 <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                 <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                   Warning: Running incorrect logic parameters artificially corrupts the final risk score.
                 </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReanalyze}
                  disabled={reanalyzing}
                  className="gap-2 bg-white dark:bg-card text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 hover:text-amber-900 font-bold shadow-sm dark:shadow-slate-900/20 rounded-lg transition-all animate-pulse-once"
                >
                  {reanalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Re-compiling Structure...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Use AI Detected Values & Override Settings
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setDismissed(true)}
                  className="text-xs font-bold text-amber-600/70 hover:text-amber-900 transition-colors underline decoration-amber-300 underline-offset-4"
                >
                  Ignore & Keep Current Settings
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
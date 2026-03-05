"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MapPin, FileText, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import { toast } from "sonner";

interface MismatchBannerProps {
  documentId: string;
  // Jurisdiction
  selectedJurisdiction: string;
  detectedJurisdiction: string | null;
  // Document Type
  selectedDocType: string;
  detectedDocType: string | null;
}

export default function MismatchBanner({
  documentId,
  selectedJurisdiction,
  detectedJurisdiction,
  selectedDocType,
  detectedDocType,
}: MismatchBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Check for mismatches
  const hasJurisdictionMismatch = 
    detectedJurisdiction && 
    detectedJurisdiction !== selectedJurisdiction;
  
  const hasDocTypeMismatch = 
    detectedDocType && 
    detectedDocType !== selectedDocType && 
    detectedDocType !== "other";

  // If no mismatch or dismissed, don't render
  if (dismissed || (!hasJurisdictionMismatch && !hasDocTypeMismatch)) {
    return null;
  }

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await fetch("/api/reanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          newJurisdiction: hasJurisdictionMismatch ? detectedJurisdiction : selectedJurisdiction,
          newDocumentType: hasDocTypeMismatch ? detectedDocType : selectedDocType,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const changes = [];
        if (hasJurisdictionMismatch) changes.push(getStateName(detectedJurisdiction!));
        if (hasDocTypeMismatch) changes.push(getDocumentTypeLabel(detectedDocType!));
        
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
    <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 relative">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-yellow-400/70" />
      </button>

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>

        <div className="flex-1 pr-6">
          <h3 className="font-semibold text-yellow-300 mb-1">
            {hasJurisdictionMismatch && hasDocTypeMismatch
              ? "Multiple Mismatches Detected"
              : hasJurisdictionMismatch
                ? "Jurisdiction Mismatch Detected"
                : "Document Type Mismatch Detected"}
          </h3>

          <div className="text-sm text-yellow-200/80 mb-3 space-y-2">
            {hasJurisdictionMismatch && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>
                  Contract mentions{" "}
                  <strong className="text-yellow-200">
                    {getStateName(detectedJurisdiction!)}
                  </strong>{" "}
                  but you selected{" "}
                  <strong className="text-yellow-200">
                    {getStateName(selectedJurisdiction)}
                  </strong>
                </span>
              </p>
            )}

            {hasDocTypeMismatch && (
              <p className="flex items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span>
                  This looks like{" "}
                  <strong className="text-yellow-200">
                    {getDocumentTypeLabel(detectedDocType!)}
                  </strong>{" "}
                  but you selected{" "}
                  <strong className="text-yellow-200">
                    {getDocumentTypeLabel(selectedDocType)}
                  </strong>
                </span>
              </p>
            )}
          </div>

          <p className="text-xs text-yellow-300/60 mb-3">
            Using incorrect settings may result in wrong legal references and risk scores.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              size="sm"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {reanalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Re-analyze with Correct Settings
                </>
              )}
            </Button>

            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-yellow-300/70 hover:text-yellow-300 transition-colors"
            >
              Keep Current Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
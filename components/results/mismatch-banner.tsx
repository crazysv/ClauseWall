"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MapPin, FileText, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStateName, getDocumentTypeLabel, JURISDICTIONS } from "@/lib/utils/constants";
import { toast } from "sonner";

interface MismatchBannerProps {
  documentId: string;
  selectedJurisdiction: string;
  detectedJurisdiction: string | null;
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

  // ── Normalize jurisdiction for comparison ──
  const normalizeJurisdiction = (value: string | null): string | null => {
    if (!value) return null;
    
    const trimmed = value.trim();
    
    // If it's already a code like "IN-KA", normalize to uppercase
    if (trimmed.toUpperCase().startsWith("IN-")) {
      return trimmed.toUpperCase();
    }
    
    // If it's a name like "Karnataka", find the matching code
    const match = JURISDICTIONS.find(
      (j) => j.label.toLowerCase() === trimmed.toLowerCase()
    );
    
    return match?.value || trimmed.toUpperCase();
  };

  // ── Normalize document type for comparison ──
  const normalizeDocType = (value: string | null): string | null => {
    if (!value) return null;
    
    const normalized = value.toLowerCase().trim();
    
    // Map common variations to standard values
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
                    {getStateName(normalizedDetected!)}
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
                    {getDocumentTypeLabel(normalizedDetectedDocType!)}
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
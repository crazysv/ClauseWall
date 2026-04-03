"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Eye,
  Send,
  X,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { RedactionResult } from "@/lib/privacy";

interface PreSendReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  redactedClauses: string[];
  redactionStats: RedactionResult["stats"];
  originalClauseCount: number;
}

export default function PreSendReviewModal({
  isOpen,
  onClose,
  onApprove,
  redactedClauses,
  redactionStats,
  originalClauseCount,
}: PreSendReviewModalProps) {
  const [showAllClauses, setShowAllClauses] = useState(false);

  const displayClauses = showAllClauses
    ? redactedClauses
    : redactedClauses.slice(0, 3);

  const totalBytes = redactedClauses.reduce((sum, c) => sum + c.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl card-impact p-0 overflow-hidden border-2 border-foreground">
        {/* Header styling */}
        <div className="bg-muted border-b-2 border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Pre-Send Review
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold pt-2">
              Review your document before sending to ClauseWall cloud for Deep Analysis.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Redaction Stats */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-black text-foreground uppercase tracking-wider">
              Privacy Protection Applied
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm text-foreground font-bold">
            {redactionStats.names > 0 && (
              <span className="flex items-center gap-2 bg-muted p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                <Check className="h-4 w-4 text-primary" />
                {redactionStats.names} names
              </span>
            )}
            {redactionStats.ids > 0 && (
              <span className="flex items-center gap-2 bg-muted p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                <Check className="h-4 w-4 text-primary" />
                {redactionStats.ids} IDs
              </span>
            )}
            {redactionStats.contacts > 0 && (
              <span className="flex items-center gap-2 bg-muted p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                <Check className="h-4 w-4 text-primary" />
                {redactionStats.contacts} contacts
              </span>
            )}
            {redactionStats.addresses > 0 && (
              <span className="flex items-center gap-2 bg-muted p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                <Check className="h-4 w-4 text-primary" />
                {redactionStats.addresses} addresses
              </span>
            )}
            {redactionStats.financial > 0 && (
              <span className="flex items-center gap-2 bg-muted p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                <Check className="h-4 w-4 text-primary" />
                {redactionStats.financial} amounts
              </span>
            )}
          </div>
        </div>

        {/* Clause Preview */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase">
              {originalClauseCount} clauses • {(totalBytes / 1024).toFixed(1)} KB
            </p>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {displayClauses.map((clause, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 border-2 border-foreground bg-background text-xs text-foreground font-mono leading-relaxed shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]"
              >
                <span className="text-primary font-bold font-sans">
                  Clause {i + 1}:
                </span>{" "}
                {clause.length > 200
                  ? clause.substring(0, 200) + "..."
                  : clause}
              </motion.div>
            ))}
          </div>

          {redactedClauses.length > 3 && (
            <button
              onClick={() => setShowAllClauses(!showAllClauses)}
              className="flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:underline"
            >
              {showAllClauses ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show all {redactedClauses.length} clauses
                </>
              )}
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} className="font-black uppercase tracking-wider border-2 border-foreground hover:-translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:bg-background">
              Cancel
            </Button>
            <Button onClick={onApprove} className="gap-2 button text-impact-heading border-2 border-foreground hover:-translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] px-8" variant="default">
              <UploadCloud className="h-4 w-4" />
              Send for Deep Analysis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
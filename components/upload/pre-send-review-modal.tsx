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
      <DialogContent className="bg-gray-900 border-gray-800 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-400" />
            Review Before Sending
          </DialogTitle>
          <DialogDescription>
            The following anonymized text will be sent to our AI for detailed
            analysis. No original text or personal data is included.
          </DialogDescription>
        </DialogHeader>

        {/* Redaction Stats */}
        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">
              Privacy Protection Applied
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-300/70">
            {redactionStats.names > 0 && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {redactionStats.names} names redacted
              </span>
            )}
            {redactionStats.ids > 0 && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {redactionStats.ids} IDs redacted
              </span>
            )}
            {redactionStats.contacts > 0 && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {redactionStats.contacts} contacts redacted
              </span>
            )}
            {redactionStats.addresses > 0 && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {redactionStats.addresses} addresses redacted
              </span>
            )}
            {redactionStats.financial > 0 && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {redactionStats.financial} amounts redacted
              </span>
            )}
            {redactionStats.total === 0 && (
              <span className="col-span-2">No personal data detected</span>
            )}
          </div>
        </div>

        {/* Clause Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              {originalClauseCount} clauses will be sent ({(totalBytes / 1024).toFixed(1)} KB)
            </p>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {displayClauses.map((clause, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-muted-foreground font-mono leading-relaxed"
              >
                <span className="text-blue-400 font-sans font-medium">
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
              className="flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300"
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

        {/* Highlighted redactions */}
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Fingerprint className="h-3 w-3 text-green-400" />
            Redacted items appear as{" "}
            <code className="px-1 py-0.5 rounded bg-green-500/10 text-green-400">
              [PERSON]
            </code>{" "}
            <code className="px-1 py-0.5 rounded bg-green-500/10 text-green-400">
              [ADDRESS]
            </code>{" "}
            <code className="px-1 py-0.5 rounded bg-green-500/10 text-green-400">
              [AADHAAR]
            </code>{" "}
            etc.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onApprove}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            Send for AI Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
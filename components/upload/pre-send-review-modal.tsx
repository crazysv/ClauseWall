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
      <DialogContent className="sm:max-w-xl bg-[#0a0a0a] p-0 overflow-hidden border border-neutral-800 shadow-2xl [&>button]:text-neutral-500 [&>button]:hover:text-white rounded-sm">
        {/* Header styling */}
        <div className="bg-[#050505]/50 border-b border-neutral-900/50 p-6 relative">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <DialogHeader>
            <DialogTitle className="text-[11px] font-mono uppercase tracking-widest flex items-center gap-2 text-cyan-500">
              <ShieldAlert className="h-4 w-4" />
              DEEP ANALYSIS GATEWAY
            </DialogTitle>
            <DialogDescription className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 pt-2 leading-relaxed">
              AUTHORIZE TRANSMISSION OF REDACTED EVIDENCE TO CLOUD INFERENCE ENGINE.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Redaction Stats */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
              LOCAL REDACTION VERIFIED
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-widest text-neutral-400">
            {redactionStats.names > 0 && (
              <span className="flex items-center gap-1.5 bg-[#0e0e0e] px-2 py-1 border border-emerald-900/30 rounded-sm text-emerald-500/80">
                <Check className="h-3 w-3 text-emerald-500" />
                {redactionStats.names} NAMES
              </span>
            )}
            {redactionStats.ids > 0 && (
              <span className="flex items-center gap-1.5 bg-[#0e0e0e] px-2 py-1 border border-emerald-900/30 rounded-sm text-emerald-500/80">
                <Check className="h-3 w-3 text-emerald-500" />
                {redactionStats.ids} IDS
              </span>
            )}
            {redactionStats.contacts > 0 && (
              <span className="flex items-center gap-1.5 bg-[#0e0e0e] px-2 py-1 border border-emerald-900/30 rounded-sm text-emerald-500/80">
                <Check className="h-3 w-3 text-emerald-500" />
                {redactionStats.contacts} CONTACTS
              </span>
            )}
            {redactionStats.addresses > 0 && (
              <span className="flex items-center gap-1.5 bg-[#0e0e0e] px-2 py-1 border border-emerald-900/30 rounded-sm text-emerald-500/80">
                <Check className="h-3 w-3 text-emerald-500" />
                {redactionStats.addresses} ADDRESSES
              </span>
            )}
            {redactionStats.financial > 0 && (
              <span className="flex items-center gap-1.5 bg-[#0e0e0e] px-2 py-1 border border-emerald-900/30 rounded-sm text-emerald-500/80">
                <Check className="h-3 w-3 text-emerald-500" />
                {redactionStats.financial} AMOUNTS
              </span>
            )}
            {Object.values(redactionStats).every(v => v === 0) && (
             <span className="flex items-center gap-1.5 bg-[#0e0e0e] px-2 py-1 border border-neutral-800 rounded-sm text-neutral-500">
               <Check className="h-3 w-3" />
               NO PII DETECTED
             </span>
            )}
          </div>
        </div>

        {/* Clause Preview */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-3 border-t border-neutral-900/50 pt-5">
            <p className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase flex items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5" />
              PAYLOAD: {originalClauseCount} VECTORS • {(totalBytes / 1024).toFixed(1)} KB
            </p>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scroll">
            {displayClauses.map((clause, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 border border-neutral-800 bg-[#050505] rounded-sm text-[11px] text-neutral-400 font-mono leading-relaxed"
              >
                <span className="text-cyan-600/70 mr-2 text-[9px] uppercase tracking-widest">
                  [{String(i + 1).padStart(2, '0')}]
                </span>
                {clause.length > 200
                  ? clause.substring(0, 200) + "..."
                  : clause}
              </motion.div>
            ))}
          </div>

          {redactedClauses.length > 3 && (
            <button
              onClick={() => setShowAllClauses(!showAllClauses)}
              className="flex items-center gap-1 mt-4 text-[9px] font-mono uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              {showAllClauses ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  COLLAPSE PAYLOAD
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  EXPAND ALL {redactedClauses.length} VECTORS
                </>
              )}
            </button>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 bg-[#050505]/50 border-t border-neutral-900/50">
          <div className="flex gap-4 justify-end mt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-transparent border-neutral-800 text-neutral-400 hover:text-white hover:bg-[#0e0e0e] hover:border-neutral-700 font-mono text-[9px] uppercase tracking-widest rounded-sm px-6 h-10"
            >
              ABORT
            </Button>
            <Button
              onClick={onApprove}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] uppercase tracking-widest gap-2 rounded-sm border-0 h-10 px-8 shadow-[0_0_15px_rgba(8,145,178,0.2)] hover:shadow-[0_0_25px_rgba(8,145,178,0.3)] transition-all"
              variant="default"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              AUTHORIZE UPLOAD
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

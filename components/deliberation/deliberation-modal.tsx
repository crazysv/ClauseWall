"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import DeliberationPanel from "./deliberation-panel";
import type { ClauseDeliberation } from "@/lib/deliberation/types";

// ============================================
// PROPS
// ============================================

interface DeliberationModalProps {
  deliberation: ClauseDeliberation;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export default function DeliberationModal({
  deliberation,
  isOpen,
  onClose,
}: DeliberationModalProps) {
  const predConf = Math.round(deliberation.predatorArgument.confidence * 100);
  const guardConf = Math.round(deliberation.guardianArgument.confidence * 100);
  const arbConf = Math.round(deliberation.arbiterVerdict.confidence * 100);
  const durationSec = (deliberation.deliberationDuration / 1000).toFixed(1);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-background border-2 border-foreground card-impact border-foreground border-2 p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span>⚔️</span>
            <span>AI Debate</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-4 sm:px-6 pb-6 space-y-4">
            {/* Clause Text */}
            <div className="p-3 sm:p-4 rounded-none bg-white/[0.03] border border-foreground border-2">
              <p className="text-[10px] text-foreground uppercase tracking-wider mb-1.5">
                Clause Under Deliberation
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                &ldquo;{deliberation.clauseText}&rdquo;
              </p>
              {deliberation.clauseType && (
                <p className="text-[10px] text-foreground mt-2">
                  Type: {deliberation.clauseType} · {deliberation.jurisdiction}
                </p>
              )}
            </div>

            {/* Full Deliberation Panel */}
            <DeliberationPanel deliberation={deliberation} animated={true} />

            {/* Summary Stats Footer */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-foreground border-2">
              <div className="flex items-center gap-1.5 text-xs text-foreground">
                <span>⏱️</span>
                <span>Deliberation time: {durationSec}s</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-foreground">
                <span>📊</span>
                <span className="text-red-400/70">Defense: {predConf}%</span>
                <span className="text-foreground">|</span>
                <span className="text-emerald-400/70">
                  Advocate: {guardConf}%
                </span>
                <span className="text-foreground">|</span>
                <span className="text-amber-400/70">Arbiter: {arbConf}%</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

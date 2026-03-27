"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TextCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  documentId: string;
  onSave: (correctedText: string) => void;
}

export function TextCorrectionModal({
  isOpen,
  onClose,
  originalText,
  documentId,
  onSave,
}: TextCorrectionModalProps) {
  const [correctedText, setCorrectedText] = useState(originalText);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Re-trigger analysis with corrected text
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: correctedText,
          documentId,
          isCorrection: true,
        }),
      });

      if (response.ok) {
        onSave(correctedText);
        onClose();
      }
    } catch (err) {
      console.error("[ClauseWall] Text correction save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = correctedText !== originalText;
  const changeCount = countDifferences(originalText, correctedText);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ✏️ Review & Correct OCR Text
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Edit the extracted text below to fix OCR errors, then re-analyze.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Original (read-only) */}
          <div className="flex flex-col overflow-hidden">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Original OCR Text
            </p>
            <div className="flex-1 overflow-y-auto p-3 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-gray-400 font-mono leading-relaxed">
              {originalText}
            </div>
          </div>

          {/* Editable */}
          <div className="flex flex-col overflow-hidden">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Corrected Text {hasChanges && (
                <span className="text-indigo-400 ml-1">
                  ({changeCount} change{changeCount !== 1 ? "s" : ""})
                </span>
              )}
            </p>
            <Textarea
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
              className="flex-1 min-h-[300px] bg-white/[0.03] border-white/10 font-mono text-sm leading-relaxed resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? "Re-analyzing..." : "Save & Re-analyze"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function countDifferences(a: string, b: string): number {
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  let diffs = 0;
  const maxLen = Math.max(wordsA.length, wordsB.length);
  for (let i = 0; i < maxLen; i++) {
    if (wordsA[i] !== wordsB[i]) diffs++;
  }
  return diffs;
}

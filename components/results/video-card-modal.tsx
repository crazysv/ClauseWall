"use client";

import { useState } from "react";
import { Video, Download, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { generateVideoCard } from "@/lib/utils/video-card";
import { downloadDataUrl } from "@/lib/utils/share";
import { getRiskLevel, getStateName, getDocumentTypeLabel, RISK_LABELS } from "@/lib/utils/constants";
import type { Document, Clause } from "@/types";

interface VideoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  clauses: Clause[];
  verificationRate: number;
}

export function VideoCardModal({ isOpen, onClose, document: doc, clauses, verificationRate }: VideoCardModalProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const riskLevel = getRiskLevel(doc.overall_risk_score);
  const riskLabel = RISK_LABELS[riskLevel];

  const topRedFlag = clauses
    .filter((c) => c.risk_level === "illegal" || c.risk_level === "dangerous")
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))[0]?.explanation || null;

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    setVideoUrl(null);

    try {
      const blob = await generateVideoCard({
        score: doc.overall_risk_score,
        riskLabel,
        documentType: getDocumentTypeLabel(doc.document_type),
        jurisdiction: getStateName(doc.jurisdiction),
        illegalCount: doc.illegal_count,
        dangerousCount: doc.dangerous_count,
        warningCount: doc.warning_count,
        safeCount: doc.safe_count,
        topRedFlag,
        verificationRate,
      }, setProgress);

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      toast.success("Video generated!");
    } catch (err) {
      toast.error("Failed to generate video");
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `clausewall-scorecard-${doc.id.substring(0, 8)}.webm`;
    a.click();
    toast.success("Video downloaded!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-indigo-400" />
            Animated Score Card
          </DialogTitle>
          <DialogDescription>
            Generate an animated video of your contract score reveal
          </DialogDescription>
        </DialogHeader>

        {/* Preview / Generate */}
        <div className="flex flex-col items-center gap-6 py-4">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              muted
              className="rounded-xl border border-white/10 shadow-2xl"
              style={{ width: "100%", maxWidth: 360 }}
            />
          ) : generating ? (
            <div className="w-full max-w-xs space-y-4 text-center py-8">
              <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-400">Rendering video...</p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{progress}%</p>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-6 rounded-xl bg-indigo-50/50 border border-white/10 py-6 md:py-8 lg:py-12 px-4 md:px-4 md:px-6 lg:px-8 cursor-pointer hover:bg-white dark:bg-card/[0.07] transition-colors"
              onClick={handleGenerate}
              style={{ width: "100%", maxWidth: 360 }}
            >
              <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Play className="h-8 w-8 text-indigo-400 ml-1" />
              </div>
              <p className="text-sm text-slate-300 font-medium">Click to generate animated video</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">~4 second animation • WebM format</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {videoUrl ? (
            <>
              <Button onClick={handleDownload} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Download className="h-4 w-4" />
                Download Video
              </Button>
              <Button onClick={handleGenerate} variant="outline" className="gap-2" disabled={generating}>
                <Play className="h-4 w-4" />
                Regenerate
              </Button>
            </>
          ) : !generating ? (
            <Button onClick={handleGenerate} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Video className="h-4 w-4" />
              Generate Video
            </Button>
          ) : null}
        </div>

        <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center">
          Video renders at 1080×1350 resolution. Works best in Chrome/Edge.
        </p>
      </DialogContent>
    </Dialog>
  );
}
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

export default function VideoCardModal({ isOpen, onClose, document: doc, clauses, verificationRate }: VideoCardModalProps) {
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
      console.error(err);
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
      <DialogContent className="bg-background card-impact border-2 border-foreground rounded-none shadow-none max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-wider text-xl text-foreground">
            <Video className="h-5 w-5 text-foreground" />
            Animated Score Card
          </DialogTitle>
          <DialogDescription className="font-bold text-muted-foreground uppercase tracking-wider text-xs mt-2">
            Generate an animated video of your contract score reveal
          </DialogDescription>
        </DialogHeader>

        {/* Preview / Generate */}
        <div className="flex flex-col items-center gap-4 py-4">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              muted
              className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              style={{ width: "100%", maxWidth: 360 }}
            />
          ) : generating ? (
            <div className="w-full max-w-xs space-y-4 text-center py-8">
              <Loader2 className="h-10 w-10 text-foreground animate-spin mx-auto" />
              <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">Rendering video...</p>
              <Progress value={progress} className="h-2 border-2 border-foreground bg-muted [&>div]:bg-foreground" />
              <p className="text-xs font-bold text-muted-foreground">{progress}%</p>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-4 card-impact bg-muted border-2 border-foreground py-12 px-8 cursor-pointer hover:bg-background transition-colors"
              onClick={handleGenerate}
              style={{ width: "100%", maxWidth: 360 }}
            >
              <div className="h-16 w-16 border-2 border-foreground bg-background card-impact flex items-center justify-center">
                <Play className="h-8 w-8 text-foreground ml-1" />
              </div>
              <p className="text-sm text-foreground font-black uppercase tracking-wider">Click to generate animated video</p>
              <p className="text-xs text-muted-foreground font-bold">~4 second animation • WebM format</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {videoUrl ? (
            <>
              <button onClick={handleDownload} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors flex-1">
                <Download className="h-4 w-4" />
                Download Video
              </button>
              <button onClick={handleGenerate} disabled={generating} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
                <Play className="h-4 w-4" />
                Regenerate
              </button>
            </>
          ) : !generating ? (
            <button onClick={handleGenerate} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors w-full">
              <Video className="h-4 w-4" />
              Generate Video
            </button>
          ) : null}
        </div>

        <p className="text-[10px] text-muted-foreground text-center font-bold">
          Video renders at 1080×1350 resolution. Works best in Chrome/Edge.
        </p>
      </DialogContent>
    </Dialog>
  );
}
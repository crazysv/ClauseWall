"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import JSZip from "jszip";
import {
  Download,
  Copy,
  Check,
  Loader2,
  Image as ImageIcon,
  Share2,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getShareUrl,
  shareToWhatsApp,
  shareToTwitter,
  shareToLinkedIn,
  copyToClipboard,
  downloadDataUrl,
  canNativeShare,
  nativeShare,
  dataUrlToFile,
  generateSmartShareText,
} from "@/lib/utils/share";
import {
  getRiskLevel,
  getStateName,
  getDocumentTypeLabel,
} from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import type { Document, Clause } from "@/types";

// ── Types ─────────────────────────────────

type CardFormat = "instagram" | "twitter" | "story" | "carousel";

interface ScoreCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  clauses: Clause[];
  verificationRate: number;
}

interface CarouselRedFlag {
  clauseNumber: number;
  clauseType: string;
  originalText: string;
  explanation: string;
  riskLevel: string;
  riskScore: number;
  legalCitation: string | null;
  fairAlternative: string | null;
}

// ── Format Configs ────────────────────────

const FORMATS: Record<
  CardFormat,
  { width: number; height: number; label: string; icon: typeof Monitor }
> = {
  instagram: {
    width: 1080,
    height: 1350,
    label: "Instagram",
    icon: ImageIcon,
  },
  twitter: {
    width: 1200,
    height: 630,
    label: "Twitter",
    icon: Monitor,
  },
  story: {
    width: 1080,
    height: 1920,
    label: "Story",
    icon: Smartphone,
  },
  carousel: {
    width: 1080,
    height: 1920,
    label: "Carousel",
    icon: Layers,
  },
};

// ── Risk-based Card Themes ──

const CARD_THEMES = {
  safe: {
    gradient: "#ffffff",
    accent: "#16a34a",
    accentBg: "#f0fdf4",
    textPrimary: "#0a0a0a",
    textSecondary: "#0a0a0a",
    textMuted: "#404040",
    cardBg: "#ffffff",
    cardBorder: "#0a0a0a",
    label: "LOW RISK",
    emoji: "✅",
  },
  warning: {
    gradient: "#ffffff",
    accent: "#ca8a04",
    accentBg: "#fefce8",
    textPrimary: "#0a0a0a",
    textSecondary: "#0a0a0a",
    textMuted: "#404040",
    cardBg: "#ffffff",
    cardBorder: "#0a0a0a",
    label: "MEDIUM RISK",
    emoji: "⚠️",
  },
  dangerous: {
    gradient: "#ffffff",
    accent: "#dc2626",
    accentBg: "#fef2f2",
    textPrimary: "#0a0a0a",
    textSecondary: "#0a0a0a",
    textMuted: "#404040",
    cardBg: "#ffffff",
    cardBorder: "#0a0a0a",
    label: "HIGH RISK",
    emoji: "🔴",
  },
  illegal: {
    gradient: "#ffffff",
    accent: "#9333ea",
    accentBg: "#faf5ff",
    textPrimary: "#0a0a0a",
    textSecondary: "#0a0a0a",
    textMuted: "#404040",
    cardBg: "#ffffff",
    cardBorder: "#0a0a0a",
    label: "CRITICAL RISK",
    emoji: "⛔",
  },
};

const FLAG_BADGE_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  illegal: { color: "#c084fc", bg: "rgba(192, 132, 252, 0.15)", label: "⛔ ILLEGAL" },
  dangerous: { color: "#f87171", bg: "rgba(248, 113, 113, 0.15)", label: "🔴 DANGEROUS" },
};

// ── Helpers ───────────────────────────────

function getTopRedFlag(
  clauses: Clause[]
): { text: string; explanation: string } | null {
  const risky = clauses
    .filter((c) => c.risk_level === "illegal" || c.risk_level === "dangerous")
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));

  if (risky.length === 0) return null;

  const clause = risky[0];
  return {
    text: clause.original_text
      ? clause.original_text.length > 100
        ? clause.original_text.substring(0, 97) + "..."
        : clause.original_text
      : "",
    explanation: clause.explanation
      ? clause.explanation.length > 120
        ? clause.explanation.substring(0, 117) + "..."
        : clause.explanation
      : "",
  };
}

function getTopRedFlags(clauses: Clause[], max: number = 3): CarouselRedFlag[] {
  return clauses
    .filter((c) => c.risk_level === "illegal" || c.risk_level === "dangerous")
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, max)
    .map((c) => ({
      clauseNumber: c.clause_number,
      clauseType: c.clause_type || "General",
      originalText: c.original_text || "",
      explanation: c.explanation || "",
      riskLevel: c.risk_level,
      riskScore: c.risk_score || 0,
      legalCitation: c.legal_citation || c.statute_code || null,
      fairAlternative: c.fair_alternative || null,
    }));
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? text.substring(0, max - 3) + "..." : text;
}

// ── Main Component ────────────────────────

export default function ScoreCardModal({
  isOpen,
  onClose,
  document: doc,
  clauses,
  verificationRate,
}: ScoreCardModalProps) {
  const [format, setFormat] = useState<CardFormat>("instagram");
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicShareId, setPublicShareId] = useState<string | null>(
    (doc as any).public_share_id || null
  );

  // Carousel state
  const [carouselPreviews, setCarouselPreviews] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselProgress, setCarouselProgress] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const supabase = createClient();

  const riskLevel = getRiskLevel(doc.overall_risk_score);
  const theme = CARD_THEMES[riskLevel];
  const topRedFlag = getTopRedFlag(clauses);
  const shareUrl = getShareUrl(doc.id);
  const fmt = FORMATS[format];
  const isCarousel = format === "carousel";

  const topRedFlags = useMemo(() => getTopRedFlags(clauses, 3), [clauses]);
  const totalSlides = 2 + topRedFlags.length;

  // QR URL
  const hasQR = !!publicShareId;
  const qrUrl = hasQR
    ? `https://clause-wall.vercel.app/verify/${publicShareId}`
    : null;

  // ── Fetch latest public_share_id ──
  useEffect(() => {
    if (isOpen) {
      const fetchShareId = async () => {
        const { data } = await supabase
          .from("documents")
          .select("public_share_id")
          .eq("id", doc.id)
          .single();

        if (data?.public_share_id) {
          setPublicShareId(data.public_share_id);
        }
      };
      fetchShareId();
    }
  }, [isOpen, doc.id, supabase]);

  // ── Generate single image ──
  const generateImage = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      setPreview(dataUrl);
    } catch (err) {
      console.error("Failed to generate card:", err);
      toast.error("Failed to generate card image");
    }
    setGenerating(false);
  }, []);

  // ── Generate carousel images ──
  const generateCarousel = useCallback(async () => {
    setGenerating(true);
    setCarouselProgress("Preparing slides...");
    await new Promise((resolve) => setTimeout(resolve, 400));

    const previews: string[] = [];
    const validRefs = slideRefs.current.filter(Boolean);

    for (let i = 0; i < validRefs.length; i++) {
      setCarouselProgress(`Generating slide ${i + 1} of ${validRefs.length}...`);
      const ref = validRefs[i];
      if (ref) {
        try {
          const dataUrl = await toPng(ref, { quality: 1.0, pixelRatio: 2 });
          previews.push(dataUrl);
        } catch (err) {
          console.error(`Failed to generate slide ${i + 1}:`, err);
        }
      }
      // Small delay between slides to avoid blocking
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setCarouselPreviews(previews);
    setCurrentSlide(0);
    setCarouselProgress("");
    setGenerating(false);
  }, []);

  // ── Regenerate on format/modal change ──
  useEffect(() => {
    if (isOpen) {
      if (isCarousel) {
        setCarouselPreviews([]);
        setCurrentSlide(0);
        const timer = setTimeout(() => generateCarousel(), 500);
        return () => clearTimeout(timer);
      } else {
        setPreview(null);
        const timer = setTimeout(() => generateImage(), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, format, publicShareId, generateImage, generateCarousel]);

  // ── Handlers ────────────────────────────

  const handleDownload = () => {
    if (!preview) return;
    const filename = `clausewall-scorecard-${doc.id.substring(0, 8)}-${format}.png`;
    downloadDataUrl(preview, filename);
    toast.success("Score card downloaded!");
  };

  const handleDownloadSlide = () => {
    if (!carouselPreviews[currentSlide]) return;
    const filename = `clausewall-slide-${currentSlide + 1}-of-${totalSlides}-${doc.id.substring(0, 8)}.png`;
    downloadDataUrl(carouselPreviews[currentSlide], filename);
    toast.success(`Slide ${currentSlide + 1} downloaded!`);
  };

  const handleDownloadZip = async () => {
    if (carouselPreviews.length === 0) return;
    try {
      const zip = new JSZip();
      carouselPreviews.forEach((dataUrl, i) => {
        const base64 = dataUrl.split(",")[1];
        zip.file(
          `clausewall-slide-${i + 1}-of-${carouselPreviews.length}.png`,
          base64,
          { base64: true }
        );
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clausewall-reel-${doc.id.substring(0, 8)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${carouselPreviews.length} slides downloaded as ZIP!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create ZIP");
    }
  };

  const handleWhatsApp = () => {
    const text = generateSmartShareText(doc as any, topRedFlag?.explanation, "whatsapp");
    shareToWhatsApp(text);
    toast.success("Opening WhatsApp...");
  };

  const handleTwitter = () => {
    const text = generateSmartShareText(doc as any, topRedFlag?.explanation, "twitter");
    shareToTwitter(text, shareUrl);
    toast.success("Opening Twitter...");
  };

  const handleLinkedIn = () => {
    shareToLinkedIn(shareUrl);
    toast.success("Opening LinkedIn...");
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    const imageData = isCarousel ? carouselPreviews[currentSlide] : preview;
    if (!imageData) return;

    const file = dataUrlToFile(
      imageData,
      `clausewall-${isCarousel ? `slide-${currentSlide + 1}` : "scorecard"}-${doc.id.substring(0, 8)}.png`
    );

    const shared = await nativeShare({
      title: `ClauseWall Score: ${doc.overall_risk_score}/100`,
      text: generateSmartShareText(doc as any, topRedFlag?.explanation, "generic"),
      url: shareUrl,
      ...(file ? { files: [file] } : {}),
    });

    if (shared) {
      toast.success("Shared!");
    } else {
      handleCopyLink();
    }
  };

  // ── Card sizing helpers (for single card formats) ──

  const isCompact = format === "twitter";
  const isTall = format === "story";

  const padding = isCompact ? 40 : isTall ? 56 : 48;
  const headerSize = isCompact ? 20 : 24;
  const scoreSize = isCompact ? 64 : isTall ? 80 : 72;
  const gaugeOuterSize = isCompact ? 140 : isTall ? 200 : 170;
  const gaugeRadius = gaugeOuterSize / 2 - 12;
  const gaugeCenter = gaugeOuterSize / 2;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeFilled = (doc.overall_risk_score / 100) * gaugeCircumference;
  const sectionGap = isCompact ? 20 : isTall ? 32 : 28;
  const smallText = isCompact ? 12 : 14;
  const mediumText = isCompact ? 14 : 16;
  const qrSize = isCompact ? 60 : 80;
  const flagFontSize = isCompact ? 13 : 15;

  // ── Carousel gauge constants ──
  const cGaugeOuter = 200;
  const cGaugeRadius = cGaugeOuter / 2 - 12;
  const cGaugeCenter = cGaugeOuter / 2;
  const cGaugeCircumference = 2 * Math.PI * cGaugeRadius;
  const cGaugeFilled = (doc.overall_risk_score / 100) * cGaugeCircumference;

  // ── Shared slide base style ──
  const slideBaseStyle: React.CSSProperties = {
    width: 1080,
    height: 1920,
    background: theme.gradient,
    padding: 56,
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
  };

  // ── Render ──────────────────────────────

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-background card-impact border-2 border-foreground rounded-none shadow-none max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-wider text-xl text-foreground">
              <Share2 className="h-5 w-5 text-foreground" />
              Share Score Card
            </DialogTitle>
            <DialogDescription className="font-bold text-muted-foreground uppercase tracking-wider text-xs mt-2">
              {isCarousel
                ? "Generate a swipeable carousel for Instagram & stories"
                : "Download or share your contract analysis score card"}
            </DialogDescription>
          </DialogHeader>

          {/* ── Format Toggle ── */}
          <div className="flex gap-1 p-1 bg-muted border-2 border-foreground card-impact">
            {(Object.keys(FORMATS) as CardFormat[]).map((f) => {
              const Icon = FORMATS[f].icon;
              return (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    format === f
                      ? "bg-foreground text-background border-2 border-transparent"
                      : "text-muted-foreground hover:text-foreground hover:bg-background border-2 border-transparent hover:border-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{FORMATS[f].label}</span>
                  <span className="sm:hidden">
                    {f === "carousel" ? "🔥" : FORMATS[f].label.substring(0, 3)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Carousel slide count badge ── */}
          {isCarousel && (
            <div className="flex items-center justify-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5 text-foreground" />
              <span>
                {totalSlides} slides • {topRedFlags.length} red flag
                {topRedFlags.length !== 1 ? "s" : ""} detected
              </span>
            </div>
          )}

          {/* ── Preview ── */}
          <div className="flex flex-col items-center gap-3 py-4">
            {isCarousel ? (
              // ── Carousel Preview ──
              generating || carouselPreviews.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 bg-muted border-2 border-foreground card-impact"
                  style={{ width: "100%", maxWidth: 280, aspectRatio: "9 / 16" }}
                >
                  <Loader2 className="h-8 w-8 text-foreground animate-spin" />
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    {carouselProgress || "Generating slides..."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Slide image with navigation */}
                  <div className="relative" style={{ width: "100%", maxWidth: 280 }}>
                    <img
                      src={carouselPreviews[currentSlide]}
                      alt={`Slide ${currentSlide + 1}`}
                      className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full block"
                    />

                    {/* Left arrow */}
                    {currentSlide > 0 && (
                      <button
                        onClick={() => setCurrentSlide((p) => p - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}

                    {/* Right arrow */}
                    {currentSlide < carouselPreviews.length - 1 && (
                      <button
                        onClick={() => setCurrentSlide((p) => p + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    {/* Slide label */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-white font-medium">
                      {currentSlide + 1} / {carouselPreviews.length}
                    </div>
                  </div>

                  {/* Dots */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {carouselPreviews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`transition-all border-2 border-foreground ${
                          i === currentSlide
                            ? "w-6 h-3 bg-foreground"
                            : "w-3 h-3 bg-muted hover:bg-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )
            ) : (
              // ── Single Image Preview (existing) ──
              generating || !preview ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 border-2 border-foreground bg-muted card-impact"
                  style={{
                    width: "100%",
                    maxWidth: 360,
                    aspectRatio: `${fmt.width} / ${fmt.height}`,
                  }}
                >
                  <Loader2 className="h-8 w-8 text-foreground animate-spin" />
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Generating card...</p>
                </div>
              ) : (
                <img
                  src={preview}
                  alt="Score Card Preview"
                  className="border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full block"
                  style={{
                    width: "100%",
                    maxWidth: format === "story" ? 280 : 360,
                  }}
                />
              )
            )}
          </div>

          {/* ── Share Buttons ── */}
          {isCarousel ? (
            // ── Carousel Buttons ──
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={handleDownloadZip}
                disabled={carouselPreviews.length === 0}
                className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors col-span-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download All ({totalSlides} Slides)
              </button>

              <button
                onClick={handleDownloadSlide}
                disabled={carouselPreviews.length === 0}
                className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                This Slide
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </button>

              <button onClick={handleTwitter} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
                <Share2 className="h-4 w-4" />
                Twitter / X
              </button>

              <button onClick={handleLinkedIn} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
                <Share2 className="h-4 w-4" />
                LinkedIn
              </button>

              <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
                {copied ? (
                  <Check className="h-4 w-4 text-background" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>

              {canNativeShare() && (
                <button
                  onClick={handleNativeShare}
                  disabled={carouselPreviews.length === 0}
                  className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" />
                  More...
                </button>
              )}
            </div>
          ) : (
            // ── Single Image Buttons (existing) ──
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={handleDownload}
                disabled={!preview}
                className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </button>

              <button onClick={handleTwitter} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
                <Share2 className="h-4 w-4" />
                Twitter / X
              </button>

              <button onClick={handleLinkedIn} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
                <Share2 className="h-4 w-4" />
                LinkedIn
              </button>

              <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors">
                {copied ? (
                  <Check className="h-4 w-4 text-background" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>

              {canNativeShare() && (
                <button
                  onClick={handleNativeShare}
                  disabled={!preview}
                  className="flex items-center justify-center gap-2 button text-impact-heading bg-muted border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" />
                  More...
                </button>
              )}
            </div>
          )}

          {/* Smart Share Text Preview */}
          <div className="mt-4 p-4 border-2 border-foreground bg-muted card-impact">
            <p className="text-[10px] text-muted-foreground mb-2 font-black uppercase tracking-wider">
              Share Message Preview
            </p>
            <p className="text-xs font-bold text-foreground whitespace-pre-line leading-relaxed pb-1">
              {generateSmartShareText(
                doc as any,
                topRedFlag?.explanation,
                "whatsapp"
              ).substring(0, 200)}
              ...
            </p>
          </div>

          {/* QR Hint */}
          {!hasQR && (
            <p className="text-[10px] text-muted-foreground text-center font-bold">
              💡 Generate a QR verification badge below to include it on your
              score card
            </p>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center font-black uppercase tracking-wider">
            No personal data is included in the shared image.
          </p>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════ */}
      {/* HIDDEN SINGLE CARD — off-screen         */}
      {/* (for instagram / twitter / story)        */}
      {/* ════════════════════════════════════════ */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={cardRef}
          style={{
            width: fmt.width,
            height: fmt.height,
            background: theme.gradient,
            padding: padding,
            fontFamily:
              "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Subtle glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: 200,
              background: `radial-gradient(ellipse at center, ${theme.accent}15 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: sectionGap,
              position: "relative",
              zIndex: 1,
            }}
          >
            <span style={{ fontSize: headerSize + 4 }}>🛡️</span>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: headerSize,
                  fontWeight: 800,
                  color: theme.textPrimary,
                  letterSpacing: 2,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                CLAUSEWALL
              </div>
              <div
                style={{
                  fontSize: smallText,
                  color: theme.textMuted,
                  letterSpacing: 1,
                  marginTop: 2,
                }}
              >
                CONTRACT SCORE CARD
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)`,
              marginBottom: sectionGap,
            }}
          />

          {/* Doc Info */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 24,
              marginBottom: sectionGap,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: mediumText,
                color: theme.textSecondary,
                fontWeight: 500,
              }}
            >
              <span>📄</span>
              {getDocumentTypeLabel(doc.document_type)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: mediumText,
                color: theme.textSecondary,
                fontWeight: 500,
              }}
            >
              <span>📍</span>
              {getStateName(doc.jurisdiction)}
            </div>
          </div>

          {/* Score Gauge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: sectionGap,
              flex: isCompact ? undefined : "0 0 auto",
            }}
          >
            <div style={{ position: "relative", width: gaugeOuterSize, height: gaugeOuterSize }}>
              <svg width={gaugeOuterSize} height={gaugeOuterSize} viewBox={`0 0 ${gaugeOuterSize} ${gaugeOuterSize}`}>
                <circle cx={gaugeCenter} cy={gaugeCenter} r={gaugeRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={12} />
                <circle
                  cx={gaugeCenter}
                  cy={gaugeCenter}
                  r={gaugeRadius}
                  fill="none"
                  stroke={theme.accent}
                  strokeWidth={12}
                  strokeDasharray={`${gaugeFilled} ${gaugeCircumference}`}
                  transform={`rotate(-90 ${gaugeCenter} ${gaugeCenter})`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${theme.accent}60)` }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: scoreSize,
                    fontWeight: 800,
                    color: theme.textPrimary,
                    lineHeight: 1,
                    textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {doc.overall_risk_score}
                </span>
                <span style={{ fontSize: scoreSize * 0.28, color: theme.textMuted, marginTop: 4, fontWeight: 500 }}>
                  / 100
                </span>
              </div>
            </div>

            {/* Risk Label */}
            <div
              style={{
                marginTop: 16,
                padding: "10px 28px",
                borderRadius: 100,
                background: theme.accentBg,
                border: `2px solid ${theme.accent}50`,
                fontSize: mediumText,
                fontWeight: 700,
                color: theme.accent,
                letterSpacing: 1,
                textShadow: `0 0 20px ${theme.accent}40`,
              }}
            >
              {theme.emoji} {theme.label}
            </div>
          </div>

          {/* Clause Breakdown */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: isCompact ? 16 : 24,
              marginBottom: sectionGap,
              padding: isCompact ? "14px 18px" : "18px 28px",
              borderRadius: 16,
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            {[
              { count: doc.illegal_count, label: "Illegal", color: "#c084fc", icon: "⛔" },
              { count: doc.dangerous_count, label: "Dangerous", color: "#f87171", icon: "🔴" },
              { count: doc.warning_count, label: "Warning", color: "#facc15", icon: "⚠️" },
              { count: doc.safe_count, label: "Safe", color: "#4ade80", icon: "✅" },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: isCompact ? 22 : 30,
                    fontWeight: 800,
                    color: item.color,
                    textShadow: `0 0 12px ${item.color}40`,
                  }}
                >
                  {item.count}
                </div>
                <div
                  style={{
                    fontSize: isCompact ? 10 : 12,
                    color: theme.textSecondary,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {item.icon} {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Top Red Flag */}
          {topRedFlag && !isCompact && (
            <div
              style={{
                marginBottom: sectionGap,
                padding: "18px 24px",
                borderRadius: 16,
                background: theme.cardBg,
                borderLeft: `4px solid ${theme.accent}`,
                border: `1px solid ${theme.cardBorder}`,
                borderLeftWidth: 4,
                borderLeftColor: theme.accent,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: theme.accent,
                  letterSpacing: 1,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                🚩 Top Red Flag
              </div>
              <div
                style={{
                  fontSize: flagFontSize,
                  color: theme.textSecondary,
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                {topRedFlag.explanation}
              </div>
            </div>
          )}

          {/* Verification Rate */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: sectionGap,
              fontSize: smallText,
              color: theme.textMuted,
              fontWeight: 500,
            }}
          >
            <span>⚖️</span>
            <span>{verificationRate}% clauses verified against Indian legal database</span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: isCompact ? "14px 18px" : "18px 28px",
              borderRadius: 16,
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            {hasQR && qrUrl ? (
              <div
                style={{
                  background: "white",
                  padding: 10,
                  borderRadius: 12,
                  display: "flex",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                <QRCodeSVG value={qrUrl} size={qrSize} bgColor="#ffffff" fgColor="#111827" level="M" includeMargin={false} />
              </div>
            ) : (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <div style={{ fontSize: isCompact ? 10 : 11, color: theme.textMuted, marginBottom: 4, fontWeight: 500 }}>
                  Verify at
                </div>
                <div style={{ fontSize: isCompact ? 13 : 15, fontWeight: 700, color: theme.accent }}>
                  clausewall.vercel.app
                </div>
              </div>
            )}

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: isCompact ? 18 : 22, fontWeight: 800, color: theme.textPrimary, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                🛡️ ClauseWall
              </div>
              <div style={{ fontSize: isCompact ? 11 : 13, color: theme.textMuted, marginTop: 4, fontWeight: 500 }}>
                India&apos;s AI Contract Analyzer 🇮🇳
              </div>
              <div style={{ fontSize: isCompact ? 11 : 13, color: theme.accent, marginTop: 6, fontWeight: 600 }}>
                Scan your contract free →
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* HIDDEN CAROUSEL SLIDES — off-screen     */}
      {/* (only rendered when carousel selected)   */}
      {/* ════════════════════════════════════════ */}
      {isCarousel && (
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>

          {/* ─── SLIDE 1: Score Overview ─── */}
          <div
            ref={(el) => { slideRefs.current[0] = el; }}
            style={slideBaseStyle}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "60%",
                height: 300,
                background: `radial-gradient(ellipse at center, ${theme.accent}12 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 24, position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: 36 }}>🛡️</span>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", letterSpacing: 2 }}>CLAUSEWALL</div>
                <div style={{ fontSize: 16, color: "#94a3b8", letterSpacing: 1, marginTop: 2 }}>CONTRACT SCORE CARD</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)`, marginBottom: 28 }} />

            {/* Doc Info */}
            <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, color: theme.textSecondary, fontWeight: 500 }}>
                <span>📄</span>
                {getDocumentTypeLabel(doc.document_type)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, color: theme.textSecondary, fontWeight: 500 }}>
                <span>📍</span>
                {getStateName(doc.jurisdiction)}
              </div>
            </div>

            {/* Score Gauge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
              <div style={{ position: "relative", width: cGaugeOuter, height: cGaugeOuter }}>
                <svg width={cGaugeOuter} height={cGaugeOuter} viewBox={`0 0 ${cGaugeOuter} ${cGaugeOuter}`}>
                  <circle cx={cGaugeCenter} cy={cGaugeCenter} r={cGaugeRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={14} />
                  <circle
                    cx={cGaugeCenter}
                    cy={cGaugeCenter}
                    r={cGaugeRadius}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={14}
                    strokeDasharray={`${cGaugeFilled} ${cGaugeCircumference}`}
                    transform={`rotate(-90 ${cGaugeCenter} ${cGaugeCenter})`}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 10px ${theme.accent}60)` }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 88, fontWeight: 800, color: "#ffffff", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                    {doc.overall_risk_score}
                  </span>
                  <span style={{ fontSize: 24, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>/100</span>
                </div>
              </div>

              {/* Risk Label */}
              <div
                style={{
                  marginTop: 20,
                  padding: "12px 32px",
                  borderRadius: 100,
                  background: theme.accentBg,
                  border: `2px solid ${theme.accent}50`,
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.accent,
                  letterSpacing: 1,
                  textShadow: `0 0 20px ${theme.accent}40`,
                }}
              >
                {theme.emoji} {theme.label}
              </div>
            </div>

            {/* Clause Breakdown */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 28,
                marginBottom: 32,
                padding: "20px 32px",
                borderRadius: 16,
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              {[
                { count: doc.illegal_count, label: "Illegal", color: "#c084fc", icon: "⛔" },
                { count: doc.dangerous_count, label: "Dangerous", color: "#f87171", icon: "🔴" },
                { count: doc.warning_count, label: "Warning", color: "#facc15", icon: "⚠️" },
                { count: doc.safe_count, label: "Safe", color: "#4ade80", icon: "✅" },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: item.color, textShadow: `0 0 12px ${item.color}40` }}>
                    {item.count}
                  </div>
                  <div style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4, fontWeight: 500 }}>
                    {item.icon} {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Verification */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32, fontSize: 16, color: theme.textMuted, fontWeight: 500 }}>
              <span>⚖️</span>
              <span>{verificationRate}% verified against Indian legal database</span>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Swipe hint */}
            {topRedFlags.length > 0 && (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 18, color: theme.accent, fontWeight: 600 }}>
                  Swipe to see red flags →
                </div>
              </div>
            )}

            {/* Dots */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: totalSlides }, (_, i) => (
                  <div key={i} style={{ width: i === 0 ? 24 : 8, height: 8, borderRadius: 4, background: i === 0 ? theme.accent : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>1 / {totalSlides}</span>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${theme.cardBorder}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>🛡️ ClauseWall</div>
              <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>India&apos;s AI Contract Analyzer 🇮🇳</div>
            </div>
          </div>

          {/* ─── SLIDES 2..N: Red Flag Slides ─── */}
          {topRedFlags.map((flag, flagIndex) => {
            const slideIndex = flagIndex + 1;
            const badgeStyle = FLAG_BADGE_STYLES[flag.riskLevel] || FLAG_BADGE_STYLES.dangerous;

            return (
              <div
                key={flagIndex}
                ref={(el) => { slideRefs.current[slideIndex] = el; }}
                style={slideBaseStyle}
              >
                {/* Glow */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "60%",
                    height: 300,
                    background: `radial-gradient(ellipse at center, ${badgeStyle.color}12 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }}
                />

                {/* Small header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: 24 }}>🛡️</span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: 2 }}>CLAUSEWALL</div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)`, marginBottom: 40 }} />

                {/* Red Flag Header */}
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 48 }}>🚩</span>
                </div>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#94a3b8", letterSpacing: 3, textTransform: "uppercase" }}>RED FLAG</span>
                </div>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 80, fontWeight: 800, color: badgeStyle.color, lineHeight: 1, textShadow: `0 0 30px ${badgeStyle.color}40` }}>
                    #{flagIndex + 1}
                  </span>
                </div>

                {/* Clause type */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                    {flag.clauseType}
                  </span>
                </div>

                {/* Risk Badge */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                  <div
                    style={{
                      padding: "10px 28px",
                      borderRadius: 100,
                      background: badgeStyle.bg,
                      border: `2px solid ${badgeStyle.color}50`,
                      fontSize: 16,
                      fontWeight: 700,
                      color: badgeStyle.color,
                      letterSpacing: 1,
                    }}
                  >
                    {badgeStyle.label}
                  </div>
                </div>

                {/* Original text quote */}
                <div
                  style={{
                    padding: "20px 24px",
                    borderRadius: 16,
                    background: theme.cardBg,
                    border: `1px solid ${theme.cardBorder}`,
                    borderLeft: `4px solid ${badgeStyle.color}`,
                    marginBottom: 28,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                    📝 Original Clause
                  </div>
                  <div style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 1.7, fontStyle: "italic" }}>
                    &ldquo;{truncate(flag.originalText, 200)}&rdquo;
                  </div>
                </div>

                {/* Explanation */}
                <div
                  style={{
                    padding: "20px 24px",
                    borderRadius: 16,
                    background: theme.cardBg,
                    border: `1px solid ${theme.cardBorder}`,
                    marginBottom: 28,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: badgeStyle.color, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                    💬 Why This Is Bad
                  </div>
                  <div style={{ fontSize: 17, color: theme.textSecondary, lineHeight: 1.7 }}>
                    {truncate(flag.explanation, 250)}
                  </div>
                </div>

                {/* Legal citation */}
                {flag.legalCitation && (
                  <div
                    style={{
                      padding: "16px 24px",
                      borderRadius: 16,
                      background: "rgba(96, 165, 250, 0.08)",
                      border: "1px solid rgba(96, 165, 250, 0.15)",
                      marginBottom: 28,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                      ⚖️ Legal Reference
                    </div>
                    <div style={{ fontSize: 15, color: "#93c5fd", lineHeight: 1.6 }}>
                      {truncate(flag.legalCitation, 120)}
                    </div>
                  </div>
                )}

                {/* Fair alternative */}
                {flag.fairAlternative && (
                  <div
                    style={{
                      padding: "16px 24px",
                      borderRadius: 16,
                      background: "rgba(74, 222, 128, 0.08)",
                      border: "1px solid rgba(74, 222, 128, 0.15)",
                      marginBottom: 28,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                      ✅ Fair Alternative
                    </div>
                    <div style={{ fontSize: 15, color: "#86efac", lineHeight: 1.6 }}>
                      {truncate(flag.fairAlternative, 180)}
                    </div>
                  </div>
                )}

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Swipe hint */}
                {slideIndex < totalSlides - 1 && (
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <span style={{ fontSize: 15, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Swipe →</span>
                  </div>
                )}

                {/* Dots */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {Array.from({ length: totalSlides }, (_, i) => (
                      <div key={i} style={{ width: i === slideIndex ? 24 : 8, height: 8, borderRadius: 4, background: i === slideIndex ? badgeStyle.color : "rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{slideIndex + 1} / {totalSlides}</span>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${theme.cardBorder}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>🛡️ ClauseWall</div>
                  <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>India&apos;s AI Contract Analyzer 🇮🇳</div>
                </div>
              </div>
            );
          })}

          {/* ─── LAST SLIDE: CTA ─── */}
          <div
            ref={(el) => { slideRefs.current[totalSlides - 1] = el; }}
            style={slideBaseStyle}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "60%",
                height: 300,
                background: `radial-gradient(ellipse at center, ${theme.accent}12 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 24, position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: 36 }}>🛡️</span>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", letterSpacing: 2 }}>CLAUSEWALL</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)`, marginBottom: 48 }} />

            {/* CTA Title */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>
                {topRedFlags.length > 0 ? "📋" : "✅"}
              </span>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", lineHeight: 1.3 }}>
                {topRedFlags.length > 0
                  ? "WHAT YOU\nSHOULD DO"
                  : "YOUR CONTRACT\nLOOKS SAFE!"}
              </div>
            </div>

            {/* Action Items */}
            {topRedFlags.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
                {[
                  { num: "1️⃣", title: "Don't sign yet", desc: "Review all flagged clauses carefully before signing anything." },
                  { num: "2️⃣", title: "Negotiate changes", desc: "Use ClauseWall's negotiation playbook with ready-made scripts." },
                  { num: "3️⃣", title: "Know your rights", desc: "Indian law protects you — illegal clauses are void and unenforceable." },
                  { num: "4️⃣", title: "Report bad actors", desc: "Flag predatory entities to protect the community." },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "20px 24px",
                      borderRadius: 16,
                      background: theme.cardBg,
                      border: `1px solid ${theme.cardBorder}`,
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{item.num}</span>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
                {[
                  { icon: "📝", text: "Always read the full contract before signing" },
                  { icon: "📋", text: "Keep a signed copy for your records" },
                  { icon: "⚖️", text: "Know your rights under Indian law" },
                  { icon: "🤝", text: "Share ClauseWall with friends signing contracts" },
                ].map((item) => (
                  <div
                    key={item.text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "18px 24px",
                      borderRadius: 16,
                      background: theme.cardBg,
                      border: `1px solid ${theme.cardBorder}`,
                    }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 1.5 }}>{item.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* QR or URL */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 32 }}>
              {hasQR && qrUrl ? (
                <div style={{ background: "white", padding: 14, borderRadius: 16, display: "flex", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                  <QRCodeSVG value={qrUrl} size={100} bgColor="#ffffff" fgColor="#111827" level="M" includeMargin={false} />
                </div>
              ) : null}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent, marginBottom: 6 }}>
                  Scan YOUR contract free →
                </div>
                <div style={{ fontSize: 16, color: "#94a3b8", fontWeight: 500 }}>
                  clausewall.vercel.app
                </div>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: totalSlides }, (_, i) => (
                  <div key={i} style={{ width: i === totalSlides - 1 ? 24 : 8, height: 8, borderRadius: 4, background: i === totalSlides - 1 ? theme.accent : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{totalSlides} / {totalSlides}</span>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${theme.cardBorder}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>🛡️ ClauseWall</div>
              <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>India&apos;s AI Contract Analyzer 🇮🇳</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Icon Components ───────────────────────

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
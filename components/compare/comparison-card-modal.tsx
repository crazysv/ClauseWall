"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import {
  Download,
  Copy,
  Check,
  Loader2,
  Share2,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Trophy,
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
  shareToWhatsApp,
  shareToTwitter,
  shareToLinkedIn,
  copyToClipboard,
  downloadDataUrl,
  canNativeShare,
  nativeShare,
  dataUrlToFile,
} from "@/lib/utils/share";

// ── Types ─────────────────────────────────

interface ComparisonData {
  score_a: number;
  score_b: number;
  label_a: string;
  label_b: string;
  winner: "A" | "B" | "tie";
  verdict: string;
  key_differences: string[];
}

type CardFormat = "instagram" | "twitter" | "story";

interface ComparisonCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ComparisonData;
  documentType: string;
}

const FORMATS: Record<
  CardFormat,
  { width: number; height: number; label: string; icon: typeof Monitor }
> = {
  instagram: { width: 1080, height: 1350, label: "Instagram", icon: ImageIcon },
  twitter: { width: 1200, height: 630, label: "Twitter", icon: Monitor },
  story: { width: 1080, height: 1920, label: "Story", icon: Smartphone },
};

// ── Helpers ───────────────────────────────

function getScoreTheme(score: number) {
  if (score <= 30)
    return {
      color: "#16a34a",
      label: "LOW RISK",
      bg: "#dcfce7",
      brd: "#000000",
    };
  if (score <= 60)
    return {
      color: "#ca8a04",
      label: "MEDIUM RISK",
      bg: "#fef08a",
      brd: "#000000",
    };
  if (score <= 80)
    return {
      color: "#dc2626",
      label: "HIGH RISK",
      bg: "#fecaca",
      brd: "#000000",
    };
  return { color: "#9333ea", label: "CRITICAL", bg: "#e9d5ff", brd: "#000000" };
}

// ── Component ─────────────────────────────

export default function ComparisonCardModal({
  isOpen,
  onClose,
  data,
  documentType,
}: ComparisonCardModalProps) {
  const [format, setFormat] = useState<CardFormat>("instagram");
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fmt = FORMATS[format];
  const themeA = getScoreTheme(data.score_a);
  const themeB = getScoreTheme(data.score_b);
  const diff = Math.abs(data.score_a - data.score_b);
  const saferPct =
    data.winner === "A"
      ? Math.round((1 - data.score_a / Math.max(data.score_b, 1)) * 100)
      : Math.round((1 - data.score_b / Math.max(data.score_a, 1)) * 100);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });
      setPreview(dataUrl);
    } catch {
      toast.error("Failed to generate card");
    }
    setGenerating(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPreview(null);
      const t = setTimeout(() => generateImage(), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, format, generateImage]);

  const handleDownload = () => {
    if (!preview) return;
    downloadDataUrl(preview, `clausewall-comparison-${format}.png`);
    toast.success("Downloaded!");
  };

  const shareText = `🛡️ Contract Comparison — ClauseWall\n\n🅰️ Contract A: ${data.score_a}/100 ${themeA.label}\n🅱️ Contract B: ${data.score_b}/100 ${themeB.label}\n\n🏆 ${data.winner === "A" ? "Contract A" : data.winner === "B" ? "Contract B" : "Both similar"} is ${saferPct}% safer\n\nCompare yours free → clausewall.vercel.app/compare`;

  const handleWhatsApp = () => {
    shareToWhatsApp(shareText);
    toast.success("Opening WhatsApp...");
  };
  const handleTwitter = () => {
    shareToTwitter(shareText);
    toast.success("Opening Twitter...");
  };
  const handleCopyLink = async () => {
    const ok = await copyToClipboard("https://clause-wall.vercel.app/compare");
    if (ok) {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCompact = format === "twitter";
  const padding = isCompact ? 40 : 48;
  const scoreSize = isCompact ? 56 : 72;
  const sectionGap = isCompact ? 18 : 28;
  const gaugeSize = isCompact ? 120 : 160;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tighter text-black border-b-4 border-black pb-4">
              <Share2 className="h-6 w-6 text-black" />
              SHARE COMPARISON
            </DialogTitle>
            <DialogDescription className="text-sm font-bold text-gray-600 uppercase tracking-widest pt-2">
              DOWNLOAD OR SHARE YOUR CONTRACT COMPARISON CARD
            </DialogDescription>
          </DialogHeader>

          {/* Format Toggle */}
          <div className="flex gap-1.5 p-1 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {(Object.keys(FORMATS) as CardFormat[]).map((f) => {
              const Icon = FORMATS[f].icon;
              return (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors ${format === f ? "bg-black text-white" : "text-black hover:bg-gray-200"}`}
                >
                  <Icon className="h-4 w-4" />
                  {FORMATS[f].label}
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="flex justify-center py-6">
            {generating || !preview ? (
              <div
                className="flex flex-col items-center justify-center gap-3 bg-gray-50 border-4 border-black border-dashed"
                style={{
                  width: "100%",
                  maxWidth: 360,
                  aspectRatio: `${fmt.width}/${fmt.height}`,
                }}
              >
                <Loader2 className="h-10 w-10 text-black animate-spin" />
                <p className="text-sm font-black uppercase tracking-widest text-black">
                  GENERATING...
                </p>
              </div>
            ) : (
              <img
                src={preview}
                alt="Comparison Card"
                className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  width: "100%",
                  maxWidth: format === "story" ? 280 : 360,
                }}
              />
            )}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              disabled={!preview}
              className="gap-2 bg-[#FAEA5F] hover:bg-yellow-400 text-black border-2 border-black font-black uppercase tracking-widest rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              <Download className="h-4 w-4" />
              DOWNLOAD
            </Button>
            <Button
              onClick={handleWhatsApp}
              className="gap-2 bg-[#25D366] hover:bg-[#20b858] text-white border-2 border-black font-black uppercase tracking-widest rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              <Share2 className="h-4 w-4" />
              WHATSAPP
            </Button>
            <Button
              onClick={handleTwitter}
              className="gap-2 bg-black hover:bg-gray-800 text-white border-2 border-black font-black uppercase tracking-widest rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              <Share2 className="h-4 w-4" />
              TWITTER
            </Button>
            <Button
              onClick={handleCopyLink}
              className="gap-2 bg-white hover:bg-gray-100 text-black border-2 border-black font-black uppercase tracking-widest rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "COPIED PLAN!" : "COPY LINK"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Card */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={cardRef}
          style={{
            width: fmt.width,
            height: fmt.height,
            padding,
            background: "#ffffff",
            fontFamily: "Inter, -apple-system, sans-serif",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            border: "8px solid #000000",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: sectionGap,
              position: "relative",
              zIndex: 1,
              paddingBottom: isCompact ? 16 : 24,
              borderBottom: "4px solid #000000",
            }}
          >
            <div
              style={{
                fontSize: isCompact ? 28 : 40,
                fontWeight: 900,
                color: "#000000",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              🛡️ CLAUSEWALL
            </div>
            <div
              style={{
                fontSize: isCompact ? 14 : 18,
                color: "#000000",
                fontWeight: 800,
                letterSpacing: 2,
                marginTop: 8,
                textTransform: "uppercase",
              }}
            >
              CONTRACT COMPARISON
            </div>
          </div>

          {/* VS Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isCompact ? 20 : 40,
              marginBottom: sectionGap,
            }}
          >
            {/* Contract A */}
            <div
              style={{
                textAlign: "center",
                flex: 1,
                border: "4px solid #000000",
                padding: "24px 16px",
                background: "#f8fafc",
                boxShadow: "8px 8px 0px 0px #000000",
              }}
            >
              <div
                style={{
                  fontSize: isCompact ? 18 : 24,
                  fontWeight: 900,
                  color: "#000000",
                  marginBottom: 20,
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    background: "#000",
                    color: "#fff",
                    padding: "4px 8px",
                    marginRight: "8px",
                    border: "2px solid #000",
                  }}
                >
                  A
                </span>
                CONTRACT A
                {data.winner === "A" && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 12,
                      background: "#4ade80",
                      color: "#000",
                      padding: "4px 8px",
                      border: "2px solid #000",
                      marginLeft: 10,
                      fontWeight: 900,
                      boxShadow: "2px 2px 0px 0px #000",
                    }}
                  >
                    🏆 WINNER
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: isCompact ? 72 : 100,
                  fontWeight: 900,
                  color: themeA.color,
                  lineHeight: 1,
                  textShadow: "4px 4px 0px #000000",
                  WebkitTextStroke: "2px #000",
                }}
              >
                {data.score_a}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#000000",
                  marginTop: 8,
                  marginBottom: 20,
                }}
              >
                /100 RISK SCORE
              </div>
              <div
                style={{
                  padding: "8px 24px",
                  background: themeA.bg,
                  border: `2px solid ${themeA.brd}`,
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#000000",
                  display: "inline-block",
                  textTransform: "uppercase",
                  boxShadow: "4px 4px 0px 0px #000000",
                }}
              >
                {themeA.label}
              </div>
            </div>

            {/* VS */}
            <div
              style={{
                fontSize: isCompact ? 32 : 48,
                fontWeight: 900,
                color: "#000000",
                padding: "16px",
                background: "#f1f5f9",
                border: "4px solid #000000",
                boxShadow: "4px 4px 0px 0px #000000",
              }}
            >
              VS
            </div>

            {/* Contract B */}
            <div
              style={{
                textAlign: "center",
                flex: 1,
                border: "4px solid #000000",
                padding: "24px 16px",
                background: "#f8fafc",
                boxShadow: "8px 8px 0px 0px #000000",
              }}
            >
              <div
                style={{
                  fontSize: isCompact ? 18 : 24,
                  fontWeight: 900,
                  color: "#000000",
                  marginBottom: 20,
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    background: "#000",
                    color: "#fff",
                    padding: "4px 8px",
                    marginRight: "8px",
                    border: "2px solid #000",
                  }}
                >
                  B
                </span>
                CONTRACT B
                {data.winner === "B" && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 12,
                      background: "#4ade80",
                      color: "#000",
                      padding: "4px 8px",
                      border: "2px solid #000",
                      marginLeft: 10,
                      fontWeight: 900,
                      boxShadow: "2px 2px 0px 0px #000",
                    }}
                  >
                    🏆 WINNER
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: isCompact ? 72 : 100,
                  fontWeight: 900,
                  color: themeB.color,
                  lineHeight: 1,
                  textShadow: "4px 4px 0px #000000",
                  WebkitTextStroke: "2px #000",
                }}
              >
                {data.score_b}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#000000",
                  marginTop: 8,
                  marginBottom: 20,
                }}
              >
                /100 RISK SCORE
              </div>
              <div
                style={{
                  padding: "8px 24px",
                  background: themeB.bg,
                  border: `2px solid ${themeB.brd}`,
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#000000",
                  display: "inline-block",
                  textTransform: "uppercase",
                  boxShadow: "4px 4px 0px 0px #000000",
                }}
              >
                {themeB.label}
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div
            style={{
              padding: isCompact ? "24px" : "32px",
              background: "#dbeafe",
              border: "4px solid #000000",
              textAlign: "center",
              marginBottom: sectionGap,
              boxShadow: "8px 8px 0px 0px #000000",
            }}
          >
            <div
              style={{
                fontSize: isCompact ? 24 : 32,
                fontWeight: 900,
                color: "#000000",
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              {data.winner === "tie"
                ? "🤝 BOTH CONTRACTS ARE SIMILAR"
                : `📊 ${data.winner === "A" ? "CONTRACT A" : "CONTRACT B"} IS ${saferPct}% SAFER`}
            </div>
            <div
              style={{
                fontSize: isCompact ? 16 : 20,
                color: "#000000",
                fontWeight: 700,
                lineHeight: 1.5,
                borderTop: "2px solid #000",
                paddingTop: 16,
              }}
            >
              {data.verdict.length > 120
                ? data.verdict.substring(0, 117) + "..."
                : data.verdict}
            </div>
          </div>

          {/* Key Differences (non-compact only) */}
          {!isCompact && data.key_differences.length > 0 && (
            <div
              style={{
                marginBottom: sectionGap,
                padding: "24px",
                background: "#fef08a",
                border: "4px solid #000000",
                boxShadow: "8px 8px 0px 0px #000000",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#000000",
                  letterSpacing: 2,
                  marginBottom: 16,
                  borderBottom: "2px solid #000",
                  paddingBottom: 8,
                }}
              >
                ⚡ KEY DIFFERENCES
              </div>
              {data.key_differences.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#000000",
                    lineHeight: 1.6,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 20 }}>→</span>
                  <span>{d.length > 80 ? d.substring(0, 77) + "..." : d}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: isCompact ? "16px 24px" : "24px 32px",
              background: "#000000",
              borderTop: "4px solid #000000",
              margin: `0 -${padding}px -${padding}px -${padding}px`,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isCompact ? 20 : 28,
                  fontWeight: 900,
                  color: "#ffffff",
                }}
              >
                🛡️ CLAUSEWALL
              </div>
              <div
                style={{
                  fontSize: isCompact ? 12 : 16,
                  color: "#94a3b8",
                  marginTop: 4,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                INDIA'S AI CONTRACT ANALYZER 🇮🇳
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: isCompact ? 14 : 18,
                  color: "#4ade80",
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                COMPARE YOURS FREE →
              </div>
              <div
                style={{
                  fontSize: isCompact ? 12 : 16,
                  color: "#ffffff",
                  marginTop: 4,
                  fontWeight: 700,
                }}
              >
                CLAUSEWALL.VERCEL.APP
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

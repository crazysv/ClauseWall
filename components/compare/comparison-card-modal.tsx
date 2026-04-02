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

const FORMATS: Record<CardFormat, { width: number; height: number; label: string; icon: typeof Monitor }> = {
  instagram: { width: 1080, height: 1350, label: "Instagram", icon: ImageIcon },
  twitter: { width: 1200, height: 630, label: "Twitter", icon: Monitor },
  story: { width: 1080, height: 1920, label: "Story", icon: Smartphone },
};

// ── Helpers ───────────────────────────────

function getScoreTheme(score: number) {
  if (score <= 30) return { color: "#4ade80", label: "LOW RISK", bg: "rgba(74, 222, 128, 0.15)" };
  if (score <= 60) return { color: "#facc15", label: "MEDIUM RISK", bg: "rgba(250, 204, 21, 0.15)" };
  if (score <= 80) return { color: "#f87171", label: "HIGH RISK", bg: "rgba(248, 113, 113, 0.15)" };
  return { color: "#c084fc", label: "CRITICAL", bg: "rgba(192, 132, 252, 0.15)" };
}

// ── Component ─────────────────────────────

export function ComparisonCardModal({
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
  const saferPct = data.winner === "A"
    ? Math.round((1 - data.score_a / Math.max(data.score_b, 1)) * 100)
    : Math.round((1 - data.score_b / Math.max(data.score_a, 1)) * 100);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
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

  const handleWhatsApp = () => { shareToWhatsApp(shareText); toast.success("Opening WhatsApp..."); };
  const handleTwitter = () => { shareToTwitter(shareText); toast.success("Opening Twitter..."); };
  const handleCopyLink = async () => {
    const ok = await copyToClipboard("https://clause-wall.vercel.app/compare");
    if (ok) { setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }
  };

  const isCompact = format === "twitter";
  const padding = isCompact ? 40 : 48;
  const scoreSize = isCompact ? 56 : 72;
  const sectionGap = isCompact ? 18 : 28;
  const gaugeSize = isCompact ? 120 : 160;

  function ScoreGauge({ score, size }: { score: number; size: number }) {
    const t = getScoreTheme(score);
    const r = size / 2 - 10;
    const c = size / 2;
    const circ = 2 * Math.PI * r;
    const fill = (score / 100) * circ;
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
          <circle cx={c} cy={c} r={r} fill="none" stroke={t.color} strokeWidth={8}
            strokeDasharray={`${fill} ${circ}`} transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${t.color}60)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: isCompact ? 36 : 48, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>/100</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-indigo-400" />
              Share Comparison
            </DialogTitle>
            <DialogDescription>Download or share your contract comparison card</DialogDescription>
          </DialogHeader>

          {/* Format Toggle */}
          <div className="flex gap-1.5 p-1 bg-indigo-50/50 rounded-xl">
            {(Object.keys(FORMATS) as CardFormat[]).map((f) => {
              const Icon = FORMATS[f].icon;
              return (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${format === f ? "bg-indigo-600 text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30/50"}`}>
                  <Icon className="h-3.5 w-3.5" />{FORMATS[f].label}
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="flex justify-center py-4">
            {generating || !preview ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-indigo-50/50 border border-white/10"
                style={{ width: "100%", maxWidth: 360, aspectRatio: `${fmt.width}/${fmt.height}` }}>
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                <p className="text-xs text-slate-400">Generating...</p>
              </div>
            ) : (
              <img src={preview} alt="Comparison Card" className="rounded-xl shadow-2xl border border-white/10"
                style={{ width: "100%", maxWidth: format === "story" ? 280 : 360 }} />
            )}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleDownload} disabled={!preview} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Download className="h-4 w-4" />Download
            </Button>
            <Button onClick={handleWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
              <Share2 className="h-4 w-4" />WhatsApp
            </Button>
            <Button onClick={handleTwitter} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />Twitter
            </Button>
            <Button onClick={handleCopyLink} variant="outline" className="gap-2">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Card */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div ref={cardRef} style={{
          width: fmt.width, height: fmt.height, padding,
          background: "linear-gradient(145deg, #030508 0%, #0a0f18 50%, #080d15 100%)",
          fontFamily: "Inter, -apple-system, sans-serif",
          display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
        }}>
          {/* Glow */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 200, background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)" }} />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: sectionGap, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: isCompact ? 20 : 24, fontWeight: 800, color: "#fff", letterSpacing: 2, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              🛡️ CLAUSEWALL
            </div>
            <div style={{ fontSize: isCompact ? 12 : 14, color: "#94a3b8", letterSpacing: 1, marginTop: 4 }}>
              CONTRACT COMPARISON
            </div>
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)", marginBottom: sectionGap }} />

          {/* VS Section */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isCompact ? 20 : 40, marginBottom: sectionGap }}>
            {/* Contract A */}
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: isCompact ? 14 : 16, fontWeight: 700, color: data.winner === "A" ? "#4ade80" : "#e2e8f0", marginBottom: 12 }}>
                🅰️ Contract A
                {data.winner === "A" && <span style={{ display: "block", fontSize: 11, color: "#4ade80", marginTop: 4 }}>🏆 WINNER</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ScoreGauge score={data.score_a} size={gaugeSize} />
              </div>
              <div style={{ marginTop: 10, padding: "6px 16px", borderRadius: 100, background: themeA.bg, fontSize: 12, fontWeight: 700, color: themeA.color, display: "inline-block" }}>
                {themeA.label}
              </div>
            </div>

            {/* VS */}
            <div style={{ fontSize: isCompact ? 24 : 32, fontWeight: 800, color: "rgba(255,255,255,0.15)" }}>VS</div>

            {/* Contract B */}
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: isCompact ? 14 : 16, fontWeight: 700, color: data.winner === "B" ? "#4ade80" : "#e2e8f0", marginBottom: 12 }}>
                🅱️ Contract B
                {data.winner === "B" && <span style={{ display: "block", fontSize: 11, color: "#4ade80", marginTop: 4 }}>🏆 WINNER</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ScoreGauge score={data.score_b} size={gaugeSize} />
              </div>
              <div style={{ marginTop: 10, padding: "6px 16px", borderRadius: 100, background: themeB.bg, fontSize: 12, fontWeight: 700, color: themeB.color, display: "inline-block" }}>
                {themeB.label}
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div style={{
            padding: isCompact ? "14px 18px" : "18px 24px", borderRadius: 16,
            background: "rgba(74, 222, 128, 0.06)", border: "1px solid rgba(74, 222, 128, 0.15)",
            textAlign: "center", marginBottom: sectionGap,
          }}>
            <div style={{ fontSize: isCompact ? 14 : 18, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>
              {data.winner === "tie" ? "🤝 Both contracts are similar" : `📊 ${data.winner === "A" ? "Contract A" : "Contract B"} is ${saferPct}% safer`}
            </div>
            <div style={{ fontSize: isCompact ? 12 : 14, color: "#94a3b8", lineHeight: 1.5 }}>
              {data.verdict.length > 120 ? data.verdict.substring(0, 117) + "..." : data.verdict}
            </div>
          </div>

          {/* Key Differences (non-compact only) */}
          {!isCompact && data.key_differences.length > 0 && (
            <div style={{ marginBottom: sectionGap, padding: "16px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 10 }}>⚡ KEY DIFFERENCES</div>
              {data.key_differences.slice(0, 3).map((d, i) => (
                <div key={i} style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6, marginBottom: 4 }}>
                  → {d.length > 80 ? d.substring(0, 77) + "..." : d}
                </div>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isCompact ? "12px 16px" : "16px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <div style={{ fontSize: isCompact ? 16 : 20, fontWeight: 800, color: "#fff" }}>🛡️ ClauseWall</div>
              <div style={{ fontSize: isCompact ? 11 : 13, color: "#94a3b8", marginTop: 2 }}>India&apos;s AI Contract Analyzer 🇮🇳</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: isCompact ? 11 : 13, color: "#4ade80", fontWeight: 600 }}>Compare yours free →</div>
              <div style={{ fontSize: isCompact ? 10 : 12, color: "#64748b", marginTop: 2 }}>clausewall.vercel.app</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
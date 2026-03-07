"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  Share2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWrappedData, type WrappedData } from "@/lib/utils/wrapped-data";
import { downloadDataUrl, shareToWhatsApp } from "@/lib/utils/share";
import Link from "next/link";

export default function WrappedPage() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function load() {
      const d = await getWrappedData();
      setData(d);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!data || data.totalContracts === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-5xl">📊</div>
        <h1 className="text-xl font-bold">No Data Yet</h1>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          Analyze some contracts first to generate your Contract Wrapped
          summary.
        </p>
        <Link href="/upload">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Analyze a Contract
          </Button>
        </Link>
      </div>
    );
  }

  const slides = buildSlides(data);
  const totalSlides = slides.length;

  const next = () => setCurrent((p) => Math.min(p + 1, totalSlides - 1));
  const prev = () => setCurrent((p) => Math.max(p - 1, 0));

  const handleDownloadCurrent = async () => {
    const el = slideRefs.current[current];
    if (!el) return;
    setDownloading(true);
    try {
      const url = await toPng(el, { quality: 1.0, pixelRatio: 2 });
      downloadDataUrl(url, `clausewall-wrapped-${current + 1}.png`);
      toast.success("Slide downloaded!");
    } catch {
      toast.error("Failed");
    }
    setDownloading(false);
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    for (let i = 0; i < totalSlides; i++) {
      const el = slideRefs.current[i];
      if (!el) continue;
      el.style.position = "relative";
      el.style.left = "0";
      try {
        const url = await toPng(el, { quality: 1.0, pixelRatio: 2 });
        downloadDataUrl(url, `clausewall-wrapped-${i + 1}.png`);
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        /* skip */
      }
      el.style.position = "fixed";
      el.style.left = "-9999px";
    }
    toast.success("All slides downloaded!");
    setDownloading(false);
  };

  const handleShare = () => {
    const totalFlags = data.illegalFound + data.dangerousFound;
    const savingsLabel =
      data.estimatedSavings >= 100000
        ? `₹${(data.estimatedSavings / 100000).toFixed(1)}L`
        : `₹${(data.estimatedSavings / 1000).toFixed(0)}K`;

    const text = `🛡️ *My ${data.period} Contract Wrapped — ClauseWall*\n\n📊 ${data.totalContracts} contracts scanned\n🚩 ${totalFlags} red flags caught\n💰 ${savingsLabel} saved\n🏆 ${data.badge.icon} ${data.badge.name}\n${data.personalityType.icon} ${data.personalityType.name}\n\nCheck yours → clausewall.vercel.app/wrapped`;
    shareToWhatsApp(text);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Back */}
      <div className="w-full max-w-md mb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Slide Viewer */}
      <div
        className="relative w-full max-w-md"
        style={{ aspectRatio: "9/16" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <div
              className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ background: slides[current].bg }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center px-10 text-center">
                {slides[current].content}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {current > 0 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {current < totalSlides - 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        )}

        {/* Click to advance */}
        <button
          onClick={next}
          className="absolute inset-0 z-[5]"
          aria-label="Next slide"
        />
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-blue-500" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-6">
        <Button
          onClick={handleDownloadCurrent}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          This Slide
        </Button>
        <Button
          onClick={handleDownloadAll}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          All Slides
        </Button>
        <Button
          onClick={handleShare}
          size="sm"
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {/* Hidden slides for download */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            style={{
              width: 1080,
              height: 1920,
              background: slide.bg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 80,
              fontFamily: "Inter, system-ui, sans-serif",
              textAlign: "center",
            }}
          >
            {slide.exportContent}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SLIDE BUILDER
// ══════════════════════════════════════════════

interface SlideConfig {
  bg: string;
  content: React.ReactNode;
  exportContent: React.ReactNode;
}

function formatSavings(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

function getSavingsComparison(amount: number): string {
  if (amount >= 1000000) return "That's a used car 🚗";
  if (amount >= 500000) return "That's a Royal Enfield 🏍️";
  if (amount >= 200000) return "That's a Europe trip ✈️";
  if (amount >= 100000) return "That's a nice vacation to Goa 🏖️";
  if (amount >= 50000) return "That's a new phone 📱";
  if (amount >= 20000) return "That's a month of good food 🍛";
  return "Every rupee counts 💪";
}

function getIllegalComment(count: number): string {
  if (count >= 10) return "You could write a law textbook at this point.";
  if (count >= 5)
    return `That's ${count} times someone tried to screw you over. And you caught them.`;
  if (count >= 3) return "Three strikes and THEY'RE out.";
  if (count >= 1) return "Even one is too many. Good catch.";
  return "";
}

function getRiskiestComment(type: string, jurisdiction: string): string {
  const stateName = jurisdiction || "";

  const comments: Record<string, string> = {
    rental: `We hope you negotiated that one 😅`,
    employment: `HR really tried it with this one 🙃`,
    loan: `The bank was NOT on your side here 🏦`,
    tos: `Someone read the Terms of Service. Legend. 📜`,
    freelance: `Client thought you wouldn't read it. Surprise! 🎉`,
    nda: `This NDA wanted your silence AND your soul 🤐`,
    sale: `That sale agreement was... aggressive 📃`,
    partnership: `With partners like that, who needs enemies? 🤝`,
  };

  return comments[type] || "Good thing you checked before signing! ✅";
}

function buildSlides(data: WrappedData): SlideConfig[] {
  const slides: SlideConfig[] = [];

  // ═══════════════════════════════════════════
  // SLIDE 1: INTRO
  // ═══════════════════════════════════════════
  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a1628 50%, #1a0a2e 100%)",
    content: (
      <>
        <div className="text-6xl mb-6">🛡️</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          YOUR {data.period}
        </h1>
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          CONTRACT WRAPPED
        </h2>
        <p className="text-gray-500 text-xs mt-4">
          {data.dateRange.first} → {data.dateRange.last}
        </p>
        <p className="text-gray-400 mt-6 text-sm">Tap to continue →</p>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 80, marginBottom: 40 }}>🛡️</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          YOUR {data.period}
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#60a5fa" }}>
          CONTRACT WRAPPED
        </div>
        <div style={{ fontSize: 18, color: "#64748b", marginTop: 30 }}>
          {data.dateRange.first} → {data.dateRange.last}
        </div>
        <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 40 }}>
          clausewall.vercel.app
        </div>
      </>
    ),
  });

  // ═══════════════════════════════════════════
  // SLIDE 2: VOLUME + PERCENTILE
  // ═══════════════════════════════════════════
  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a2818 50%, #051a0c 100%)",
    content: (
      <>
        <p className="text-sm text-green-400 font-bold tracking-widest mb-4">
          📊 THIS YEAR YOU SCANNED
        </p>
        <h1 className="text-8xl font-black text-white mb-2">
          {data.totalContracts}
        </h1>
        <h2 className="text-2xl font-bold text-green-400">CONTRACTS</h2>
        <p className="text-gray-400 mt-4 text-sm">
          That&apos;s more than {data.percentile}% of Indians
        </p>
        <p className="text-gray-500 mt-2 text-xs">
          {data.totalClauses} clauses · {data.dateRange.spanDays} days
        </p>
      </>
    ),
    exportContent: (
      <>
        <div
          style={{
            fontSize: 20,
            color: "#4ade80",
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          📊 THIS YEAR YOU SCANNED
        </div>
        <div style={{ fontSize: 140, fontWeight: 900, color: "#fff" }}>
          {data.totalContracts}
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#4ade80" }}>
          CONTRACTS
        </div>
        <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 20 }}>
          That&apos;s more than {data.percentile}% of Indians
        </div>
        <div style={{ fontSize: 18, color: "#64748b", marginTop: 12 }}>
          {data.totalClauses} clauses · {data.dateRange.spanDays} days
        </div>
      </>
    ),
  });

  // ═══════════════════════════════════════════
  // SLIDE 3: RED FLAGS + PERSONALITY
  // ═══════════════════════════════════════════
  const totalFlags =
    data.illegalFound + data.dangerousFound + data.warningFound;
  const illegalComment = getIllegalComment(data.illegalFound);

  slides.push({
    bg: "linear-gradient(145deg, #0a0303 0%, #2a0808 50%, #1a0505 100%)",
    content: (
      <>
        <p className="text-sm text-red-400 font-bold tracking-widest mb-4">
          🚩 YOU FOUND
        </p>
        <h1 className="text-8xl font-black text-white mb-2">{totalFlags}</h1>
        <h2 className="text-2xl font-bold text-red-400">RED FLAGS</h2>
        <div className="mt-4 space-y-1 text-sm">
          {data.illegalFound > 0 && (
            <p className="text-purple-400">
              ⛔ {data.illegalFound} Illegal
            </p>
          )}
          <p className="text-red-400">
            🔴 {data.dangerousFound} Dangerous
          </p>
          <p className="text-yellow-400">
            ⚠️ {data.warningFound} Warning
          </p>
        </div>
        {illegalComment && (
          <p className="text-gray-400 text-xs mt-4 italic">
            {illegalComment}
          </p>
        )}
      </>
    ),
    exportContent: (
      <>
        <div
          style={{
            fontSize: 20,
            color: "#f87171",
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          🚩 YOU FOUND
        </div>
        <div style={{ fontSize: 140, fontWeight: 900, color: "#fff" }}>
          {totalFlags}
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#f87171" }}>
          RED FLAGS
        </div>
        {data.illegalFound > 0 && (
          <div
            style={{ fontSize: 22, color: "#c084fc", marginTop: 20 }}
          >
            ⛔ {data.illegalFound} Illegal
          </div>
        )}
        <div
          style={{
            fontSize: 22,
            color: "#f87171",
            marginTop: data.illegalFound > 0 ? 8 : 20,
          }}
        >
          🔴 {data.dangerousFound} Dangerous
        </div>
        <div style={{ fontSize: 22, color: "#facc15", marginTop: 8 }}>
          ⚠️ {data.warningFound} Warning
        </div>
        {illegalComment && (
          <div
            style={{
              fontSize: 18,
              color: "#94a3b8",
              marginTop: 24,
              fontStyle: "italic",
            }}
          >
            {illegalComment}
          </div>
        )}
      </>
    ),
  });

  // ═══════════════════════════════════════════
  // SLIDE 4: SAVINGS
  // ═══════════════════════════════════════════
  const savingsLabel = formatSavings(data.estimatedSavings);
  const savingsComparison = getSavingsComparison(data.estimatedSavings);

  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a1a28 50%, #082a18 100%)",
    content: (
      <>
        <p className="text-sm text-green-400 font-bold tracking-widest mb-4">
          💰 YOU SAVED AN ESTIMATED
        </p>
        <h1 className="text-7xl font-black text-white mb-2">
          {savingsLabel}
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          In excessive deposits, penalties & hidden fees
        </p>
        <p className="text-2xl mt-6">
          {data.estimatedSavings >= 100000 ? "🎉" : "🏖️"}
        </p>
        <p className="text-gray-500 text-xs mt-2 italic">
          {savingsComparison}
        </p>
      </>
    ),
    exportContent: (
      <>
        <div
          style={{
            fontSize: 20,
            color: "#4ade80",
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          💰 YOU SAVED AN ESTIMATED
        </div>
        <div style={{ fontSize: 100, fontWeight: 900, color: "#fff" }}>
          {savingsLabel}
        </div>
        <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 20 }}>
          In excessive deposits, penalties & fees
        </div>
        <div style={{ fontSize: 60, marginTop: 30 }}>
          {data.estimatedSavings >= 100000 ? "🎉" : "🏖️"}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#64748b",
            marginTop: 12,
            fontStyle: "italic",
          }}
        >
          {savingsComparison}
        </div>
      </>
    ),
  });

  // ═══════════════════════════════════════════
  // SLIDE 5: RISKIEST CONTRACT
  // ═══════════════════════════════════════════
  if (data.riskiestContract) {
    const riskyComment = getRiskiestComment(
      data.riskiestContract.type,
      data.riskiestContract.jurisdiction
    );

    slides.push({
      bg: "linear-gradient(145deg, #06030a 0%, #1a0530 50%, #0f0320 100%)",
      content: (
        <>
          <p className="text-sm text-purple-400 font-bold tracking-widest mb-4">
            😱 YOUR RISKIEST CONTRACT
          </p>
          <h1 className="text-3xl font-black text-white mb-2 leading-tight">
            {data.riskiestContract.name}
          </h1>
          <p className="text-7xl font-black text-purple-400 my-4">
            {data.riskiestContract.score}/100
          </p>
          <p className="text-gray-400 text-sm italic">{riskyComment}</p>
        </>
      ),
      exportContent: (
        <>
          <div
            style={{
              fontSize: 20,
              color: "#c084fc",
              fontWeight: 700,
              letterSpacing: 4,
              marginBottom: 20,
            }}
          >
            😱 YOUR RISKIEST
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            {data.riskiestContract.name}
          </div>
          <div
            style={{ fontSize: 100, fontWeight: 900, color: "#c084fc" }}
          >
            {data.riskiestContract.score}/100
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#94a3b8",
              marginTop: 20,
              fontStyle: "italic",
            }}
          >
            {riskyComment}
          </div>
        </>
      ),
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 6: SAFEST CONTRACT (if different)
  // ═══════════════════════════════════════════
  if (data.safestContract && data.totalContracts > 1) {
    slides.push({
      bg: "linear-gradient(145deg, #030a05 0%, #082a18 50%, #051a10 100%)",
      content: (
        <>
          <p className="text-sm text-green-400 font-bold tracking-widest mb-4">
            😌 YOUR SAFEST CONTRACT
          </p>
          <h1 className="text-3xl font-black text-white mb-2 leading-tight">
            {data.safestContract.name}
          </h1>
          <p className="text-7xl font-black text-green-400 my-4">
            {data.safestContract.score}/100
          </p>
          <p className="text-gray-400 text-sm italic">
            Someone actually wrote a fair contract. Respect. ✅
          </p>
        </>
      ),
      exportContent: (
        <>
          <div
            style={{
              fontSize: 20,
              color: "#4ade80",
              fontWeight: 700,
              letterSpacing: 4,
              marginBottom: 20,
            }}
          >
            😌 YOUR SAFEST
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            {data.safestContract.name}
          </div>
          <div
            style={{ fontSize: 100, fontWeight: 900, color: "#4ade80" }}
          >
            {data.safestContract.score}/100
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#94a3b8",
              marginTop: 20,
              fontStyle: "italic",
            }}
          >
            A fair contract does exist. Wow.
          </div>
        </>
      ),
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 7: MOST COMMON RED FLAG
  // ═══════════════════════════════════════════
  if (data.mostCommonRedFlag) {
    slides.push({
      bg: "linear-gradient(145deg, #0a0505 0%, #281008 50%, #1a0805 100%)",
      content: (
        <>
          <p className="text-sm text-orange-400 font-bold tracking-widest mb-4">
            🔄 YOUR MOST COMMON RED FLAG
          </p>
          <h1 className="text-3xl font-black text-white mb-2 uppercase">
            {data.mostCommonRedFlag.label}
          </h1>
          <p className="text-5xl font-black text-orange-400 my-4">
            {data.mostCommonRedFlag.count}×
          </p>
          <p className="text-gray-400 text-sm">
            Found in {data.mostCommonRedFlag.count} of your{" "}
            {data.totalContracts} contracts
          </p>
          <p className="text-gray-500 text-xs mt-4 italic">
            {data.mostCommonRedFlag.wittyComment}
          </p>
        </>
      ),
      exportContent: (
        <>
          <div
            style={{
              fontSize: 20,
              color: "#fb923c",
              fontWeight: 700,
              letterSpacing: 4,
              marginBottom: 20,
            }}
          >
            🔄 MOST COMMON RED FLAG
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#fff",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            {data.mostCommonRedFlag.label}
          </div>
          <div
            style={{ fontSize: 80, fontWeight: 900, color: "#fb923c" }}
          >
            {data.mostCommonRedFlag.count}×
          </div>
          <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 16 }}>
            Found in {data.mostCommonRedFlag.count} contracts
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#64748b",
              marginTop: 20,
              fontStyle: "italic",
            }}
          >
            {data.mostCommonRedFlag.wittyComment}
          </div>
        </>
      ),
    });
  }

  // ═══════════════════════════════════════════
  // SLIDE 8: PERSONALITY TYPE
  // ═══════════════════════════════════════════
  slides.push({
    bg: "linear-gradient(145deg, #050308 0%, #180a28 50%, #0a0518 100%)",
    content: (
      <>
        <p className="text-sm text-indigo-400 font-bold tracking-widest mb-4">
          🧬 YOUR CONTRACT PERSONALITY
        </p>
        <div className="text-7xl mb-4">{data.personalityType.icon}</div>
        <h1 className="text-3xl font-black text-white mb-2">
          {data.personalityType.name}
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          {data.personalityType.description}
        </p>
        <div className="mt-6 space-y-1 text-xs text-gray-500">
          <p>
            Mostly scanned: {data.topDocumentTypeLabel} ({data.topDocumentTypeCount}
            )
          </p>
          <p>Top location: {data.topJurisdictionName}</p>
        </div>
      </>
    ),
    exportContent: (
      <>
        <div
          style={{
            fontSize: 20,
            color: "#818cf8",
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          🧬 YOUR CONTRACT PERSONALITY
        </div>
        <div style={{ fontSize: 100, marginBottom: 16 }}>
          {data.personalityType.icon}
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            color: "#fff",
            marginBottom: 12,
          }}
        >
          {data.personalityType.name}
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#94a3b8",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          {data.personalityType.description}
        </div>
        <div style={{ fontSize: 18, color: "#64748b", marginTop: 30 }}>
          Mostly: {data.topDocumentTypeLabel} · {data.topJurisdictionName}
        </div>
      </>
    ),
  });

  // ═══════════════════════════════════════════
  // SLIDE 9: BADGE + RANKING
  // ═══════════════════════════════════════════
  slides.push({
    bg: "linear-gradient(145deg, #0a0803 0%, #1a1508 50%, #281f0a 100%)",
    content: (
      <>
        <p className="text-sm text-yellow-400 font-bold tracking-widest mb-4">
          🎖️ YOUR BADGE
        </p>
        <div className="text-7xl mb-4">{data.badge.icon}</div>
        <h1 className="text-3xl font-black text-white mb-2">
          {data.badge.name}
        </h1>
        <p className="text-gray-400 text-sm">{data.badge.description}</p>
        <div className="mt-6 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-yellow-400 text-sm font-semibold">
            Top {100 - data.percentile}% of ClauseWall users
          </p>
        </div>
        {data.entityMentions.length > 0 && (
          <p className="text-gray-600 text-xs mt-4">
            You dealt with: {data.entityMentions.slice(0, 3).join(", ")}
            {data.entityMentions.length > 3 ? " + more" : ""}
          </p>
        )}
      </>
    ),
    exportContent: (
      <>
        <div
          style={{
            fontSize: 20,
            color: "#facc15",
            fontWeight: 700,
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          🎖️ YOUR BADGE
        </div>
        <div style={{ fontSize: 100, marginBottom: 16 }}>
          {data.badge.icon}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#fff",
            marginBottom: 12,
          }}
        >
          {data.badge.name}
        </div>
        <div style={{ fontSize: 22, color: "#94a3b8" }}>
          {data.badge.description}
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#facc15",
            fontWeight: 600,
            marginTop: 30,
          }}
        >
          Top {100 - data.percentile}% of users
        </div>
      </>
    ),
  });

  // ═══════════════════════════════════════════
  // SLIDE 10: CTA
  // ═══════════════════════════════════════════
  const year = new Date().getFullYear();

  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a1628 50%, #1a0a2e 100%)",
    content: (
      <>
        <div className="text-5xl mb-6">🛡️</div>
        <h1 className="text-3xl font-bold text-white mb-2">ClauseWall</h1>
        <p className="text-gray-500 text-sm mb-6">
          India&apos;s AI Contract Analyzer 🇮🇳
        </p>
        <p className="text-xl text-white font-bold mb-2">
          Keep protecting yourself in {year + 1}.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Never sign blind again.
        </p>
        <div className="px-6 py-3 rounded-full bg-blue-500/10 border border-blue-500/20">
          <p className="text-blue-400 font-semibold text-sm">
            Scan your next contract free →
          </p>
        </div>
        <p className="text-gray-600 text-xs mt-6">
          clausewall.vercel.app
        </p>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 80, marginBottom: 30 }}>🛡️</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 12,
          }}
        >
          ClauseWall
        </div>
        <div
          style={{ fontSize: 22, color: "#94a3b8", marginBottom: 30 }}
        >
          India&apos;s AI Contract Analyzer 🇮🇳
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Keep protecting yourself in {year + 1}.
        </div>
        <div style={{ fontSize: 22, color: "#94a3b8", marginBottom: 30 }}>
          Never sign blind again.
        </div>
        <div
          style={{ fontSize: 24, color: "#60a5fa", fontWeight: 600 }}
        >
          Scan your contract free →
        </div>
        <div style={{ fontSize: 18, color: "#64748b", marginTop: 30 }}>
          clausewall.vercel.app
        </div>
      </>
    ),
  });

  return slides;
}
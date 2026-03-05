"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Download, Loader2, Share2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWrappedData, type WrappedData } from "@/lib/utils/wrapped-data";
import { getDocumentTypeLabel, getStateName } from "@/lib/utils/constants";
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
          Analyze some contracts first to generate your Contract Wrapped summary.
        </p>
        <Link href="/upload">
          <Button className="bg-blue-600 hover:bg-blue-700">Analyze a Contract</Button>
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
    } catch { toast.error("Failed"); }
    setDownloading(false);
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    for (let i = 0; i < totalSlides; i++) {
      const el = slideRefs.current[i];
      if (!el) continue;
      // Make visible temporarily
      el.style.position = "relative";
      el.style.left = "0";
      try {
        const url = await toPng(el, { quality: 1.0, pixelRatio: 2 });
        downloadDataUrl(url, `clausewall-wrapped-${i + 1}.png`);
        await new Promise((r) => setTimeout(r, 300));
      } catch { /* skip */ }
      el.style.position = "fixed";
      el.style.left = "-9999px";
    }
    toast.success("All slides downloaded!");
    setDownloading(false);
  };

  const handleShare = () => {
    const text = `🛡️ *My ${data.period} Contract Wrapped — ClauseWall*\n\n📊 ${data.totalContracts} contracts scanned\n🚩 ${data.illegalFound + data.dangerousFound} red flags found\n💰 ₹${(data.estimatedSavings / 1000).toFixed(0)}K saved\n🏆 Badge: ${data.badge.icon} ${data.badge.name}\n\nCheck yours → clausewall.vercel.app/wrapped`;
    shareToWhatsApp(text);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Back */}
      <div className="w-full max-w-md mb-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors">
          <ChevronLeft className="h-4 w-4" />Back to Dashboard
        </Link>
      </div>

      {/* Slide Viewer */}
      <div className="relative w-full max-w-md" style={{ aspectRatio: "9/16" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ background: slides[current].bg }}>
              <div className="w-full h-full flex flex-col items-center justify-center px-10 text-center">
                {slides[current].content}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {current > 0 && (
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {current < totalSlides - 1 && (
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10">
            <ArrowRight className="h-5 w-5" />
          </button>
        )}

        {/* Click to advance */}
        <button onClick={next} className="absolute inset-0 z-[5]" aria-label="Next slide" />
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-blue-500" : "w-2 bg-white/20"}`} />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-6">
        <Button onClick={handleDownloadCurrent} variant="outline" size="sm" className="gap-2" disabled={downloading}>
          <Download className="h-4 w-4" />This Slide
        </Button>
        <Button onClick={handleDownloadAll} variant="outline" size="sm" className="gap-2" disabled={downloading}>
          <Download className="h-4 w-4" />All Slides
        </Button>
        <Button onClick={handleShare} size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
          <Share2 className="h-4 w-4" />Share
        </Button>
      </div>

      {/* Hidden slides for download */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => { slideRefs.current[i] = el; }}
            style={{
              width: 1080, height: 1920, background: slide.bg,
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: 80,
              fontFamily: "Inter, system-ui, sans-serif", textAlign: "center",
            }}
          >
            {slide.exportContent}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Slide Builder ─────────────────────────

interface SlideConfig {
  bg: string;
  content: React.ReactNode;
  exportContent: React.ReactNode;
}

function buildSlides(data: WrappedData): SlideConfig[] {
  const slides: SlideConfig[] = [];

  // 1. INTRO
  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a1628 50%, #1a0a2e 100%)",
    content: (
      <>
        <div className="text-6xl mb-6">🛡️</div>
        <h1 className="text-3xl font-bold text-white mb-2">YOUR {data.period}</h1>
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CONTRACT WRAPPED</h2>
        <p className="text-gray-400 mt-6 text-sm">Tap to continue →</p>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 80, marginBottom: 40 }}>🛡️</div>
        <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", marginBottom: 8 }}>YOUR {data.period}</div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#60a5fa" }}>CONTRACT WRAPPED</div>
        <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 40 }}>clausewall.vercel.app</div>
      </>
    ),
  });

  // 2. VOLUME
  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a2818 50%, #051a0c 100%)",
    content: (
      <>
        <p className="text-sm text-green-400 font-bold tracking-widest mb-4">📊 YOU SCANNED</p>
        <h1 className="text-8xl font-black text-white mb-2">{data.totalContracts}</h1>
        <h2 className="text-2xl font-bold text-green-400">CONTRACTS</h2>
        <p className="text-gray-400 mt-6 text-sm">Across {data.totalClauses} total clauses</p>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 20, color: "#4ade80", fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>📊 YOU SCANNED</div>
        <div style={{ fontSize: 140, fontWeight: 900, color: "#fff" }}>{data.totalContracts}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#4ade80" }}>CONTRACTS</div>
        <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 30 }}>Across {data.totalClauses} total clauses</div>
      </>
    ),
  });

  // 3. RED FLAGS
  slides.push({
    bg: "linear-gradient(145deg, #0a0303 0%, #2a0808 50%, #1a0505 100%)",
    content: (
      <>
        <p className="text-sm text-red-400 font-bold tracking-widest mb-4">🚩 YOU FOUND</p>
        <h1 className="text-8xl font-black text-white mb-2">{data.illegalFound + data.dangerousFound + data.warningFound}</h1>
        <h2 className="text-2xl font-bold text-red-400">RED FLAGS</h2>
        <div className="mt-6 space-y-1 text-sm">
          <p className="text-purple-400">⛔ {data.illegalFound} Illegal</p>
          <p className="text-red-400">🔴 {data.dangerousFound} Dangerous</p>
          <p className="text-yellow-400">⚠️ {data.warningFound} Warning</p>
        </div>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 20, color: "#f87171", fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>🚩 YOU FOUND</div>
        <div style={{ fontSize: 140, fontWeight: 900, color: "#fff" }}>{data.illegalFound + data.dangerousFound + data.warningFound}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#f87171" }}>RED FLAGS</div>
        <div style={{ fontSize: 22, color: "#c084fc", marginTop: 30 }}>⛔ {data.illegalFound} Illegal</div>
        <div style={{ fontSize: 22, color: "#f87171", marginTop: 8 }}>🔴 {data.dangerousFound} Dangerous</div>
        <div style={{ fontSize: 22, color: "#facc15", marginTop: 8 }}>⚠️ {data.warningFound} Warning</div>
      </>
    ),
  });

  // 4. SAVINGS
  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a1a28 50%, #082a18 100%)",
    content: (
      <>
        <p className="text-sm text-green-400 font-bold tracking-widest mb-4">💰 YOU SAVED</p>
        <h1 className="text-6xl font-black text-white mb-2">₹{(data.estimatedSavings / 1000).toFixed(0)}K</h1>
        <p className="text-gray-400 text-sm mt-4">In excessive deposits, penalties & hidden fees</p>
        <p className="text-2xl mt-6">🏖️</p>
        <p className="text-gray-500 text-xs mt-2">That&apos;s a vacation!</p>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 20, color: "#4ade80", fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>💰 YOU SAVED</div>
        <div style={{ fontSize: 100, fontWeight: 900, color: "#fff" }}>₹{(data.estimatedSavings / 1000).toFixed(0)}K</div>
        <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 20 }}>In excessive deposits, penalties & fees</div>
        <div style={{ fontSize: 60, marginTop: 40 }}>🏖️</div>
      </>
    ),
  });

  // 5. RISKIEST (if exists)
  if (data.riskiestContract) {
    slides.push({
      bg: "linear-gradient(145deg, #06030a 0%, #1a0530 50%, #0f0320 100%)",
      content: (
        <>
          <p className="text-sm text-purple-400 font-bold tracking-widest mb-4">😱 YOUR RISKIEST</p>
          <h1 className="text-4xl font-black text-white mb-2">{data.riskiestContract.name}</h1>
          <p className="text-6xl font-black text-purple-400 my-4">{data.riskiestContract.score}/100</p>
          <p className="text-gray-400 text-sm">Good thing you checked before signing!</p>
        </>
      ),
      exportContent: (
        <>
          <div style={{ fontSize: 20, color: "#c084fc", fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>😱 YOUR RISKIEST</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", marginBottom: 16 }}>{data.riskiestContract.name}</div>
          <div style={{ fontSize: 100, fontWeight: 900, color: "#c084fc" }}>{data.riskiestContract.score}/100</div>
          <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 20 }}>Good thing you checked!</div>
        </>
      ),
    });
  }

  // 6. BADGE
  slides.push({
    bg: "linear-gradient(145deg, #0a0803 0%, #1a1508 50%, #281f0a 100%)",
    content: (
      <>
        <p className="text-sm text-yellow-400 font-bold tracking-widest mb-4">🎖️ YOUR BADGE</p>
        <div className="text-7xl mb-4">{data.badge.icon}</div>
        <h1 className="text-3xl font-black text-white mb-2">{data.badge.name}</h1>
        <p className="text-gray-400 text-sm">{data.badge.description}</p>
        <p className="text-yellow-400 text-sm mt-6 font-semibold">Top {100 - data.percentile}% of ClauseWall users</p>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 20, color: "#facc15", fontWeight: 700, letterSpacing: 4, marginBottom: 20 }}>🎖️ YOUR BADGE</div>
        <div style={{ fontSize: 100, marginBottom: 16 }}>{data.badge.icon}</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", marginBottom: 12 }}>{data.badge.name}</div>
        <div style={{ fontSize: 22, color: "#94a3b8" }}>{data.badge.description}</div>
        <div style={{ fontSize: 22, color: "#facc15", fontWeight: 600, marginTop: 30 }}>Top {100 - data.percentile}% of users</div>
      </>
    ),
  });

  // 7. CTA
  slides.push({
    bg: "linear-gradient(145deg, #030508 0%, #0a1628 50%, #1a0a2e 100%)",
    content: (
      <>
        <div className="text-5xl mb-6">🛡️</div>
        <h1 className="text-3xl font-bold text-white mb-2">ClauseWall</h1>
        <p className="text-gray-400 text-sm mb-6">India&apos;s AI Contract Analyzer 🇮🇳</p>
        <p className="text-blue-400 font-semibold">Scan your contract free →</p>
        <p className="text-gray-500 text-xs mt-4">clausewall.vercel.app</p>
      </>
    ),
    exportContent: (
      <>
        <div style={{ fontSize: 80, marginBottom: 30 }}>🛡️</div>
        <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", marginBottom: 12 }}>ClauseWall</div>
        <div style={{ fontSize: 22, color: "#94a3b8", marginBottom: 30 }}>India&apos;s AI Contract Analyzer 🇮🇳</div>
        <div style={{ fontSize: 24, color: "#60a5fa", fontWeight: 600 }}>Scan your contract free →</div>
        <div style={{ fontSize: 18, color: "#64748b", marginTop: 20 }}>clausewall.vercel.app</div>
      </>
    ),
  });

  return slides;
}
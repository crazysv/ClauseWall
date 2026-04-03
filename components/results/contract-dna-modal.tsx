"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  clausesToNodes,
  generateContractId,
  generateUniqueHex,
  DNA_STYLES,
  DNAStyle,
  DNANode,
  getDefaultStyle,
} from "@/lib/dna/utils";
import { detectPersonality } from "@/lib/dna/personality";
import FingerprintStyle from "@/components/results/dna/fingerprint-style";
import WaveformStyle from "@/components/results/dna/waveform-style";
import HeartbeatStyle from "@/components/results/dna/heartbeat-style";
import ConstellationStyle from "@/components/results/dna/constellation-style";
import SkylineStyle from "@/components/results/dna/skyline-style";
import HelixStyle from "@/components/results/dna/helix-style";
import type { Document, Clause } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contractDoc: Document;
  clauses: Clause[];
}

export default function ContractDNAModal({ isOpen, onClose, contractDoc, clauses }: Props) {
  const defaultStyle = getDefaultStyle(contractDoc.document_type);
  const [style, setStyle] = useState<DNAStyle>(defaultStyle);
  const [hoveredNode, setHoveredNode] = useState<DNANode | null>(null);
  const [copied, setCopied] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo(() => clausesToNodes(clauses), [clauses]);
  const personality = useMemo(
    () => detectPersonality(nodes, contractDoc.overall_risk_score),
    [nodes, contractDoc.overall_risk_score]
  );
  const contractId = useMemo(() => generateContractId(contractDoc.id), [contractDoc.id]);
  const uniqueColor = useMemo(() => generateUniqueHex(clauses), [clauses]);

  const handleHover = useCallback((node: DNANode | null) => {
    setHoveredNode(node);
  }, []);

  const renderStyle = () => {
    const props = { nodes, animated: true, onHover: handleHover };
    switch (style) {
      case "fingerprint":
        return <FingerprintStyle {...props} />;
      case "waveform":
        return <WaveformStyle {...props} />;
      case "heartbeat":
        return <HeartbeatStyle {...props} />;
      case "constellation":
        return <ConstellationStyle {...props} />;
      case "skyline":
        return <SkylineStyle {...props} />;
      case "helix":
        return <HelixStyle {...props} />;
    }
  };

  const handleDownloadSVG = () => {
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(window.document.createElement("a"), {
      href: url,
      download: `clausewall-dna-${contractId}-${style}.svg`,
    });
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG downloaded!");
  };

  const handleDownloadPNG = () => {
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (!svgEl) return;

    const clone = svgEl.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);

    const canvas = window.document.createElement("canvas");
    const scale = 2;
    canvas.width = 1200 * scale;
    canvas.height = 800 * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = "#0A0A0F";
    ctx.fillRect(0, 0, 1200, 800);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 50, 30, 1100, 620);

      // Footer
      ctx.fillStyle = "white";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.fillText(`${personality.emoji} ${personality.name}`, 50, 700);
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(`${contractId} • Contract Personality • clausewall.com`, 50, 730);

      // Color swatch
      ctx.fillStyle = uniqueColor;
      ctx.beginPath();
      ctx.arc(1130, 710, 15, 0, Math.PI * 2);
      ctx.fill();

      const url = canvas.toDataURL("image/png");
      const a = Object.assign(window.document.createElement("a"), {
        href: url,
        download: `clausewall-dna-${contractId}-${style}.png`,
      });
      a.click();
      toast.success("PNG downloaded!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(contractId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Contract ID copied!");
  };

  return (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-3xl bg-background card-impact border-2 border-foreground p-0 gap-0 overflow-hidden shadow-none rounded-none">
      {/* Accessible title (visually hidden) */}
      <VisuallyHidden>
        <DialogTitle>Contract Personality Visualization</DialogTitle>
      </VisuallyHidden>

      {/* Header */}
    <div className="flex items-center gap-3 p-5 border-b-2 border-foreground bg-muted">
        <div
            className="w-8 h-8 rounded-none border-2 border-foreground"
            style={{
                background: `linear-gradient(135deg, ${personality.gradient[0]}, ${personality.gradient[1]})`,
            }}
        />
        <div>
            <h2 className="font-black text-xl text-foreground uppercase tracking-wider">Contract Personality</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">
                {personality.emoji} {personality.name} — {personality.description}
            </p>
        </div>
    </div>

        {/* Style Selector */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 bg-background overflow-x-auto border-b-2 border-foreground">
          {DNA_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-none text-sm font-black uppercase tracking-wider border-2 transition-all whitespace-nowrap ${
                style === s.id
                  ? "bg-foreground border-foreground text-background"
                  : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        {/* Visualization */}
        <div className="relative px-5 py-3">
          <div
            ref={svgContainerRef}
            className="relative w-full aspect-[3/2] bg-black/40 rounded-xl overflow-hidden border border-white/5"
            style={{
              background: `linear-gradient(180deg, ${personality.gradient[0]}30, ${personality.gradient[1]}15)`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={style}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full p-4"
              >
                {renderStyle()}
              </motion.div>
            </AnimatePresence>

            {/* Hover Tooltip */}
            <AnimatePresence>
              {hoveredNode && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-3 left-3 right-3 card-impact bg-background p-3 border-2 border-foreground pointer-events-none"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-black uppercase tracking-wider text-sm text-foreground">
                      Clause {hoveredNode.clauseNumber}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider border-2"
                      style={{
                        backgroundColor: hoveredNode.riskColor,
                        color: "#fff",
                        borderColor: hoveredNode.riskColor,
                      }}
                    >
                      {hoveredNode.riskLevel}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{hoveredNode.clauseType}</span>
                  </div>
                  <p className="text-foreground font-bold text-xs uppercase tracking-wider leading-relaxed">
                    {hoveredNode.explanation.slice(0, 140)}
                    {hoveredNode.explanation.length > 140 ? "..." : ""}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 bg-background border-t-2 border-foreground">
          {/* Contract Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-muted border-2 border-foreground text-xs font-black uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                {contractId}
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 border-2 border-foreground"
                  style={{ backgroundColor: uniqueColor }}
                />
                <span className="text-xs font-bold font-mono text-muted-foreground uppercase">{uniqueColor}</span>
              </div>
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {nodes.length} clauses • Score {contractDoc.overall_risk_score}/100
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 border-2 border-foreground font-black uppercase tracking-wider text-xs hover:bg-muted transition-colors text-foreground"
              onClick={handleDownloadPNG}
            >
              <Download className="h-4 w-4" />
              PNG
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 border-2 border-foreground font-black uppercase tracking-wider text-xs hover:bg-muted transition-colors text-foreground"
              onClick={handleDownloadSVG}
            >
              <Download className="h-4 w-4" />
              SVG
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 border-2 border-foreground font-black uppercase tracking-wider text-xs bg-foreground text-background hover:bg-background hover:text-foreground transition-colors"
              onClick={() => {
                const url = `${window.location.origin}/results/${contractDoc.id}`;
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
              }}
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
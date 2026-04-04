"use client";

import { useState } from "react";
import { Copy, Check, Code2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/share";

type BadgeStyle = "full" | "compact" | "shield";

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
}

const STYLES: { value: BadgeStyle; label: string; description: string }[] = [
  {
    value: "full",
    label: "Full Badge",
    description: "280×80px — Name, score, label",
  },
  {
    value: "compact",
    label: "Compact",
    description: "160×48px — Score + label",
  },
  { value: "shield", label: "Shield", description: "200×28px — GitHub-style" },
];

export default function EmbedCodeModal({
  isOpen,
  onClose,
  shareId,
}: EmbedCodeModalProps) {
  const [style, setStyle] = useState<BadgeStyle>("full");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://clause-wall.vercel.app";
  const badgeUrl = `${baseUrl}/api/badge/${shareId}?style=${style}`;
  const verifyUrl = `${baseUrl}/verify/${shareId}`;

  const htmlCode = `<a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${badgeUrl}" alt="ClauseWall Verified" />\n</a>`;
  const markdownCode = `[![ClauseWall Verified](${badgeUrl})](${verifyUrl})`;
  const directUrl = badgeUrl;

  const handleCopy = async (text: string, type: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedType(type);
      toast.success(`${type} copied!`);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black bg-white dark:bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-black uppercase tracking-widest text-xl text-foreground">
            <Code2 className="h-6 w-6 text-black dark:text-white stroke-[3px]" />
            EMBED BADGE
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold mt-2">
            Add a ClauseWall verification badge to your website, listing, or
            portfolio.
          </DialogDescription>
        </DialogHeader>

        {/* Style Selector */}
        <div className="space-y-4">
          <p className="text-sm text-foreground font-black uppercase tracking-widest">
            BADGE STYLE
          </p>
          <div className="flex gap-3">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`flex-1 p-3 border-4 border-black text-left transition-all ${
                  style === s.value
                    ? "bg-blue-100 dark:bg-blue-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-0"
                    : "bg-white dark:bg-zinc-900 shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
                }`}
              >
                <p
                  className={`text-xs font-black uppercase tracking-widest ${style === s.value ? "text-blue-900 dark:text-blue-100" : "text-foreground"}`}
                >
                  {s.label}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-wider">
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {/* Preview */}
        <div className="p-6 border-4 border-black border-dashed bg-gray-50 dark:bg-zinc-900 flex items-center justify-center min-h-[120px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${badgeUrl}&t=${Date.now()}`}
            alt="Badge Preview"
            style={{ maxWidth: "100%" }}
            key={`${style}-${Date.now()}`}
            onError={(e) => {
              console.error("Badge failed to load:", badgeUrl);
              (e.target as HTMLImageElement).style.display = "none";
            }}
            onLoad={(e) => {
              (e.target as HTMLImageElement).style.display = "block";
            }}
          />
        </div>

        {/* Code Blocks */}
        <div className="space-y-6">
          {/* HTML */}
          <div className="relative group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground font-black uppercase tracking-widest">
                HTML
              </p>
              <button
                onClick={() => handleCopy(htmlCode, "HTML")}
                className="text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                {copiedType === "HTML" ? (
                  <Check className="h-4 w-4 text-green-600 stroke-[3px]" />
                ) : (
                  <Copy className="h-4 w-4 stroke-[3px]" />
                )}
                {copiedType === "HTML" ? "COPIED!" : "COPY"}
              </button>
            </div>
            <pre className="p-4 border-4 border-black bg-black text-xs text-green-400 overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <code>{htmlCode}</code>
            </pre>
          </div>

          {/* Markdown */}
          <div className="relative group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground font-black uppercase tracking-widest">
                MARKDOWN
              </p>
              <button
                onClick={() => handleCopy(markdownCode, "Markdown")}
                className="text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                {copiedType === "Markdown" ? (
                  <Check className="h-4 w-4 text-green-600 stroke-[3px]" />
                ) : (
                  <Copy className="h-4 w-4 stroke-[3px]" />
                )}
                {copiedType === "Markdown" ? "COPIED!" : "COPY"}
              </button>
            </div>
            <pre className="p-4 border-4 border-black bg-black text-xs text-blue-400 overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <code>{markdownCode}</code>
            </pre>
          </div>

          {/* Direct URL */}
          <div className="relative group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground font-black uppercase tracking-widest">
                DIRECT URL
              </p>
              <button
                onClick={() => handleCopy(directUrl, "URL")}
                className="text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                {copiedType === "URL" ? (
                  <Check className="h-4 w-4 text-green-600 stroke-[3px]" />
                ) : (
                  <Copy className="h-4 w-4 stroke-[3px]" />
                )}
                {copiedType === "URL" ? "COPIED!" : "COPY"}
              </button>
            </div>
            <pre className="p-4 border-4 border-black bg-black text-xs text-gray-400 overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <code>{directUrl}</code>
            </pre>
          </div>
        </div>

        {/* Use Cases */}
        <div className="p-4 border-4 border-black bg-yellow-100 dark:bg-yellow-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100 font-black uppercase tracking-widest mb-3">
            WHERE TO USE
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
            <div>🏠 PROPERTY LISTINGS</div>
            <div>💼 COMPANY CAREERS PAGE</div>
            <div>📧 EMAIL SIGNATURES</div>
            <div>📝 CONTRACT TEMPLATES</div>
          </div>
        </div>

        {/* Open Preview */}
        {/* Open Preview */}
        <button
          onClick={() => window.open(verifyUrl, "_blank")}
          className="flex items-center justify-center gap-3 w-full px-4 py-4 border-4 border-black bg-blue-400 hover:bg-blue-500 text-black text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all mt-4"
        >
          <ExternalLink className="h-5 w-5 stroke-[3px]" />
          OPEN VERIFICATION PAGE
        </button>
      </DialogContent>
    </Dialog>
  );
}

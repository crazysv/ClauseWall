"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Code2,
  ExternalLink,
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
import { copyToClipboard } from "@/lib/utils/share";

type BadgeStyle = "full" | "compact" | "shield";

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
}

const STYLES: { value: BadgeStyle; label: string; description: string }[] = [
  { value: "full", label: "Full Badge", description: "280×80px — Name, score, label" },
  { value: "compact", label: "Compact", description: "160×48px — Score + label" },
  { value: "shield", label: "Shield", description: "200×28px — GitHub-style" },
];

export default function EmbedCodeModal({ isOpen, onClose, shareId }: EmbedCodeModalProps) {
  const [style, setStyle] = useState<BadgeStyle>("full");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" 
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
      <DialogContent className="bg-gray-900 border-gray-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-blue-400" />
            Embed Badge
          </DialogTitle>
          <DialogDescription>
            Add a ClauseWall verification badge to your website, listing, or portfolio.
          </DialogDescription>
        </DialogHeader>

        {/* Style Selector */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Badge Style</p>
          <div className="flex gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                  style === s.value
                    ? "bg-blue-600/10 border-blue-500/30"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                }`}
              >
                <p className="text-xs font-medium text-white">{s.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
<div className="p-6 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center min-h-[120px]">
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
        <div className="space-y-4">
          {/* HTML */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500 font-medium">HTML</p>
              <button onClick={() => handleCopy(htmlCode, "HTML")}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                {copiedType === "HTML" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                {copiedType === "HTML" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-green-400 overflow-x-auto">
              <code>{htmlCode}</code>
            </pre>
          </div>

          {/* Markdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500 font-medium">Markdown</p>
              <button onClick={() => handleCopy(markdownCode, "Markdown")}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                {copiedType === "Markdown" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                {copiedType === "Markdown" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-blue-400 overflow-x-auto">
              <code>{markdownCode}</code>
            </pre>
          </div>

          {/* Direct URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500 font-medium">Direct URL</p>
              <button onClick={() => handleCopy(directUrl, "URL")}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                {copiedType === "URL" ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                {copiedType === "URL" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-400 overflow-x-auto">
              <code>{directUrl}</code>
            </pre>
          </div>
        </div>

        {/* Use Cases */}
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">Where to use</p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-400">
            <div>🏠 Property listings</div>
            <div>💼 Company careers page</div>
            <div>📧 Email signatures</div>
            <div>📝 Contract templates</div>
          </div>
        </div>

        {/* Open Preview */}
        <Button variant="outline" size="sm" onClick={() => window.open(verifyUrl, "_blank")} className="gap-2 w-full">
          <ExternalLink className="h-4 w-4" />
          Open Verification Page
        </Button>
      </DialogContent>
    </Dialog>
  );
}
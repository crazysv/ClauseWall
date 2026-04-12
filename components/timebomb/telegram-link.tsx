"use client";

// ============================================
// TELEGRAM LINK
// Instructions for linking Telegram account
// ============================================

import { useState } from "react";
import { MessageCircle, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface TelegramLinkProps {
  onLinked?: () => void;
}

export function TelegramLink({ onLinked }: TelegramLinkProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const linkCode = `/link`;
  const botUrl = "https://t.me/ClauseWallBot";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkCode);
      setCopied(true);
      toast.success("Command copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
    toast.success(
      "Settings will update on next save. Make sure you sent /link to the bot first!",
    );
    onLinked?.();
  };

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 py-2 text-emerald-400 text-[9px] font-mono">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Telegram linking initiated. Save settings to complete.</span>
      </div>
    );
  }

  return (
    <div className="border border-cyan-900/50 bg-cyan-950/10 p-4 space-y-3">
      <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 leading-relaxed">
        SEND THIS COMMAND TO{" "}
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:underline inline-flex items-center gap-1"
        >
          @CLAUSEWALLBOT
          <ExternalLink className="w-3 h-3" />
        </a>
        :
      </p>

      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 border border-neutral-800 bg-[#050505] text-neutral-200 text-sm font-mono tracking-widest text-center">
          {linkCode}
        </code>
        <button
          onClick={handleCopy}
          className="p-2 border border-neutral-800 bg-[#050505] text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
          aria-label="Copy command"
        >
          {copied ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <a
        href={`${botUrl}?start=link`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-cyan-900/50 bg-cyan-950/10 text-cyan-400 font-mono uppercase tracking-widest text-[8px] hover:text-cyan-300 hover:border-cyan-800 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        OPEN @CLAUSEWALLBOT
      </a>

      <button
        onClick={handleConfirm}
        className="w-full text-[8px] font-mono uppercase tracking-widest text-neutral-600 hover:text-neutral-300 transition-colors mt-1"
      >
        I&apos;VE SENT THE COMMAND →
      </button>
    </div>
  );
}

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
      "Settings will update on next save. Make sure you sent /link to the bot first!"
    );
    onLinked?.();
  };

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 py-2 text-green-400 text-xs">
        <CheckCircle className="w-4 h-4" />
        <span>Telegram linking initiated. Save settings to complete.</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3 space-y-3">
      <p className="text-xs text-white/50">
        Send this command to{" "}
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          @ClauseWallBot
          <ExternalLink className="w-3 h-3" />
        </a>
        :
      </p>

      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-1.5 rounded-lg bg-black/30 text-blue-300 text-xs font-mono">
          {linkCode}
        </code>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white/70 transition-colors"
          aria-label="Copy command"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      <a
        href={`${botUrl}?start=link`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-all"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Open @ClauseWallBot
      </a>

      <button
        onClick={handleConfirm}
        className="w-full text-xs text-white/30 hover:text-white/50 transition-colors"
      >
        I&apos;ve sent the command →
      </button>
    </div>
  );
}

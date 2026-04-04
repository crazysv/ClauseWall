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
      <div className="flex items-center gap-2 py-2 text-green-400 text-xs">
        <CheckCircle className="w-4 h-4" />
        <span>Telegram linking initiated. Save settings to complete.</span>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-blue-100 dark:bg-blue-900/30 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
        SEND THIS COMMAND TO{" "}
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 dark:text-blue-400 font-black hover:underline inline-flex items-center gap-1"
        >
          @CLAUSEWALLBOT
          <ExternalLink className="w-4 h-4 stroke-[3px]" />
        </a>
        :
      </p>

      <div className="flex items-center gap-3">
        <code className="flex-1 px-4 py-3 border-4 border-black bg-white dark:bg-black text-black dark:text-white text-sm font-black tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
          {linkCode}
        </code>
        <button
          onClick={handleCopy}
          className="p-3 border-4 border-black bg-gray-100 dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
          aria-label="Copy command"
        >
          {copied ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 stroke-[3px]" />
          ) : (
            <Copy className="w-5 h-5 stroke-[3px]" />
          )}
        </button>
      </div>

      <a
        href={`${botUrl}?start=link`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 border-4 border-black bg-blue-500 hover:bg-blue-600 text-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
      >
        <MessageCircle className="w-5 h-5 stroke-[3px]" />
        OPEN @CLAUSEWALLBOT
      </a>

      <button
        onClick={handleConfirm}
        className="w-full text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mt-2"
      >
        I&apos;VE SENT THE COMMAND →
      </button>
    </div>
  );
}

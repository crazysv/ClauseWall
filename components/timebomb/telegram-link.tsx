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
      <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold tracking-tight text-xs shadow-sm dark:shadow-slate-900/20 mt-2">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="leading-relaxed">Telegram linking initiated. Save settings to complete.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-4 mt-2">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
        Send this command to{" "}
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
        >
          @ClauseWallBot
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        :
      </p>

      <div className="flex items-center gap-2">
        <code className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-indigo-200 text-indigo-700 font-black tracking-widest text-xs font-mono shadow-inner select-all">
          {linkCode}
        </code>
        <button
          onClick={handleCopy}
          className="p-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm dark:shadow-slate-900/20"
          aria-label="Copy command"
        >
          {copied ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>

      <a
        href={`${botUrl}?start=link`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
      >
        <MessageCircle className="w-4 h-4" />
        Open @ClauseWallBot
      </a>

      <button
        onClick={handleConfirm}
        className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors py-1"
      >
        I&apos;ve sent the command →
      </button>
    </div>
  );
}

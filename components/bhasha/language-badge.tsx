"use client";

import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

interface LanguageBadgeProps {
  sourceLanguage: SupportedLanguage;
  targetLanguage?: SupportedLanguage;
  showAudioAvailable?: boolean;
  size?: "sm" | "md";
}

export function LanguageBadge({
  sourceLanguage,
  targetLanguage,
  showAudioAvailable = false,
  size = "sm",
}: LanguageBadgeProps) {
  if (sourceLanguage === "en" && !targetLanguage) return null;

  const sourceConfig = LANGUAGE_CONFIGS[sourceLanguage];
  const targetConfig = targetLanguage ? LANGUAGE_CONFIGS[targetLanguage] : null;

  return (
    <span className={`bhasha-badge size-${size}`}>
      <span className="bhasha-badge-char">{sourceConfig.nativeChar}</span>
      <span className="bhasha-badge-name">{sourceConfig.nativeName}</span>
      {targetConfig && targetConfig.code !== sourceConfig.code && (
        <>
          <span className="bhasha-badge-arrow">→</span>
          <span className="bhasha-badge-name">{targetConfig.nativeName}</span>
        </>
      )}
      {showAudioAvailable && <span className="bhasha-badge-audio">🔊</span>}

      <style jsx>{`
        .bhasha-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15));
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          font-size: 0.7rem;
          color: #a5b4fc;
          white-space: nowrap;
        }
        .bhasha-badge.size-md {
          padding: 4px 10px;
          font-size: 0.8rem;
        }
        .bhasha-badge-char {
          font-size: 0.85em;
        }
        .bhasha-badge-name {
          font-weight: 500;
        }
        .bhasha-badge-arrow {
          color: rgba(255, 255, 255, 0.3);
        }
        .bhasha-badge-audio {
          font-size: 0.8em;
          margin-left: 2px;
        }
      `}</style>
    </span>
  );
}

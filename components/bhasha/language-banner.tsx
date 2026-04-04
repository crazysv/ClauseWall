"use client";

import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";
import { LanguageBadge } from "./language-badge";

interface LanguageBannerProps {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  onDismiss?: () => void;
}

export function LanguageBanner({
  detectedLanguage,
  confidence,
  onDismiss,
}: LanguageBannerProps) {
  if (detectedLanguage === "en") return null;

  const config = LANGUAGE_CONFIGS[detectedLanguage];
  const confidenceLabel =
    confidence > 0.9 ? "High" : confidence > 0.7 ? "Medium" : "Low";

  return (
    <div className="bhasha-banner">
      <div className="bhasha-banner-content">
        <span className="bhasha-banner-char">{config.nativeChar}</span>
        <div className="bhasha-banner-text">
          <strong>Document detected as {config.name}</strong>
          <span className="bhasha-banner-sub">
            ({config.nativeName}) • Confidence: {confidenceLabel} (
            {Math.round(confidence * 100)}%)
          </span>
        </div>
        <LanguageBadge sourceLanguage={detectedLanguage} showAudioAvailable />
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="bhasha-banner-dismiss">
          ✕
        </button>
      )}

      <style jsx>{`
        .bhasha-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.1),
            rgba(168, 85, 247, 0.08)
          );
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          margin-bottom: 16px;
          animation: bhasha-banner-in 0.3s ease;
        }
        @keyframes bhasha-banner-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .bhasha-banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bhasha-banner-char {
          font-size: 1.8rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
          flex-shrink: 0;
        }
        .bhasha-banner-text {
          display: flex;
          flex-direction: column;
        }
        .bhasha-banner-text strong {
          font-size: 0.9rem;
          color: #e2e8f0;
        }
        .bhasha-banner-sub {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .bhasha-banner-dismiss {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          padding: 4px;
          font-size: 0.8rem;
        }
        .bhasha-banner-dismiss:hover {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
}

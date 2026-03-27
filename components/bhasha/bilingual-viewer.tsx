"use client";

import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

interface BilingualViewerProps {
  sourceText: string;
  englishText: string;
  sourceLanguage: SupportedLanguage;
  mode?: "source" | "english" | "both";
  showLabels?: boolean;
}

export function BilingualViewer({
  sourceText,
  englishText,
  sourceLanguage,
  mode = "both",
  showLabels = true,
}: BilingualViewerProps) {
  const config = LANGUAGE_CONFIGS[sourceLanguage];

  if (mode === "english") {
    return <div className="bhasha-viewer-single">{englishText}</div>;
  }

  if (mode === "source") {
    return <div className="bhasha-viewer-single">{sourceText}</div>;
  }

  return (
    <div className="bhasha-viewer-dual">
      <div className="bhasha-viewer-pane source">
        {showLabels && (
          <span className="bhasha-viewer-label">{config.nativeName}</span>
        )}
        <p>{sourceText}</p>
      </div>
      <div className="bhasha-viewer-divider" />
      <div className="bhasha-viewer-pane english">
        {showLabels && (
          <span className="bhasha-viewer-label">English</span>
        )}
        <p>{englishText}</p>
      </div>

      <style jsx>{`
        .bhasha-viewer-dual {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
        }
        @media (max-width: 640px) {
          .bhasha-viewer-dual {
            grid-template-columns: 1fr;
          }
          .bhasha-viewer-divider {
            height: 1px !important;
            width: 100% !important;
          }
        }
        .bhasha-viewer-pane {
          padding: 12px 16px;
        }
        .bhasha-viewer-pane.source {
          background: rgba(99, 102, 241, 0.04);
        }
        .bhasha-viewer-pane.english {
          background: rgba(16, 185, 129, 0.04);
        }
        .bhasha-viewer-pane p {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #e2e8f0;
          margin: 0;
        }
        .bhasha-viewer-label {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.35);
          margin-bottom: 6px;
        }
        .bhasha-viewer-divider {
          width: 1px;
          background: rgba(255, 255, 255, 0.08);
        }
        .bhasha-viewer-single {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

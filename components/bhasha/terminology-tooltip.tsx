"use client";

import { useState } from "react";

interface TerminologyTooltipProps {
  term: string;
  englishEquivalent: string;
  clauseType?: string;
  children: React.ReactNode;
}

export function TerminologyTooltip({
  term,
  englishEquivalent,
  clauseType,
  children,
}: TerminologyTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="bhasha-term-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="bhasha-term-trigger">{children}</span>
      {isVisible && (
        <span className="bhasha-term-tooltip">
          <span className="bhasha-term-regional">{term}</span>
          <span className="bhasha-term-arrow">→</span>
          <span className="bhasha-term-english">{englishEquivalent}</span>
          {clauseType && <span className="bhasha-term-type">{clauseType}</span>}
        </span>
      )}

      <style jsx>{`
        .bhasha-term-wrapper {
          position: relative;
          display: inline;
        }
        .bhasha-term-trigger {
          border-bottom: 1px dotted rgba(99, 102, 241, 0.5);
          cursor: help;
        }
        .bhasha-term-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: #1e1b4b;
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 8px;
          box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.5);
          white-space: nowrap;
          z-index: 50;
          animation: bhasha-tooltip-in 0.15s ease;
        }
        @keyframes bhasha-tooltip-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .bhasha-term-regional {
          font-size: 0.8rem;
          color: #a5b4fc;
          font-weight: 500;
        }
        .bhasha-term-arrow {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.3);
        }
        .bhasha-term-english {
          font-size: 0.8rem;
          color: #e2e8f0;
        }
        .bhasha-term-type {
          font-size: 0.6rem;
          padding: 1px 5px;
          background: rgba(99, 102, 241, 0.15);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </span>
  );
}

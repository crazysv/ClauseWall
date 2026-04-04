"use client";

interface ScriptConfidenceBannerProps {
  confidence: number;
  isHandwritten?: boolean;
  onReviewClick?: () => void;
}

export function ScriptConfidenceBanner({
  confidence,
  isHandwritten = false,
  onReviewClick,
}: ScriptConfidenceBannerProps) {
  if (confidence >= 80 && !isHandwritten) return null;

  const isLow = confidence < 60;
  const borderColor = isLow
    ? "rgba(239, 68, 68, 0.3)"
    : "rgba(234, 179, 8, 0.3)";
  const bgColor = isLow ? "rgba(239, 68, 68, 0.08)" : "rgba(234, 179, 8, 0.08)";
  const textColor = isLow ? "#fca5a5" : "#fde68a";

  return (
    <div
      className="bhasha-confidence-banner"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}
    >
      <div className="bhasha-confidence-content">
        <span className="bhasha-confidence-icon">
          {isHandwritten ? "✍️" : "⚠️"}
        </span>
        <div className="bhasha-confidence-text">
          <strong style={{ color: textColor }}>
            {isHandwritten
              ? "Handwritten text detected"
              : "Low OCR confidence detected"}
          </strong>
          <span className="bhasha-confidence-detail">
            OCR confidence: {Math.round(confidence)}%. Some text may be
            incorrect.
          </span>
        </div>
        {onReviewClick && (
          <button onClick={onReviewClick} className="bhasha-confidence-btn">
            Review & Correct
          </button>
        )}
      </div>

      <style jsx>{`
        .bhasha-confidence-banner {
          border-radius: 12px;
          padding: 12px 16px;
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
        .bhasha-confidence-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bhasha-confidence-icon {
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .bhasha-confidence-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .bhasha-confidence-text strong {
          font-size: 0.85rem;
        }
        .bhasha-confidence-detail {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .bhasha-confidence-btn {
          padding: 6px 14px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          color: #e2e8f0;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .bhasha-confidence-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
}

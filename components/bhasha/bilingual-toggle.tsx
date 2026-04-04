"use client";

import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

interface BilingualToggleProps {
  mode: "source" | "english" | "both";
  onChange: (mode: "source" | "english" | "both") => void;
  sourceLanguage: SupportedLanguage;
}

export function BilingualToggle({
  mode,
  onChange,
  sourceLanguage,
}: BilingualToggleProps) {
  const config = LANGUAGE_CONFIGS[sourceLanguage];

  const options: {
    value: "source" | "english" | "both";
    label: string;
    desc: string;
  }[] = [
    { value: "source", label: config.nativeName, desc: "Original" },
    { value: "english", label: "English", desc: "Translated" },
    { value: "both", label: "Both", desc: "Side by Side" },
  ];

  return (
    <div className="bhasha-bilingual-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`bhasha-toggle-btn ${mode === opt.value ? "active" : ""}`}
        >
          <span className="bhasha-toggle-label">{opt.label}</span>
          <span className="bhasha-toggle-desc">{opt.desc}</span>
        </button>
      ))}

      <style jsx>{`
        .bhasha-bilingual-toggle {
          display: flex;
          gap: 4px;
          padding: 3px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          width: fit-content;
        }
        .bhasha-toggle-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 14px;
          border: none;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          color: rgba(255, 255, 255, 0.5);
        }
        .bhasha-toggle-btn:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.04);
        }
        .bhasha-toggle-btn.active {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.3);
        }
        .bhasha-toggle-label {
          font-size: 0.8rem;
          font-weight: 600;
        }
        .bhasha-toggle-desc {
          font-size: 0.6rem;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

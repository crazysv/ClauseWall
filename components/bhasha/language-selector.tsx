"use client";

import { useState } from "react";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS, INDIAN_LANGUAGES } from "@/lib/bhasha/constants";

interface LanguageSelectorProps {
  value: SupportedLanguage | "auto";
  onChange: (language: SupportedLanguage | "auto") => void;
  compact?: boolean;
}

export function LanguageSelector({ value, onChange, compact = false }: LanguageSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const allOptions: { code: SupportedLanguage | "auto"; name: string; native: string; char: string }[] = [
    { code: "auto", name: "Auto-Detect", native: "Auto", char: "🔍" },
    { code: "en", name: "English", native: "English", char: "A" },
    ...INDIAN_LANGUAGES.map(code => ({
      code,
      name: LANGUAGE_CONFIGS[code].name,
      native: LANGUAGE_CONFIGS[code].nativeName,
      char: LANGUAGE_CONFIGS[code].nativeChar,
    })),
  ];

  const selected = allOptions.find(o => o.code === value) || allOptions[0];

  if (compact) {
    return (
      <div className="bhasha-selector-compact">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SupportedLanguage | "auto")}
          className="bhasha-select"
        >
          {allOptions.map(opt => (
            <option key={opt.code} value={opt.code}>
              {opt.char} {opt.name} ({opt.native})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="bhasha-selector">
      {/* Current selection button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="bhasha-selector-trigger"
      >
        <span className="bhasha-selector-char">{selected.char}</span>
        <span className="bhasha-selector-label">
          <span className="bhasha-selector-name">{selected.name}</span>
          {selected.code !== "auto" && selected.code !== "en" && (
            <span className="bhasha-selector-native">{selected.native}</span>
          )}
        </span>
        <svg className={`bhasha-chevron ${isExpanded ? "rotated" : ""}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Language grid */}
      {isExpanded && (
        <div className="bhasha-selector-grid">
          {allOptions.map(opt => (
            <button
              key={opt.code}
              type="button"
              onClick={() => {
                onChange(opt.code);
                setIsExpanded(false);
              }}
              className={`bhasha-lang-option ${value === opt.code ? "selected" : ""}`}
            >
              <span className="bhasha-lang-char">{opt.char}</span>
              <span className="bhasha-lang-name">{opt.native}</span>
              <span className="bhasha-lang-eng">{opt.name}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .bhasha-selector {
          position: relative;
        }
        .bhasha-selector-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          color: #e2e8f0;
        }
        .bhasha-selector-trigger:hover {
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(99, 102, 241, 0.06);
        }
        .bhasha-selector-char {
          font-size: 1.4rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.15);
          border-radius: 8px;
          flex-shrink: 0;
        }
        .bhasha-selector-label {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }
        .bhasha-selector-name {
          font-size: 0.9rem;
          font-weight: 500;
        }
        .bhasha-selector-native {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .bhasha-chevron {
          color: rgba(255, 255, 255, 0.4);
          transition: transform 0.2s;
        }
        .bhasha-chevron.rotated {
          transform: rotate(180deg);
        }
        .bhasha-selector-grid {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 6px;
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 12px;
          z-index: 50;
          max-height: 300px;
          overflow-y: auto;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5);
          animation: bhasha-slide-down 0.2s ease;
        }
        @keyframes bhasha-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bhasha-lang-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 6px;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s;
          color: #e2e8f0;
        }
        .bhasha-lang-option:hover {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
        }
        .bhasha-lang-option.selected {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.5);
        }
        .bhasha-lang-char {
          font-size: 1.5rem;
        }
        .bhasha-lang-name {
          font-size: 0.75rem;
          font-weight: 500;
        }
        .bhasha-lang-eng {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .bhasha-select {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}

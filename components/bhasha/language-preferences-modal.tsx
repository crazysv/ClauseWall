"use client";

import { useState, useEffect } from "react";
import type { SupportedLanguage } from "@/types/bhasha";
import { LanguageSelector } from "./language-selector";

interface LanguagePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguagePreferencesModal({ isOpen, onClose }: LanguagePreferencesModalProps) {
  const [inputLang, setInputLang] = useState<SupportedLanguage | "auto">("auto");
  const [outputLang, setOutputLang] = useState<SupportedLanguage | "auto">("en");
  const [enableAudio, setEnableAudio] = useState(false);
  const [enableBilingual, setEnableBilingual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/bhasha/preferences")
        .then(res => res.json())
        .then(data => {
          setInputLang(data.preferred_input_language || "auto");
          setOutputLang(data.preferred_output_language || "en");
          setEnableAudio(data.enable_audio_by_default || false);
          setEnableBilingual(data.enable_bilingual_by_default || false);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/bhasha/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_input_language: inputLang,
          preferred_output_language: outputLang,
          enable_audio_by_default: enableAudio,
          enable_bilingual_by_default: enableBilingual,
        }),
      });
      onClose();
    } catch (err) {
      console.error("[ClauseWall] Save preferences failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bhasha-modal-overlay" onClick={onClose}>
      <div className="bhasha-modal" onClick={e => e.stopPropagation()}>
        <div className="bhasha-modal-header">
          <h3>🌐 Language Preferences</h3>
          <button onClick={onClose} className="bhasha-modal-close">✕</button>
        </div>

        <div className="bhasha-modal-body">
          <div className="bhasha-pref-group">
            <label>Default Input Language</label>
            <p className="bhasha-pref-desc">Language of documents you upload</p>
            <LanguageSelector value={inputLang} onChange={setInputLang} compact />
          </div>

          <div className="bhasha-pref-group">
            <label>Default Output Language</label>
            <p className="bhasha-pref-desc">Language for analysis results</p>
            <LanguageSelector value={outputLang} onChange={setOutputLang} compact />
          </div>

          <div className="bhasha-pref-toggle">
            <label>
              <input
                type="checkbox"
                checked={enableAudio}
                onChange={e => setEnableAudio(e.target.checked)}
              />
              Enable audio playback by default
            </label>
          </div>

          <div className="bhasha-pref-toggle">
            <label>
              <input
                type="checkbox"
                checked={enableBilingual}
                onChange={e => setEnableBilingual(e.target.checked)}
              />
              Show bilingual view by default (for non-English docs)
            </label>
          </div>
        </div>

        <div className="bhasha-modal-footer">
          <button onClick={onClose} className="bhasha-btn-cancel">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="bhasha-btn-save">
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <style jsx>{`
          .bhasha-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            animation: bhasha-fade-in 0.15s ease;
          }
          @keyframes bhasha-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .bhasha-modal {
            width: 90%;
            max-width: 480px;
            background: #1a1a2e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            overflow: hidden;
            animation: bhasha-scale-in 0.2s ease;
          }
          @keyframes bhasha-scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .bhasha-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          .bhasha-modal-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #e2e8f0;
          }
          .bhasha-modal-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.4);
            cursor: pointer;
            font-size: 1rem;
          }
          .bhasha-modal-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .bhasha-pref-group label {
            font-size: 0.85rem;
            font-weight: 600;
            color: #e2e8f0;
            display: block;
            margin-bottom: 4px;
          }
          .bhasha-pref-desc {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.4);
            margin: 0 0 8px 0;
          }
          .bhasha-pref-toggle label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: #e2e8f0;
            cursor: pointer;
          }
          .bhasha-pref-toggle input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #6366f1;
          }
          .bhasha-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }
          .bhasha-btn-cancel {
            padding: 8px 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            background: transparent;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            font-size: 0.85rem;
          }
          .bhasha-btn-save {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
          }
          .bhasha-btn-save:disabled {
            opacity: 0.6;
            cursor: wait;
          }
        `}</style>
      </div>
    </div>
  );
}

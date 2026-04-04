"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe } from "lucide-react";
import { getAllLanguages } from "@/lib/voice-aid/languages";
import type { SupportedLanguage } from "@/types";

interface Props {
  current: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

export default function LanguageSelector({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const languages = getAllLanguages();
  const currentConfig =
    languages.find((l) => l.code === current) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-none bg-muted border border-foreground border-2 hover:bg-muted transition-all text-sm"
        aria-label="Select language"
        id="voice-language-selector"
      >
        <Globe className="h-4 w-4 text-blue-400" />
        <span className="text-lg">{currentConfig.flag}</span>
        <span className="font-medium">{currentConfig.nativeName}</span>
        <ChevronDown
          className={`h-3 w-3 text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 z-50 w-64 max-h-80 overflow-y-auto rounded-none bg-background border border-foreground border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-foreground"
          >
            {[1, 2, 3].map((tier) => {
              const tierLangs = languages.filter((l) => l.tier === tier);
              return (
                <div key={tier}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-foreground/30 uppercase tracking-wider sticky top-0 bg-background">
                    {tier === 1
                      ? "Primary"
                      : tier === 2
                        ? "Supported"
                        : "Additional"}
                  </div>
                  {tierLangs.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onChange(lang.code);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors ${lang.code === current ? "bg-blue-500/10 text-blue-400" : ""}`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          {lang.nativeName}
                        </div>
                        <div className="text-xs text-foreground/40">
                          {lang.name}
                        </div>
                      </div>
                      {lang.code === current && (
                        <span className="text-xs text-blue-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

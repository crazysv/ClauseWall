"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import Link from "next/link";

export default function VoiceFloatingButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 border border-white/10 rounded-xl px-3 py-2 shadow-xl whitespace-nowrap"
          >
            <div className="text-sm font-medium text-white">🎤 Voice Aid</div>
            <div className="text-xs text-white/50">Speak to understand your contract</div>
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-white/10 rounded-full flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Link href="/voice">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:shadow-emerald-500/50 transition-shadow"
          aria-label="Open Voice Aid"
          id="voice-floating-button"
        >
          <Mic className="h-6 w-6 text-white" />
        </motion.button>
      </Link>
    </div>
  );
}

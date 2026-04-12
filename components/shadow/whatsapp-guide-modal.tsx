"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ArrowRight, X } from "lucide-react";

interface WhatsAppGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    step: 1,
    icon: "📱",
    title: "Open WhatsApp",
    desc: "Find the chat with the broker, landlord, HR, or anyone who made promises.",
  },
  {
    step: 2,
    icon: "👆",
    title: "Tap Chat Name",
    desc: "Tap the contact/group name at the top of the chat to open chat info.",
  },
  {
    step: 3,
    icon: "📤",
    title: "Scroll to Export",
    desc: "Scroll down in chat info and tap 'Export Chat'.",
  },
  {
    step: 4,
    icon: "📝",
    title: "Without Media",
    desc: "Select 'Without Media' — this is faster and creates a smaller .txt file.",
  },
  {
    step: 5,
    icon: "💾",
    title: "Save the File",
    desc: "Save or share the .txt file to your device. You may receive a .zip file.",
  },
  {
    step: 6,
    icon: "⬆️",
    title: "Upload Here",
    desc: "Upload the .txt or .zip file in ClauseWall. We parse it automatically.",
  },
];

export default function WhatsAppGuideModal({
  open,
  onClose,
}: WhatsAppGuideModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative max-w-md w-full border border-neutral-800 bg-[#0a0a0a] p-6"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-neutral-600 hover:text-neutral-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                <div className="p-2.5 border border-emerald-900/50 bg-emerald-950/10">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
                    EXTRACT PROMISES
                  </h3>
                  <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
                    WHATSAPP CHAT EXPORT GUIDE
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {STEPS.map(({ step, icon, title, desc }, i) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 border border-neutral-800 bg-[#050505] flex items-center justify-center text-sm">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
                        <span className="text-neutral-600 mr-2">
                          STEP {step}:
                        </span>
                        {title}
                      </p>
                      <p className="text-[8px] font-mono text-neutral-600 mt-0.5 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-neutral-800 mt-2 flex-shrink-0 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 border-l-2 border-emerald-500 bg-emerald-950/20">
                <p className="text-[8px] font-mono text-neutral-500 leading-relaxed">
                  💡{" "}
                  <span className="text-emerald-400">
                    YOUR DATA STAYS PRIVATE.
                  </span>{" "}
                  We only extract promises and commitments — personal messages
                  are never stored.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

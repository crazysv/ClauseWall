"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, TrendingUp } from "lucide-react";

interface DataContributionBannerProps {
  city: string | null;
  totalContractors: number;
  onDismiss?: () => void;
}

export default function DataContributionBanner({
  city,
  totalContractors,
  onDismiss,
}: DataContributionBannerProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  const location = city || "your region";
  const userCount = totalContractors > 0 ? totalContractors : "many";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="mt-6"
      >
        <div className="relative flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-500/[0.06] to-purple-500/[0.06] border border-cyan-500/10">
          {/* Icon */}
          <div className="flex-shrink-0 p-1.5 rounded-lg bg-cyan-500/10">
            <Heart className="h-4 w-4 text-cyan-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/80">
              Your analysis contributed to{" "}
              <span className="font-semibold text-cyan-400">{location}</span>{" "}
              benchmarks.{" "}
              <span className="text-white/50">
                You&apos;re helping{" "}
                <span className="text-white/70">{userCount}</span> other users
                get fairer contracts. 🙏
              </span>
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/30">
              <TrendingUp className="h-3 w-3" />
              All data is anonymized — individual contract details are never shared.
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, TrendingUp } from "lucide-react";

interface DataContributionBannerProps {
  city: string | null;
  totalContractors: number;
  onDismiss?: () => void;
}

export function DataContributionBanner({
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
        <div className="relative flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-100 shadow-sm dark:shadow-slate-900/20">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20">
            <Heart className="h-5 w-5 text-teal-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-medium text-slate-700">
              Your analysis contributed to{" "}
              <span className="font-black text-teal-700">{location}</span>{" "}
              benchmarks.{" "}
              <span className="text-slate-500 dark:text-slate-400">
                You&apos;re helping{" "}
                <span className="text-slate-800 dark:text-slate-200 font-bold">{userCount}</span> other users
                get fairer contracts. 🙏
              </span>
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <TrendingUp className="h-3.5 w-3.5" />
              All data is anonymized — individual contract details are never shared.
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

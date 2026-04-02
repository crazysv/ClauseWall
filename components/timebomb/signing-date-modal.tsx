"use client";

// ============================================
// SIGNING DATE MODAL
// Date picker modal to activate the Time Bomb Defuser
// ============================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Loader2, Shield, X } from "lucide-react";
import { toast } from "sonner";

interface SigningDateModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onActivated: (data: {
    deadlines: unknown[];
    stats: unknown;
    temporal_risk: string;
  }) => void;
}

export function SigningDateModal({
  documentId,
  isOpen,
  onClose,
  onActivated,
}: SigningDateModalProps) {
  const [signingDate, setSigningDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [useToday, setUseToday] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleActivate = async () => {
    try {
      setLoading(true);
      const dateToUse = useToday
        ? new Date().toISOString().split("T")[0]
        : signingDate;

      const res = await fetch("/api/timebomb/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          signing_date: dateToUse,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in or create an account to use the Time Bomb Defuser.");
          router.push("/auth/login");
          onClose();
          setLoading(false);
          return;
        }
        const data = await res.json();
        throw new Error(data.error || "Activation failed");
      }

      const data = await res.json();

      if (data.deadlines?.length === 0) {
        toast.info("No temporal deadlines found in this contract.");
      } else {
        toast.success(
          `🎯 ${data.deadlines?.length || 0} deadlines activated!`
        );
      }

      onActivated(data);
      onClose();
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to activate Time Bomb Defuser"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-4 md:p-6 lg:p-8 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shadow-sm dark:shadow-slate-900/20">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 mt-0.5">
                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Activate Time Bomb Defuser
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                  When did you sign this contract?
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              We&apos;ll calculate all your critical deadlines from the signing
              date and set up reminders so you never miss one.
            </p>

            {/* Date input */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="signing-date"
                  className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2"
                >
                  Contract Signing Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signing-date"
                    type="date"
                    value={useToday ? new Date().toISOString().split("T")[0] : signingDate}
                    onChange={(e) => {
                      setSigningDate(e.target.value);
                      setUseToday(false);
                    }}
                    disabled={useToday}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all disabled:opacity-50 shadow-inner"
                  />
                </div>
              </div>

              {/* Use today checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group mt-4">
                <input
                  type="checkbox"
                  checked={useToday}
                  onChange={(e) => setUseToday(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/25 transition-colors"
                />
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 dark:text-slate-100 transition-colors uppercase tracking-widest">
                  I haven&apos;t signed yet — use today&apos;s date
                </span>
              </label>
            </div>

            {/* Action button */}
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full mt-8 px-4 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              aria-label="Activate Time Bomb Defuser"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning for deadlines...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Activate Defuser
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

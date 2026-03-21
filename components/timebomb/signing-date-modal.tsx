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
      console.error("[TimeBomb] Activation error:", error);
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
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  🕐 Activate Time Bomb Defuser
                </h2>
                <p className="text-sm text-white/50">
                  When did you sign this contract?
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-white/40 mb-6">
              We&apos;ll calculate all your critical deadlines from the signing
              date and set up reminders so you never miss one.
            </p>

            {/* Date input */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="signing-date"
                  className="block text-sm font-medium text-white/60 mb-2"
                >
                  Contract Signing Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    id="signing-date"
                    type="date"
                    value={useToday ? new Date().toISOString().split("T")[0] : signingDate}
                    onChange={(e) => {
                      setSigningDate(e.target.value);
                      setUseToday(false);
                    }}
                    disabled={useToday}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 focus:outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Use today checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useToday}
                  onChange={(e) => setUseToday(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/25"
                />
                <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                  I haven&apos;t signed yet — use today&apos;s date
                </span>
              </label>
            </div>

            {/* Action button */}
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full mt-6 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

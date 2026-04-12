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
    new Date().toISOString().split("T")[0],
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
          toast.error(
            "Please sign in or create an account to use the Time Bomb Defuser.",
          );
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
        toast.success(`🎯 ${data.deadlines?.length || 0} deadlines activated!`);
      }

      onActivated(data);
      onClose();
    } catch (error) {
      console.error("[TimeBomb] Activation error:", error);
      toast.error(
        (error as Error).message || "Failed to activate Time Bomb Defuser",
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
            className="relative w-full max-w-md border border-neutral-800 bg-[#0a0a0a] p-6"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-neutral-600 hover:text-neutral-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 border-b border-neutral-900 pb-4">
              <div className="p-3 border border-amber-900/50 bg-amber-950/10">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                  ACTIVATE_DEFUSER
                </h2>
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
                  WHEN DID YOU SIGN THIS CONTRACT?
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-[9px] font-mono text-neutral-500 leading-relaxed mb-6">
              We&apos;ll calculate all your critical deadlines from the signing
              date and set up reminders so you never miss one.
            </p>

            {/* Date input */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="signing-date"
                  className="block text-[9px] font-mono uppercase tracking-widest text-neutral-400 mb-2"
                >
                  CONTRACT SIGNING DATE
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                  <input
                    id="signing-date"
                    type="date"
                    value={
                      useToday
                        ? new Date().toISOString().split("T")[0]
                        : signingDate
                    }
                    onChange={(e) => {
                      setSigningDate(e.target.value);
                      setUseToday(false);
                    }}
                    disabled={useToday}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-800 bg-[#050505] font-mono text-sm text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Use today checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group mt-4">
                <div
                  className={`w-4 h-4 border flex items-center justify-center transition-colors ${useToday ? "border-amber-500 bg-amber-500" : "border-neutral-700 bg-[#050505]"}`}
                >
                  {useToday && (
                    <Shield className="w-2.5 h-2.5 text-black" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={useToday}
                  onChange={(e) => setUseToday(e.target.checked)}
                  className="hidden"
                />
                <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 group-hover:text-amber-400 transition-colors">
                  USE TODAY&apos;S DATE (NOT SIGNED YET)
                </span>
              </label>
            </div>

            {/* Action button */}
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full mt-8 px-6 py-3 border border-amber-900/50 bg-amber-950/10 font-mono uppercase tracking-widest text-[9px] text-amber-400 hover:text-amber-300 hover:border-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              aria-label="Activate Time Bomb Defuser"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SCANNING FOR DEADLINES...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  ACTIVATE DEFUSER
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

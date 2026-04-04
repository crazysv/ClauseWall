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
            className="relative w-full max-w-md border-4 border-black bg-white dark:bg-zinc-950 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 stroke-[3px]" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 border-b-4 border-black pb-4">
              <div className="w-12 h-12 border-4 border-black bg-orange-400 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="w-6 h-6 text-black stroke-[3px]" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
                  ACTIVATE DEFUSER
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  WHEN DID YOU SIGN THIS CONTRACT?
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm font-medium leading-relaxed text-muted-foreground mb-6">
              We&apos;ll calculate all your critical deadlines from the signing
              date and set up reminders so you never miss one.
            </p>

            {/* Date input */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="signing-date"
                  className="block text-sm font-black uppercase tracking-widest text-foreground mb-2"
                >
                  CONTRACT SIGNING DATE
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground stroke-[3px]" />
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
                    className="w-full pl-12 pr-4 py-3 border-4 border-black bg-white dark:bg-black font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Use today checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group mt-4">
                <div
                  className={`w-6 h-6 border-4 flex items-center justify-center transition-all ${useToday ? "border-orange-500 bg-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"}`}
                >
                  {useToday && (
                    <Shield className="w-3 h-3 text-black stroke-[4px]" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={useToday}
                  onChange={(e) => setUseToday(e.target.checked)}
                  className="hidden"
                />
                <span className="text-sm font-bold uppercase tracking-widest text-foreground group-hover:text-orange-600 transition-colors">
                  USE TODAY&apos;S DATE (NOT SIGNED YET)
                </span>
              </label>
            </div>

            {/* Action button */}
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full mt-8 px-6 py-4 border-4 border-black bg-orange-500 hover:bg-orange-600 font-black uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
              aria-label="Activate Time Bomb Defuser"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 stroke-[3px] animate-spin" />
                  SCANNING FOR DEADLINES...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 stroke-[3px]" />
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

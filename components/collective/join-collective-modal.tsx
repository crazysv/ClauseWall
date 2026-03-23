"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, X, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  collectiveId: string;
  entityName: string;
  memberCount: number;
  documentId?: string;
  onClose: () => void;
  onJoined: () => void;
}

export default function JoinCollectiveModal({
  collectiveId,
  entityName,
  memberCount,
  documentId,
  onClose,
  onJoined,
}: Props) {
  const [joining, setJoining] = useState(false);
  const [optInToAction, setOptInToAction] = useState(false);
  const [optInToChat, setOptInToChat] = useState(true);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/collective/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectiveId,
          documentId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to join");
      }

      toast.success(
        `Joined collective as "${data.anonymous_id}". Your identity is fully anonymous.`
      );
      onJoined();
    } catch (error) {
      toast.error((error as Error).message || "Failed to join collective");
    } finally {
      setJoining(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Join Collective</h3>
                  <p className="text-xs text-white/40">
                    Against {entityName} • {memberCount} members
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-300 mb-1">
                    Your Privacy is Guaranteed
                  </p>
                  <ul className="text-[11px] text-green-300/70 space-y-1">
                    <li>• You'll receive a random anonymous identity</li>
                    <li>• No member can see your name, email, or documents</li>
                    <li>• Only aggregate data is shared (total flags, common violations)</li>
                    <li>• You can leave at any time</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3 cursor-pointer hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-2">
                  {optInToChat ? (
                    <Eye className="h-4 w-4 text-blue-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-white/30" />
                  )}
                  <div>
                    <p className="text-xs text-white">Enable anonymous chat</p>
                    <p className="text-[10px] text-white/30">
                      Communicate with other members anonymously
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={optInToChat}
                  onChange={(e) => setOptInToChat(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3 cursor-pointer hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-white/30" />
                  <div>
                    <p className="text-xs text-white">Opt-in for legal action</p>
                    <p className="text-[10px] text-white/30">
                      Be included in collective legal notices (can change later)
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={optInToAction}
                  onChange={(e) => setOptInToAction(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Join button */}
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
            >
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {joining ? "Joining..." : "Join Anonymously"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

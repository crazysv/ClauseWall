"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, AlertTriangle, X } from "lucide-react";
import type { VoteSummary } from "@/types";

interface ClauseVoteProps {
  clauseId: string;
  roomId: string;
  voterId: string;
  voterName: string;
  currentVote: string | null;
  summary: VoteSummary | null;
  onVote: (clauseId: string, vote: "negotiate" | "accept" | "reject") => void;
}

export default function ClauseVote({
  clauseId,
  currentVote,
  summary,
  onVote,
}: ClauseVoteProps) {
  const [voting, setVoting] = useState(false);

  const handleVote = async (vote: "negotiate" | "accept" | "reject") => {
    if (voting) return;
    setVoting(true);
    onVote(clauseId, vote);
    setTimeout(() => setVoting(false), 300);
  };

  const voteButtons = [
    {
      value: "accept" as const,
      label: "Accept",
      icon: <Check className="h-3.5 w-3.5" />,
      activeClass: "bg-green-500/20 border-green-500/40 text-green-400",
      count: summary?.accept_count || 0,
    },
    {
      value: "negotiate" as const,
      label: "Negotiate",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      activeClass: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400",
      count: summary?.negotiate_count || 0,
    },
    {
      value: "reject" as const,
      label: "Reject",
      icon: <X className="h-3.5 w-3.5" />,
      activeClass: "bg-red-500/20 border-red-500/40 text-red-400",
      count: summary?.reject_count || 0,
    },
  ];

  const totalVotes = summary?.total_voters || 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {voteButtons.map((btn) => {
        const isActive = currentVote === btn.value;
        return (
          <motion.button
            key={btn.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVote(btn.value)}
            disabled={voting}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isActive
                ? btn.activeClass
                : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300"
            }`}
          >
            {btn.icon}
            {btn.label}
            {btn.count > 0 && (
              <span className="ml-0.5 text-[10px] opacity-70">{btn.count}</span>
            )}
          </motion.button>
        );
      })}

      {totalVotes > 0 && summary?.consensus && (
        <span className="text-[10px] text-green-400 font-medium ml-1">
          ✓ Consensus
        </span>
      )}
    </div>
  );
}

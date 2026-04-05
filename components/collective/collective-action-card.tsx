"use client";

import { useState } from "react";
import {
  FileText,
  Vote,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CollectiveAction, VoteResult } from "@/types";

interface Props {
  action: CollectiveAction;
  collectiveId: string;
  isMember: boolean;
}

const ACTION_LABELS: Record<string, { label: string; emoji: string }> = {
  joint_legal_notice: { label: "Joint Legal Notice", emoji: "📜" },
  consumer_forum_complaint: { label: "Consumer Forum Complaint", emoji: "⚖️" },
  rti_application: { label: "RTI Application", emoji: "📋" },
  media_report: { label: "Media Report", emoji: "📰" },
  authority_complaint: { label: "Authority Complaint", emoji: "🏛️" },
  negotiation_demand: { label: "Negotiation Demand", emoji: "🤝" },
};

const STATUS_STYLES: Record<string, string> = {
  proposed: "bg-blue-500/10 text-blue-800 dark:text-blue-100 font-bold",
  voting: "bg-amber-500/10 text-amber-800 dark:text-amber-100 font-bold",
  approved: "bg-green-500/10 text-green-800 dark:text-green-100 font-bold",
  in_progress: "bg-purple-500/10 text-purple-800 dark:text-purple-100 font-bold",
  completed: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-100 font-bold",
  rejected: "bg-red-500/10 text-red-800 dark:text-red-100 font-bold",
};

export default function CollectiveActionCard({
  action,
  collectiveId,
  isMember,
}: Props) {
  const [voting, setVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(
    action.vote_result,
  );

  const actionInfo = ACTION_LABELS[action.action_type] || {
    label: action.action_type,
    emoji: "📄",
  };

  const handleVote = async (vote: "yes" | "no" | "abstain") => {
    setVoting(true);
    try {
      const res = await fetch(`/api/collective/${collectiveId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id, vote }),
      });
      const data = await res.json();
      if (data.success) {
        setVoteResult(data.result);
        toast.success("Vote cast successfully");
      } else {
        toast.error(data.error || "Failed to vote");
      }
    } catch {
      toast.error("Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  const currentVotes = voteResult || action.vote_result;

  return (
    <Card className="border-foreground border-2 bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">{actionInfo.emoji}</span>
            <div>
              <h4 className="text-sm font-medium text-foreground">
                {action.title}
              </h4>
              <p className="text-[10px] text-foreground mt-0.5">
                {actionInfo.label} • Proposed by {action.proposed_by}
              </p>
            </div>
          </div>
          <Badge
            className={`text-[10px] ${STATUS_STYLES[action.status] || ""}`}
          >
            {action.status}
          </Badge>
        </div>

        {action.description && (
          <p className="text-xs text-foreground mb-3 line-clamp-2">
            {action.description}
          </p>
        )}

        {/* Vote results */}
        {currentVotes && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-green-500/5 p-2 text-center">
              <p className="text-sm font-bold text-green-400">
                {currentVotes.yes_votes}
              </p>
              <p className="text-[9px] text-foreground">Yes</p>
            </div>
            <div className="rounded-lg bg-red-500/5 p-2 text-center">
              <p className="text-sm font-bold text-red-400">
                {currentVotes.no_votes}
              </p>
              <p className="text-[9px] text-foreground">No</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2 text-center">
              <p className="text-sm font-bold text-foreground">
                {currentVotes.abstain_votes}
              </p>
              <p className="text-[9px] text-foreground">Abstain</p>
            </div>
          </div>
        )}

        {/* Voting buttons for members */}
        {isMember &&
          (action.status === "proposed" || action.status === "voting") && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVote("yes")}
                disabled={voting}
                className="flex-1 text-xs gap-1 border-green-500/20 hover:bg-green-500/10 text-green-800 dark:text-green-100 font-bold"
              >
                {voting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ThumbsUp className="h-3 w-3" />
                )}
                Yes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVote("no")}
                disabled={voting}
                className="flex-1 text-xs gap-1 border-red-500/20 hover:bg-red-500/10 text-red-800 dark:text-red-100 font-bold"
              >
                <ThumbsDown className="h-3 w-3" />
                No
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVote("abstain")}
                disabled={voting}
                className="flex-1 text-xs gap-1 border-foreground border-2 hover:bg-muted text-foreground"
              >
                <Minus className="h-3 w-3" />
                Abstain
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, FileText, Gavel, FileSearch, Newspaper, Building2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CollectiveActionType } from "@/types";

interface Props {
  collectiveId: string;
  onClose: () => void;
  onProposed: () => void;
}

const ACTION_TYPES: {
  type: CollectiveActionType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "joint_legal_notice",
    label: "Joint Legal Notice",
    description: "Formal legal notice under Section 80 CPC",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    type: "consumer_forum_complaint",
    label: "Consumer Forum Complaint",
    description: "Representative complaint under CPA 2019",
    icon: <Gavel className="h-4 w-4" />,
  },
  {
    type: "rti_application",
    label: "RTI Application",
    description: "Request regulatory compliance information",
    icon: <FileSearch className="h-4 w-4" />,
  },
  {
    type: "media_report",
    label: "Media Report",
    description: "Investigative report brief for press coverage",
    icon: <Newspaper className="h-4 w-4" />,
  },
  {
    type: "authority_complaint",
    label: "Authority Complaint",
    description: "Complaint to relevant regulatory authority",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    type: "negotiation_demand",
    label: "Negotiation Demand",
    description: "Collective bargaining demand letter",
    icon: <Handshake className="h-4 w-4" />,
  },
];

export default function ProposeActionModal({
  collectiveId,
  onClose,
  onProposed,
}: Props) {
  const [selectedType, setSelectedType] = useState<CollectiveActionType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposing, setProposing] = useState(false);

  const handlePropose = async () => {
    if (!selectedType || !title.trim()) {
      toast.error("Select an action type and provide a title");
      return;
    }

    setProposing(true);
    try {
      const res = await fetch(`/api/collective/${collectiveId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: selectedType,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Action proposed! Members can now vote.");
        onProposed();
      } else {
        toast.error(data.error || "Failed to propose action");
      }
    } catch {
      toast.error("Failed to propose action");
    } finally {
      setProposing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-none bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white">Propose Collective Action</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Action type selection */}
            <div>
              <label className="text-xs text-white/40 mb-2 block">
                Action Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACTION_TYPES.map((at) => (
                  <button
                    key={at.type}
                    onClick={() => setSelectedType(at.type)}
                    className={`flex items-start gap-2 p-3 rounded-none border-2 text-left transition-all hover:-translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      selectedType === at.type
                        ? "border-foreground bg-amber-300 text-black"
                        : "border-foreground bg-muted text-foreground"
                    }`}
                  >
                    <span
                      className={
                        selectedType === at.type
                          ? "text-amber-400"
                          : "text-white/30"
                      }
                    >
                      {at.icon}
                    </span>
                    <div>
                      <p className="text-[11px] font-medium text-white">
                        {at.label}
                      </p>
                      <p className="text-[9px] text-white/30">{at.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Demand refund for delayed possession"
                className="w-full px-3 py-2 text-xs bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why this action is needed and what you hope to achieve..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 resize-none"
                maxLength={1000}
              />
            </div>

            <Button
              onClick={handlePropose}
              disabled={proposing || !selectedType || !title.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
            >
              {proposing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {proposing ? "Proposing..." : "Propose Action — Start Voting"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

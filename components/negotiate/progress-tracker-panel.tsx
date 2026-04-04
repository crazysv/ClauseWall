"use client";

import { useState } from "react";
import {
  Plus,
  Check,
  X,
  HandshakeIcon,
  Lock,
  SkipForward,
  Download,
  ArrowRight,
} from "lucide-react";
import {
  addClauseToTracker,
  updateClauseStatus,
  addNote,
  exportSession,
} from "@/lib/negotiate/session-manager";
import type { NegotiationSession, NegotiationClauseStatus } from "@/types";

interface ProgressTrackerPanelProps {
  session: NegotiationSession;
  onSessionUpdate: (session: NegotiationSession) => void;
}

const STATUS_CONFIG: Record<
  NegotiationClauseStatus,
  {
    label: string;
    icon: string;
    color: string;
    bg: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: "⏳",
    color: "text-gray-600",
    bg: "bg-gray-200",
  },
  negotiating: {
    label: "Active",
    icon: "🔄",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  won: {
    label: "Won",
    icon: "✅",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  conceded: {
    label: "Conceded",
    icon: "❌",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  compromised: {
    label: "Compromise",
    icon: "🤝",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  deadlocked: {
    label: "Deadlock",
    icon: "🔒",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  skipped: {
    label: "Skipped",
    icon: "⏭️",
    color: "text-gray-700",
    bg: "bg-gray-200",
  },
};

export default function ProgressTrackerPanel({
  session,
  onSessionUpdate,
}: ProgressTrackerPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClauseSummary, setNewClauseSummary] = useState("");
  const [newOriginalTerms, setNewOriginalTerms] = useState("");
  const [newYourAsk, setNewYourAsk] = useState("");
  const [noteText, setNoteText] = useState("");

  const score = session.overall_score;

  const handleAddClause = () => {
    if (!newClauseSummary.trim()) return;

    const updated = addClauseToTracker(session, {
      clause_summary: newClauseSummary.trim(),
      clause_type: null,
      original_terms: newOriginalTerms.trim(),
      your_ask: newYourAsk.trim(),
      status: "pending",
      final_terms: null,
      leverage_used: [],
      notes: "",
    });

    onSessionUpdate(updated);
    setNewClauseSummary("");
    setNewOriginalTerms("");
    setNewYourAsk("");
    setShowAddForm(false);
  };

  const handleStatusChange = (
    clauseId: string,
    status: NegotiationClauseStatus,
  ) => {
    const updated = updateClauseStatus(session, clauseId, status);
    onSessionUpdate(updated);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const updated = addNote(session, noteText.trim());
    onSessionUpdate(updated);
    setNoteText("");
  };

  const handleExport = () => {
    const text = exportSession(session);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negotiation_${session.entity_name}_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusActions: {
    status: NegotiationClauseStatus;
    icon: React.ReactNode;
    label: string;
  }[] = [
    { status: "won", icon: <Check className="w-3.5 h-3.5" />, label: "Won" },
    { status: "conceded", icon: <X className="w-3.5 h-3.5" />, label: "Lost" },
    {
      status: "compromised",
      icon: <HandshakeIcon className="w-3.5 h-3.5" />,
      label: "Split",
    },
    {
      status: "deadlocked",
      icon: <Lock className="w-3.5 h-3.5" />,
      label: "Stuck",
    },
    {
      status: "skipped",
      icon: <SkipForward className="w-3.5 h-3.5" />,
      label: "Skip",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="text-center mb-6">
          <p className="text-5xl font-black text-black tracking-tighter">
            {score.win_percentage}
            <span className="text-xl font-bold text-muted-foreground">%</span>
          </p>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-2">
            Win Rate
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: "Won", value: score.won, color: "text-green-700" },
            { label: "Lost", value: score.conceded, color: "text-red-700" },
            {
              label: "Split",
              value: score.compromised,
              color: "text-yellow-700",
            },
            {
              label: "Stuck",
              value: score.deadlocked,
              color: "text-orange-700",
            },
            { label: "Left", value: score.pending, color: "text-gray-400" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className={`text-2xl font-black ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Win/Loss bar */}
        {score.total_clauses > 0 && (
          <div className="mt-6 h-4 border-2 border-black rounded-sm bg-gray-200 overflow-hidden flex shadow-[inset_0px_2px_4px_rgba(0,0,0,0.1)]">
            {score.won > 0 && (
              <div
                className="h-full bg-green-500 transition-all border-r-2 border-black last:border-r-0"
                style={{ width: `${(score.won / score.total_clauses) * 100}%` }}
              />
            )}
            {score.compromised > 0 && (
              <div
                className="h-full bg-yellow-500 transition-all border-r-2 border-black last:border-r-0"
                style={{
                  width: `${(score.compromised / score.total_clauses) * 100}%`,
                }}
              />
            )}
            {score.conceded > 0 && (
              <div
                className="h-full bg-red-500 transition-all border-r-2 border-black last:border-r-0"
                style={{
                  width: `${(score.conceded / score.total_clauses) * 100}%`,
                }}
              />
            )}
            {score.deadlocked > 0 && (
              <div
                className="h-full bg-orange-500 transition-all border-r-2 border-black last:border-r-0"
                style={{
                  width: `${(score.deadlocked / score.total_clauses) * 100}%`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Add Clause Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 border-2 border-dashed border-black text-black font-black uppercase tracking-wider hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
          style={{ minHeight: "48px" }}
        >
          <Plus className="w-5 h-5" />
          Add Clause to Track
        </button>
      )}

      {/* Add Clause Form */}
      {showAddForm && (
        <div className="border-2 border-indigo-900 bg-indigo-50 shadow-[4px_4px_0px_0px_rgba(49,46,129,1)] p-5 space-y-4 animate-in fade-in duration-200">
          <input
            placeholder="CLAUSE NAME (E.G., SECURITY DEPOSIT)"
            value={newClauseSummary}
            onChange={(e) => setNewClauseSummary(e.target.value)}
            className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-black placeholder:text-muted-foreground placeholder:uppercase placeholder:tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-900 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)]"
            style={{ fontSize: "16px" }}
          />
          <input
            placeholder="THEIR TERMS (E.G., 6 MONTHS DEPOSIT)"
            value={newOriginalTerms}
            onChange={(e) => setNewOriginalTerms(e.target.value)}
            className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-black placeholder:text-muted-foreground placeholder:uppercase placeholder:tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-900 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)]"
            style={{ fontSize: "16px" }}
          />
          <input
            placeholder="YOUR ASK (E.G., 2 MONTHS DEPOSIT)"
            value={newYourAsk}
            onChange={(e) => setNewYourAsk(e.target.value)}
            className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-black placeholder:text-muted-foreground placeholder:uppercase placeholder:tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-900 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)]"
            style={{ fontSize: "16px" }}
          />
          <div className="flex gap-3">
            <button
              onClick={handleAddClause}
              disabled={!newClauseSummary.trim()}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 transition-all active:translate-y-1 active:shadow-none"
              style={{ minHeight: "44px" }}
            >
              Add Clause
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-black text-sm font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none"
              style={{ minHeight: "44px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clause List */}
      {session.clauses.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 mb-3 pt-6 border-t-2 border-black/10">
            {session.clauses.length} clause
            {session.clauses.length !== 1 ? "s" : ""} tracked
          </p>
          {session.clauses.map((clause) => {
            const config =
              STATUS_CONFIG[clause.status] || STATUS_CONFIG.pending;

            return (
              <div
                key={clause.id}
                className="border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5 space-y-4 hover:translate-x-1 transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-[10px] px-2 py-1 uppercase tracking-wider font-black border-2 border-black ${config.bg} ${config.color}`}
                      >
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <p className="text-base font-black text-black leading-tight mb-2">
                      {clause.clause_summary}
                    </p>
                    {clause.original_terms && (
                      <p className="text-xs font-bold text-red-700 mt-1">
                        Their terms:{" "}
                        <span className="font-medium text-black">
                          {clause.original_terms}
                        </span>
                      </p>
                    )}
                    {clause.your_ask && (
                      <p className="text-xs font-bold text-blue-700 mt-1">
                        Your ask:{" "}
                        <span className="font-medium text-black">
                          {clause.your_ask}
                        </span>
                      </p>
                    )}
                    {clause.final_terms && (
                      <p className="text-xs font-bold text-green-700 mt-1">
                        Final:{" "}
                        <span className="font-medium text-black">
                          {clause.final_terms}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                {clause.status === "pending" ||
                clause.status === "negotiating" ? (
                  <div className="flex gap-2 flex-wrap pt-2 border-t-2 border-black/5">
                    {statusActions.map((action) => (
                      <button
                        key={action.status}
                        onClick={() =>
                          handleStatusChange(clause.id, action.status)
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-2 border-black bg-white hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none ${
                          STATUS_CONFIG[action.status].color
                        }`}
                        style={{ minHeight: "32px" }}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Note */}
      <div className="relative mt-8">
        <input
          placeholder="QUICK NOTE..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          className="w-full px-4 py-4 pr-12 text-sm font-bold text-black bg-white border-2 border-black placeholder:text-muted-foreground placeholder:uppercase placeholder:font-black tracking-widest focus:outline-none focus:bg-gray-50 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          style={{ fontSize: "16px" }}
        />
        <button
          onClick={handleAddNote}
          disabled={!noteText.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white hover:bg-gray-800 disabled:opacity-20 transition-colors border-2 border-transparent active:scale-95"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Notes */}
      {session.notes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1 mt-6 mb-2">
            Notes
          </p>
          <div className="max-h-40 overflow-y-auto border-2 border-black bg-gray-50 p-4 space-y-3 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)]">
            {session.notes.map((note, idx) => (
              <p
                key={idx}
                className="text-sm font-bold text-black/70 border-b-2 border-black/10 pb-3 last:border-0 last:pb-0"
              >
                {note}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <button
        onClick={handleExport}
        className="w-full mt-8 py-4 border-2 border-black bg-white text-black font-black uppercase tracking-widest hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 active:translate-y-1 active:shadow-none"
        style={{ minHeight: "48px" }}
      >
        <Download className="w-5 h-5" />
        Export Session Summary
      </button>
    </div>
  );
}

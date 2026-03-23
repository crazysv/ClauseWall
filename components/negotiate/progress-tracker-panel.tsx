"use client";

import { useState } from "react";
import { Plus, Check, X, HandshakeIcon, Lock, SkipForward, Download, ArrowRight } from "lucide-react";
import {
  addClauseToTracker,
  updateClauseStatus,
  addNote,
  exportSession,
} from "@/lib/negotiate/session-manager";
import type {
  NegotiationSession,
  NegotiationClauseStatus,
} from "@/types";

interface ProgressTrackerPanelProps {
  session: NegotiationSession;
  onSessionUpdate: (session: NegotiationSession) => void;
}

const STATUS_CONFIG: Record<NegotiationClauseStatus, {
  label: string; icon: string; color: string; bg: string;
}> = {
  pending: { label: "Pending", icon: "⏳", color: "text-white/40", bg: "bg-white/5" },
  negotiating: { label: "Active", icon: "🔄", color: "text-blue-400", bg: "bg-blue-500/10" },
  won: { label: "Won", icon: "✅", color: "text-green-400", bg: "bg-green-500/10" },
  conceded: { label: "Conceded", icon: "❌", color: "text-red-400", bg: "bg-red-500/10" },
  compromised: { label: "Compromise", icon: "🤝", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  deadlocked: { label: "Deadlock", icon: "🔒", color: "text-orange-400", bg: "bg-orange-500/10" },
  skipped: { label: "Skipped", icon: "⏭️", color: "text-gray-400", bg: "bg-gray-500/10" },
};

export default function ProgressTrackerPanel({ session, onSessionUpdate }: ProgressTrackerPanelProps) {
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

  const handleStatusChange = (clauseId: string, status: NegotiationClauseStatus) => {
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

  const statusActions: { status: NegotiationClauseStatus; icon: React.ReactNode; label: string }[] = [
    { status: "won", icon: <Check className="w-3.5 h-3.5" />, label: "Won" },
    { status: "conceded", icon: <X className="w-3.5 h-3.5" />, label: "Lost" },
    { status: "compromised", icon: <HandshakeIcon className="w-3.5 h-3.5" />, label: "Split" },
    { status: "deadlocked", icon: <Lock className="w-3.5 h-3.5" />, label: "Stuck" },
    { status: "skipped", icon: <SkipForward className="w-3.5 h-3.5" />, label: "Skip" },
  ];

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="text-center mb-4">
          <p className="text-4xl font-bold text-white">
            {score.win_percentage}
            <span className="text-lg text-white/30">%</span>
          </p>
          <p className="text-xs text-white/30 mt-1">Win Rate</p>
        </div>

        <div className="grid grid-cols-5 gap-1 text-center">
          {[
            { label: "Won", value: score.won, color: "text-green-400" },
            { label: "Lost", value: score.conceded, color: "text-red-400" },
            { label: "Split", value: score.compromised, color: "text-yellow-400" },
            { label: "Stuck", value: score.deadlocked, color: "text-orange-400" },
            { label: "Left", value: score.pending, color: "text-white/40" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-white/30">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Win/Loss bar */}
        {score.total_clauses > 0 && (
          <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden flex">
            {score.won > 0 && (
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(score.won / score.total_clauses) * 100}%` }}
              />
            )}
            {score.compromised > 0 && (
              <div
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${(score.compromised / score.total_clauses) * 100}%` }}
              />
            )}
            {score.conceded > 0 && (
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${(score.conceded / score.total_clauses) * 100}%` }}
              />
            )}
            {score.deadlocked > 0 && (
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${(score.deadlocked / score.total_clauses) * 100}%` }}
              />
            )}
          </div>
        )}
      </div>

      {/* Add Clause Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2"
          style={{ minHeight: "48px" }}
        >
          <Plus className="w-5 h-5" />
          Add Clause to Track
        </button>
      )}

      {/* Add Clause Form */}
      {showAddForm && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3 animate-in fade-in duration-200">
          <input
            placeholder="Clause name (e.g., Security Deposit)"
            value={newClauseSummary}
            onChange={(e) => setNewClauseSummary(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/30"
            style={{ fontSize: "16px" }}
          />
          <input
            placeholder="Their terms (e.g., 6 months deposit)"
            value={newOriginalTerms}
            onChange={(e) => setNewOriginalTerms(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/30"
            style={{ fontSize: "16px" }}
          />
          <input
            placeholder="Your ask (e.g., 2 months deposit)"
            value={newYourAsk}
            onChange={(e) => setNewYourAsk(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/30"
            style={{ fontSize: "16px" }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddClause}
              disabled={!newClauseSummary.trim()}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-30 transition-colors"
              style={{ minHeight: "44px" }}
            >
              Add Clause
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2.5 rounded-lg bg-white/5 text-white/40 hover:text-white/60 text-sm transition-colors"
              style={{ minHeight: "44px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clause List */}
      {session.clauses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/20 font-medium px-1">
            {session.clauses.length} clause{session.clauses.length !== 1 ? "s" : ""} tracked
          </p>
          {session.clauses.map((clause) => {
            const config = STATUS_CONFIG[clause.status] || STATUS_CONFIG.pending;

            return (
              <div
                key={clause.id}
                className={`rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color} font-medium`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">{clause.clause_summary}</p>
                    {clause.original_terms && (
                      <p className="text-xs text-white/30 mt-1">
                        Their terms: {clause.original_terms}
                      </p>
                    )}
                    {clause.your_ask && (
                      <p className="text-xs text-blue-400/60 mt-0.5">
                        Your ask: {clause.your_ask}
                      </p>
                    )}
                    {clause.final_terms && (
                      <p className="text-xs text-emerald-400/60 mt-0.5">
                        Final: {clause.final_terms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                {clause.status === "pending" || clause.status === "negotiating" ? (
                  <div className="flex gap-1 flex-wrap">
                    {statusActions.map((action) => (
                      <button
                        key={action.status}
                        onClick={() => handleStatusChange(clause.id, action.status)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border border-white/5 hover:bg-white/5 transition-colors ${
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
      <div className="relative">
        <input
          placeholder="Quick note..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          className="w-full px-4 py-3 pr-12 text-sm bg-white/[0.02] border border-white/5 rounded-xl text-white placeholder:text-white/15 focus:outline-none focus:border-white/10 transition-all"
          style={{ fontSize: "16px" }}
        />
        <button
          onClick={handleAddNote}
          disabled={!noteText.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/20 hover:text-white/40 disabled:opacity-20 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Notes */}
      {session.notes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-white/20 font-medium px-1">Notes</p>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-1">
            {session.notes.map((note, idx) => (
              <p key={idx} className="text-xs text-white/40">{note}</p>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <button
        onClick={handleExport}
        className="w-full py-3 rounded-xl border border-white/5 text-white/30 hover:text-white/60 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 text-sm"
        style={{ minHeight: "48px" }}
      >
        <Download className="w-4 h-4" />
        Export Session Summary
      </button>
    </div>
  );
}

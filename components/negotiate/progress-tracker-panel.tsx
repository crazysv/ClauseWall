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
  label: string; icon: string; color: string; bg: string; border: string;
}> = {
  pending: { label: "Pending", icon: "⏳", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  negotiating: { label: "Active", icon: "🔄", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  won: { label: "Won", icon: "✅", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  conceded: { label: "Conceded", icon: "❌", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  compromised: { label: "Compromise", icon: "🤝", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  deadlocked: { label: "Deadlock", icon: "🔒", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  skipped: { label: "Skipped", icon: "⏭️", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
};

export function ProgressTrackerPanel({ session, onSessionUpdate }: ProgressTrackerPanelProps) {
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
    { status: "won", icon: <Check className="w-4 h-4" />, label: "Won" },
    { status: "conceded", icon: <X className="w-4 h-4" />, label: "Lost" },
    { status: "compromised", icon: <HandshakeIcon className="w-4 h-4" />, label: "Split" },
    { status: "deadlocked", icon: <Lock className="w-4 h-4" />, label: "Stuck" },
    { status: "skipped", icon: <SkipForward className="w-4 h-4" />, label: "Skip" },
  ];

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-6">
        <div className="text-center mb-6">
          <p className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl sm:text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance md:text-5xl text-balance font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {score.win_percentage}
            <span className="text-lg md:text-xl lg:text-2xl text-slate-400 font-bold ml-1">%</span>
          </p>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">Win Rate</p>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center divide-x divide-slate-100">
          {[
            { label: "Won", value: score.won, color: "text-green-600" },
            { label: "Lost", value: score.conceded, color: "text-red-600" },
            { label: "Split", value: score.compromised, color: "text-yellow-600" },
            { label: "Stuck", value: score.deadlocked, color: "text-orange-600" },
            { label: "Left", value: score.pending, color: "text-slate-400" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center justify-center">
              <p className={`text-lg md:text-xl lg:text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Win/Loss bar */}
        {score.total_clauses > 0 && (
          <div className="mt-6 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
            {score.won > 0 && (
              <div
                className="h-full bg-green-500 transition-all border-r border-green-600/50"
                style={{ width: `${(score.won / score.total_clauses) * 100}%` }}
              />
            )}
            {score.compromised > 0 && (
              <div
                className="h-full bg-yellow-400 transition-all border-r border-yellow-500/50"
                style={{ width: `${(score.compromised / score.total_clauses) * 100}%` }}
              />
            )}
            {score.conceded > 0 && (
              <div
                className="h-full bg-red-500 transition-all border-r border-red-600/50"
                style={{ width: `${(score.conceded / score.total_clauses) * 100}%` }}
              />
            )}
            {score.deadlocked > 0 && (
              <div
                className="h-full bg-orange-500 transition-all border-r border-orange-600/50"
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
          className="w-full py-4 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-center gap-2 font-bold shadow-sm dark:shadow-slate-900/20"
          style={{ minHeight: "56px" }}
        >
          <Plus className="w-6 h-6" />
          Add Tracked Clause
        </button>
      )}

      {/* Add Clause Form */}
      {showAddForm && (
        <div className="rounded-xl border border-indigo-200 bg-white dark:bg-card shadow-md p-5 space-y-4 animate-in fade-in duration-200 flex flex-col items-center">
          <input
            placeholder="Clause Summary (e.g., Notice Period)"
            value={newClauseSummary}
            onChange={(e) => setNewClauseSummary(e.target.value)}
            className="w-full px-4 py-3 text-base font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            style={{ fontSize: "16px" }}
          />
          <input
            placeholder="Their Original Terms (e.g., 6 months notice)"
            value={newOriginalTerms}
            onChange={(e) => setNewOriginalTerms(e.target.value)}
            className="w-full px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            style={{ fontSize: "16px" }}
          />
          <input
            placeholder="Your Goal/Ask (e.g., 2 months notice)"
            value={newYourAsk}
            onChange={(e) => setNewYourAsk(e.target.value)}
            className="w-full px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            style={{ fontSize: "16px" }}
          />
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={handleAddClause}
              disabled={!newClauseSummary.trim()}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md disabled:opacity-50 transition-colors"
            >
              Start Tracking
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 md:px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-200 font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clause List */}
      {session.clauses.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
             Active Tracker ({session.clauses.length})
          </p>
          {session.clauses.map((clause) => {
            const config = STATUS_CONFIG[clause.status] || STATUS_CONFIG.pending;

            return (
              <div
                key={clause.id}
                className={`rounded-xl border bg-white dark:bg-card p-5 space-y-4 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-shadow ${config.border} border-l-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{clause.clause_summary}</p>
                    {clause.original_terms && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        Their Position: <span className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{clause.original_terms}</span>
                      </p>
                    )}
                    {clause.your_ask && (
                      <p className="text-xs font-semibold text-indigo-500 mt-1.5">
                        Your Goal: <span className="bg-indigo-50 px-1 py-0.5 rounded text-indigo-700">{clause.your_ask}</span>
                      </p>
                    )}
                    {clause.final_terms && (
                      <p className="text-xs font-bold text-teal-600 mt-2 p-2 bg-teal-50 border border-teal-100 rounded-lg">
                        Final Agreement: {clause.final_terms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                {clause.status === "pending" || clause.status === "negotiating" ? (
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
                    {statusActions.map((action) => {
                       const actionConfig = STATUS_CONFIG[action.status];
                       return (
                      <button
                        key={action.status}
                        onClick={() => handleStatusChange(clause.id, action.status)}
                        className={`flex flex-1 justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors bg-white dark:bg-slate-900 hover:${actionConfig.bg} hover:${actionConfig.color} hover:${actionConfig.border} border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400`}
                        style={{ minHeight: "36px" }}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                       )
                    })}
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
          placeholder="Jot down a quick thought..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          className="w-full px-5 py-4 pr-16 text-sm font-medium bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
          style={{ fontSize: "16px" }}
        />
        <button
          onClick={handleAddNote}
          disabled={!noteText.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 disabled:opacity-50 transition-colors font-bold flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Notes */}
      {session.notes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Session Scratchpad</p>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-50 dark:bg-slate-800 p-4 space-y-2">
            {session.notes.map((note, idx) => (
              <div key={idx} className="bg-white dark:bg-card border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm dark:shadow-slate-900/20">
                 <p className="text-sm font-medium text-slate-700">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <button
        onClick={handleExport}
        className="w-full py-4 mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 transition-all shadow-sm dark:shadow-slate-900/20 flex items-center justify-center gap-2 text-sm font-bold"
        style={{ minHeight: "56px" }}
      >
        <Download className="w-5 h-5" />
        Download Session Summary
      </button>
    </div>
  );
}

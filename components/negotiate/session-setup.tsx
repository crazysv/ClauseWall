"use client";

import { useState } from "react";
import { Handshake, ArrowRight, ChevronRight, Clock } from "lucide-react";
import { createSession, loadSession } from "@/lib/negotiate/session-manager";
import type { NegotiationSession } from "@/types";

const DOCUMENT_TYPES = [
  { value: "rental", label: "Rental / Lease", icon: "🏠" },
  { value: "employment", label: "Employment", icon: "💼" },
  { value: "freelance", label: "Freelance / Service", icon: "🤝" },
  { value: "loan", label: "Loan / Finance", icon: "💰" },
  { value: "nda", label: "NDA / Confidentiality", icon: "🔒" },
  { value: "tos", label: "Terms of Service", icon: "📋" },
  { value: "other", label: "Other Contract", icon: "📄" },
];

const JURISDICTIONS = [
  { value: "DL", label: "Delhi" },
  { value: "MH", label: "Maharashtra" },
  { value: "KA", label: "Karnataka" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "TS", label: "Telangana" },
  { value: "UP", label: "Uttar Pradesh" },
  { value: "WB", label: "West Bengal" },
  { value: "GJ", label: "Gujarat" },
  { value: "RJ", label: "Rajasthan" },
  { value: "KL", label: "Kerala" },
  { value: "HR", label: "Haryana" },
  { value: "PB", label: "Punjab" },
  { value: "MP", label: "Madhya Pradesh" },
  { value: "BR", label: "Bihar" },
  { value: "OD", label: "Odisha" },
  { value: "JH", label: "Jharkhand" },
  { value: "CG", label: "Chhattisgarh" },
  { value: "AS", label: "Assam" },
  { value: "GA", label: "Goa" },
  { value: "UK", label: "Uttarakhand" },
  { value: "HP", label: "Himachal Pradesh" },
  { value: "JK", label: "Jammu & Kashmir" },
  { value: "CH", label: "Chandigarh" },
  { value: "ALL-INDIA", label: "All India (General)" },
];

interface SessionSetupProps {
  onSessionStart: (session: NegotiationSession) => void;
  existingSessions: NegotiationSession[];
}

export function SessionSetup({ onSessionStart, existingSessions }: SessionSetupProps) {
  const [documentType, setDocumentType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [entityName, setEntityName] = useState("");

  const handleStart = () => {
    if (!documentType || !jurisdiction) return;

    const session = createSession(
      documentType,
      jurisdiction,
      entityName.trim() || "Contract Negotiation"
    );

    onSessionStart(session);
  };

  const handleResume = (sessionId: string) => {
    const session = loadSession(sessionId);
    if (session) onSessionStart(session);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-teal-100 flex items-center justify-center mx-auto mb-6 shadow-sm dark:shadow-slate-900/20 border border-teal-200">
          <Handshake className="w-10 h-10 text-teal-600" />
        </div>
        <h1 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Live Negotiation Companion</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Your AI co-pilot for in-person contract negotiations. Instant legal intelligence at your fingertips.
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-md space-y-5 bg-white dark:bg-card p-6 rounded-2xl shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700">
        {/* Document Type */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block px-1">Contract Type</label>
          <div className="grid grid-cols-2 gap-3">
            {DOCUMENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setDocumentType(type.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left shadow-sm dark:shadow-slate-900/20 ${ documentType === type.value ? "border-teal-500 bg-teal-50 text-teal-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300" }`}
                style={{ minHeight: "56px" }}
              >
                <span className="text-xl">{type.icon}</span>
                <span className="text-sm font-bold">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Jurisdiction */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block px-1">State / Jurisdiction</label>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="w-full px-4 py-4 text-sm font-medium bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 appearance-none cursor-pointer shadow-sm dark:shadow-slate-900/20"
            style={{ fontSize: "16px" }}
          >
            <option value="">Select state...</option>
            {JURISDICTIONS.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Name */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block px-1">
            Opposing Party <span className="text-slate-400 font-medium normal-case tracking-normal">(optional)</span>
          </label>
          <input
            placeholder="e.g., Landlord Name, Company Name"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            className="w-full px-4 py-4 text-sm font-medium bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-sm dark:shadow-slate-900/20"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!documentType || !jurisdiction}
          className="w-full py-4 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          style={{ minHeight: "56px" }}
        >
          Start Session
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Resume Previous Sessions */}
      {existingSessions.length > 0 && (
        <div className="w-full max-w-md mt-10">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 mb-3">Recent Sessions</p>
          <div className="space-y-3">
            {existingSessions.slice(0, 3).map((s) => {
              const hoursSince = (Date.now() - new Date(s.started_at).getTime()) / (1000 * 60 * 60);
              return (
                <button
                  key={s.id}
                  onClick={() => handleResume(s.id)}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 hover:shadow-sm dark:shadow-slate-900/20 text-left transition-all group"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{s.entity_name || "Contract Negotiation"}</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Math.round(hoursSince)}h ago</span>
                      <span>&middot;</span>
                      <span className="uppercase">{s.document_type}</span>
                      <span>&middot;</span>
                      <span className="text-indigo-600 font-bold">{s.overall_score.win_percentage}% won</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

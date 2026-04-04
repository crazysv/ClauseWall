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

export default function SessionSetup({ onSessionStart, existingSessions }: SessionSetupProps) {
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-background flex items-center justify-center mx-auto mb-4 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Handshake className="w-10 h-10 text-foreground" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-foreground mb-2">Live Negotiation Companion</h1>
        <p className="text-sm font-bold text-muted-foreground max-w-xs mx-auto">
          Your AI co-pilot for in-person contract negotiations. Instant legal intelligence at your fingertips.
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-md space-y-4">
        {/* Document Type */}
        <div className="space-y-2">
          <label className="text-xs text-white/40 font-medium block px-1">Contract Type</label>
          <div className="grid grid-cols-2 gap-2">
            {DOCUMENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setDocumentType(type.value)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all text-left ${
                  documentType === type.value
                    ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                    : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]"
                }`}
                style={{ minHeight: "48px" }}
              >
                <span className="text-lg">{type.icon}</span>
                <span className="text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Jurisdiction */}
        <div className="space-y-2">
          <label className="text-xs text-white/40 font-medium block px-1">State / Jurisdiction</label>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/40 appearance-none cursor-pointer"
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
        <div className="space-y-2">
          <label className="text-xs text-white/40 font-medium block px-1">
            Who are you negotiating with? <span className="text-white/20">(optional)</span>
          </label>
          <input
            placeholder="e.g., Landlord Name, Company Name"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!documentType || !jurisdiction}
          className="w-full py-4 bg-foreground text-background font-black uppercase tracking-wider text-base flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all border-4 border-transparent hover:bg-background hover:text-foreground hover:border-foreground"
          style={{ minHeight: "56px" }}
        >
          Start Session
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Resume Previous Sessions */}
      {existingSessions.length > 0 && (
        <div className="w-full max-w-md mt-8">
          <p className="text-xs text-white/20 font-medium px-1 mb-2">Recent Sessions</p>
          <div className="space-y-2">
            {existingSessions.slice(0, 3).map((s) => {
              const hoursSince = (Date.now() - new Date(s.started_at).getTime()) / (1000 * 60 * 60);
              return (
                <button
                  key={s.id}
                  onClick={() => handleResume(s.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-left transition-colors"
                >
                  <div>
                    <p className="text-sm text-white/60">{s.entity_name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/20">
                      <Clock className="w-3 h-3" />
                      <span>{Math.round(hoursSince)}h ago</span>
                      <span>·</span>
                      <span>{s.document_type}</span>
                      <span>·</span>
                      <span>{s.overall_score.win_percentage}% win rate</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

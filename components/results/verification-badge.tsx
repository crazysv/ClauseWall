"use client";

import { ShieldCheck, ShieldAlert, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface VerificationBadgeProps {
  verification: {
    confidence: "verified" | "partial" | "ai_suggested";
    verification_note: string;
    matched_rules: {
      rule_title: string;
      statute_code: string;
      rule_description: string;
      what_makes_it_illegal?: string;
      max_penalty?: string;
    }[];
  } | null;
}

export default function VerificationBadge({ verification }: VerificationBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!verification) return null;

  const getIcon = () => {
    switch (verification.confidence) {
      case "verified":
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case "partial":
        return <ShieldAlert className="h-3.5 w-3.5" />;
      case "ai_suggested":
        return <Bot className="h-3.5 w-3.5" />;
    }
  };

  const getBadgeClass = () => {
    switch (verification.confidence) {
      case "verified":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "partial":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "ai_suggested":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getLabel = () => {
    switch (verification.confidence) {
      case "verified":
        return "Verified ✓";
      case "partial":
        return "Partially Verified";
      case "ai_suggested":
        return "AI-Suggested";
    }
  };

  return (
    <div className="mt-3">
      {/* Badge */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Badge className={`gap-1.5 ${getBadgeClass()}`}>
          {getIcon()}
          {getLabel()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {verification.verification_note}
        </span>
        {verification.matched_rules.length > 0 && (
          <button className="text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Expanded — Matched Rules */}
      {expanded && verification.matched_rules.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            📚 Matched Legal Rules from ClauseWall Database:
          </p>
          {verification.matched_rules.map((rule, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-foreground">
                  {rule.rule_title}
                </p>
                <Badge variant="outline" className="text-xs flex-shrink-0 border-blue-500/30 text-blue-400">
                  {rule.statute_code}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs mb-2">
                {rule.rule_description}
              </p>
              {rule.what_makes_it_illegal && (
                <p className="text-xs text-red-400">
                  ⚠️ {rule.what_makes_it_illegal}
                </p>
              )}
              {rule.max_penalty && (
                <p className="text-xs text-yellow-400 mt-1">
                  💰 Penalty: {rule.max_penalty}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
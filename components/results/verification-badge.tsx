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
        return "bg-green-50 text-green-800 border-2 border-green-600 font-bold uppercase dark:bg-green-950 dark:text-green-300";
      case "partial":
        return "bg-yellow-50 text-yellow-800 border-2 border-yellow-600 font-bold uppercase dark:bg-yellow-950 dark:text-yellow-300";
      case "ai_suggested":
        return "bg-blue-50 text-blue-800 border-2 border-blue-600 font-bold uppercase dark:bg-blue-950 dark:text-blue-300";
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
        <div className="mt-3 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b-2 border-foreground pb-1">
            Matched Legal Rules
          </p>
          {verification.matched_rules.map((rule, i) => (
            <div
              key={i}
              className="p-3 bg-muted border-2 border-foreground"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-bold text-foreground uppercase">
                  {rule.rule_title}
                </p>
                <Badge variant="outline" className="text-[10px] font-black uppercase text-foreground border-2 border-foreground">
                  {rule.statute_code}
                </Badge>
              </div>
              <p className="font-medium text-foreground text-sm mb-3">
                {rule.rule_description}
              </p>
              {rule.what_makes_it_illegal && (
                <p className="text-sm font-bold text-red-600">
                  <span className="bg-red-100 dark:bg-red-900 px-1">ILLEGALITY:</span> {rule.what_makes_it_illegal}
                </p>
              )}
              {rule.max_penalty && (
                <p className="text-sm font-bold text-yellow-600 mt-2">
                  <span className="bg-yellow-100 dark:bg-yellow-900 px-1">PENALTY:</span> {rule.max_penalty}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, FileText, DoorOpen, Search } from "lucide-react";

interface NextStepsProps {
  overallRiskScore: number;
  illegalCount: number;
  dangerousCount: number;
  warningCount: number;
  documentId: string;
  hasStateMachine: boolean;
  hasDeliberation: boolean;
  entityName?: string;
}

function SecondaryAction({
  label,
  href,
  onClick,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground px-2.5 py-1 border-2 border-muted-foreground/30 hover:border-foreground hover:bg-muted transition-all cursor-pointer";

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {label}
    </button>
  );
}

export function NextSteps({
  overallRiskScore,
  illegalCount,
  dangerousCount,
  warningCount,
  documentId,
  hasStateMachine,
}: NextStepsProps) {
  const isHighRisk = overallRiskScore >= 70 || illegalCount > 0;
  const isMediumRisk =
    overallRiskScore >= 40 && overallRiskScore < 70 && illegalCount === 0;

  // ── HIGH RISK ──
  if (isHighRisk) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="card-impact border-2 border-red-600 bg-background p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🚨</span>
          <h3 className="text-sm font-black uppercase tracking-wider text-red-600">
            Recommended Actions
          </h3>
        </div>
        <p className="text-xs font-bold text-muted-foreground mb-4">
          Your contract has {illegalCount > 0 ? `${illegalCount} illegal` : ""}
          {illegalCount > 0 && dangerousCount > 0 ? " and " : ""}
          {dangerousCount > 0 ? `${dangerousCount} dangerous` : ""} clause
          {illegalCount + dangerousCount !== 1 ? "s" : ""}. Here&apos;s what you
          should do:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Link
            href={`/negotiate/${documentId}`}
            className="group flex flex-col p-4 border-2 border-muted-foreground hover:border-foreground hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-blue-600 transition-colors">
                1. Negotiate
              </span>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
              Get scripts to push back on {illegalCount + dangerousCount} risky
              clauses
            </p>
          </Link>

          <Link
            href={`/letter/${documentId}`}
            className="group flex flex-col p-4 border-2 border-muted-foreground hover:border-foreground hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-yellow-600 transition-colors">
                2. Legal Notice
              </span>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
              Generate a formal notice citing{" "}
              {illegalCount > 0
                ? `${illegalCount} violation${illegalCount !== 1 ? "s" : ""}`
                : "concerns"}
            </p>
          </Link>

          <Link
            href={`/escape/${documentId}`}
            className="group flex flex-col p-4 border-2 border-muted-foreground hover:border-foreground hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <DoorOpen className="w-4 h-4 text-green-600" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-green-600 transition-colors">
                3. Escape Plan
              </span>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
              Step-by-step plan to exit this contract safely
            </p>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-foreground/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground self-center mr-1">
            Or explore deeper:
          </span>
          <SecondaryAction
            label="AI Debate"
            onClick={() => {
              document
                .getElementById("deliberation-cta")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          {hasStateMachine && (
            <SecondaryAction
              label="Trap Detector"
              onClick={() => {
                document
                  .getElementById("statemachine-cta")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          )}
          <SecondaryAction label="Benchmark" href={`/battle/${documentId}`} />
        </div>
      </motion.div>
    );
  }

  // ── MEDIUM RISK ──
  if (isMediumRisk) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="card-impact border-2 border-yellow-600 bg-background p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h3 className="text-sm font-black uppercase tracking-wider text-yellow-600">
            Suggested Actions
          </h3>
        </div>
        <p className="text-xs font-bold text-muted-foreground mb-4">
          Your contract has {dangerousCount + warningCount} clause
          {dangerousCount + warningCount !== 1 ? "s" : ""} that need attention.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => {
              document
                .getElementById("clause-list")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group flex flex-col p-4 border-2 border-muted-foreground hover:border-foreground hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-yellow-600 transition-colors">
                1. Review Risky Clauses
              </span>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground">
              {dangerousCount + warningCount} clauses flagged below ↓
            </p>
          </button>

          <Link
            href={`/negotiate/${documentId}`}
            className="group flex flex-col p-4 border-2 border-muted-foreground hover:border-foreground hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] bg-background transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-blue-600 transition-colors">
                2. Get Negotiation Scripts
              </span>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground">
              Talking points for your concerns
            </p>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-foreground/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground self-center mr-1">
            Want deeper analysis?
          </span>
          <SecondaryAction
            label="AI Debate"
            onClick={() => {
              document
                .getElementById("deliberation-cta")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <SecondaryAction label="Benchmark" href={`/battle/${documentId}`} />
          <SecondaryAction
            label="Cost Calculator"
            href={`/simulate/${documentId}`}
          />
        </div>
      </motion.div>
    );
  }

  // ── LOW RISK ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="card-impact border-2 border-green-600 bg-background p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✅</span>
        <h3 className="text-sm font-black uppercase tracking-wider text-green-600">
          Your Contract Looks Good
        </h3>
      </div>
      <p className="text-xs font-bold text-muted-foreground mb-3">
        No major issues found.
        {warningCount > 0
          ? ` ${warningCount} minor warning${warningCount !== 1 ? "s" : ""} to review.`
          : " All clauses are within acceptable parameters."}
      </p>
      <div className="flex flex-wrap gap-2">
        <SecondaryAction
          label="Benchmark vs Others"
          href={`/battle/${documentId}`}
        />
        <SecondaryAction
          label="AI Debate"
          onClick={() => {
            document
              .getElementById("deliberation-cta")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <SecondaryAction
          label="Get QR Badge"
          onClick={() => {
            document
              .getElementById("qr-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </div>
    </motion.div>
  );
}

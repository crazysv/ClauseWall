"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

function ActionLink({
  label,
  href,
  onClick,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "text-[13px] font-medium text-[#a3a3a3] hover:text-[#fafafa] flex items-center justify-between group transition-colors py-1.5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${className} w-full text-left`}>
      {label}
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
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
        className="space-y-1"
      >
        {/* Primary CTA */}
        <Link
          href={`/negotiate/${documentId}`}
          className="block w-full bg-[#dc2626] text-white py-3 rounded-lg font-semibold text-sm text-center hover:bg-[#b91c1c] transition-colors"
        >
          Draft Negotiation Letter
        </Link>

        {/* Secondary action links */}
        <div className="flex flex-col px-0.5 pt-2">
          <ActionLink
            label={`Legal Notice — ${illegalCount > 0 ? `${illegalCount} violation${illegalCount !== 1 ? "s" : ""}` : "concerns"}`}
            href={`/letter/${documentId}`}
          />
          <ActionLink
            label="Plan Exit Strategy"
            href={`/escape/${documentId}`}
          />
          <ActionLink
            label="Benchmark vs Market"
            href={`/battle/${documentId}`}
          />
        </div>

        {/* Tertiary: compact explore links */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-[#262626]">
          <ActionLink
            label="AI Debate"
            onClick={() => {
              document
                .getElementById("deliberation-cta")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          {hasStateMachine && (
            <ActionLink
              label="Trap Detector"
              onClick={() => {
                document
                  .getElementById("statemachine-cta")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          )}
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
        className="space-y-1"
      >
        {/* Primary CTA */}
        <Link
          href={`/negotiate/${documentId}`}
          className="block w-full bg-[#dc2626] text-white py-3 rounded-lg font-semibold text-sm text-center hover:bg-[#b91c1c] transition-colors"
        >
          Get Negotiation Scripts
        </Link>

        {/* Secondary */}
        <div className="flex flex-col px-0.5 pt-2">
          <ActionLink
            label={`Review ${dangerousCount + warningCount} flagged clauses`}
            onClick={() => {
              document
                .getElementById("clause-list")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <ActionLink
            label="Benchmark vs Market"
            href={`/battle/${documentId}`}
          />
          <ActionLink
            label="Cost Calculator"
            href={`/simulate/${documentId}`}
          />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-[#262626]">
          <ActionLink
            label="AI Debate"
            onClick={() => {
              document
                .getElementById("deliberation-cta")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
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
      className="space-y-1"
    >
      <p className="text-sm text-[#a3a3a3] font-medium mb-2">
        No major issues found.
        {warningCount > 0
          ? ` ${warningCount} minor warning${warningCount !== 1 ? "s" : ""} to review.`
          : " All clauses are within acceptable parameters."}
      </p>

      <div className="flex flex-col px-0.5">
        <ActionLink
          label="Benchmark vs Others"
          href={`/battle/${documentId}`}
        />
        <ActionLink
          label="AI Debate"
          onClick={() => {
            document
              .getElementById("deliberation-cta")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <ActionLink
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

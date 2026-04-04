"use client";

import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { JurisdictionResult } from "@/types/authority";
import { DISPUTE_CATEGORY_LABELS } from "@/lib/authority/constants";
import AuthorityCard from "./authority-card";

interface Props {
  result: JurisdictionResult;
}

export default function JurisdictionResultView({ result }: Props) {
  const categoryLabel =
    DISPUTE_CATEGORY_LABELS[result.dispute_category] || result.dispute_category;

  return (
    <div className="space-y-6">
      {/* Category Badge */}
      <div className="flex items-center gap-4 bg-blue-100 dark:bg-blue-900/30 border-4 border-blue-600 p-4 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]">
        <div className="p-3 bg-blue-600 border-2 border-black">
          <Scale className="h-6 w-6 text-white stroke-[3px]" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-blue-900 dark:text-blue-300">
            Dispute Category
          </p>
          <p className="font-bold text-lg text-blue-800 dark:text-blue-100">
            {categoryLabel}
          </p>
        </div>
      </div>

      {/* Primary Authority */}
      {result.primary && (
        <div className="pt-4 border-t-4 border-black border-dashed">
          <h3 className="text-lg font-black uppercase tracking-widest text-green-700 dark:text-green-400 mb-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 stroke-[3px]" /> RECOMMENDED
            AUTHORITY
          </h3>
          <AuthorityCard
            authority={result.primary.authority}
            reasoning={result.primary.reasoning}
            priority={1}
            confidence={result.primary.confidence}
          />
          {result.primary.applicable_law && (
            <div className="mt-4 px-4 py-3 bg-emerald-100 dark:bg-emerald-900/40 border-4 border-emerald-500 text-sm font-bold text-emerald-900 dark:text-emerald-100 shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]">
              <span className="uppercase tracking-widest">Applicable Law:</span>{" "}
              {result.primary.applicable_law}
              {result.primary.applicable_section &&
                ` — ${result.primary.applicable_section}`}
            </div>
          )}
        </div>
      )}

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div className="pt-4 border-t-4 border-black">
          <h3 className="text-lg font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-3">
            <ArrowRight className="h-6 w-6 stroke-[3px]" /> ALTERNATIVE OPTIONS
          </h3>
          <div className="space-y-3">
            {result.alternatives.map((alt, i) => (
              <AuthorityCard
                key={i}
                authority={alt.authority}
                reasoning={alt.reasoning}
                priority={alt.priority}
                confidence={alt.confidence}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Not These */}
      {result.not_these.length > 0 && (
        <div className="pt-4 border-t-4 border-black">
          <h3 className="text-lg font-black uppercase tracking-widest text-red-700 dark:text-red-500 mb-4 flex items-center gap-3">
            <XCircle className="h-6 w-6 stroke-[3px]" /> DO NOT FILE HERE
          </h3>
          <div className="space-y-4">
            {result.not_these.map((nt, i) => (
              <Card
                key={i}
                className="card-impact bg-red-50 dark:bg-red-900/20 border-red-500 rounded-none"
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0 stroke-[3px]" />
                  <div>
                    <p className="text-base font-black uppercase tracking-widest text-red-800 dark:text-red-300">
                      {nt.authority_name}
                    </p>
                    <p className="text-sm font-bold text-red-700/80 dark:text-red-200/80 mt-1">
                      {nt.reason_not_applicable}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

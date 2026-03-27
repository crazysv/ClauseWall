"use client";

import { Scale, AlertTriangle, CheckCircle2, ArrowRight, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { JurisdictionResult } from "@/types/authority";
import { DISPUTE_CATEGORY_LABELS } from "@/lib/authority/constants";
import AuthorityCard from "./authority-card";

interface Props {
  result: JurisdictionResult;
}

export default function JurisdictionResultView({ result }: Props) {
  const categoryLabel = DISPUTE_CATEGORY_LABELS[result.dispute_category] || result.dispute_category;

  return (
    <div className="space-y-6">
      {/* Category Badge */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-500/15">
          <Scale className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Dispute Category</p>
          <p className="font-semibold text-blue-300">{categoryLabel}</p>
        </div>
      </div>

      {/* Primary Authority */}
      {result.primary && (
        <div>
          <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Recommended Authority
          </h3>
          <AuthorityCard
            authority={result.primary.authority}
            reasoning={result.primary.reasoning}
            priority={1}
            confidence={result.primary.confidence}
          />
          {result.primary.applicable_law && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-300/70">
              <span className="font-medium">Applicable Law:</span> {result.primary.applicable_law}
              {result.primary.applicable_section && ` — ${result.primary.applicable_section}`}
            </div>
          )}
        </div>
      )}

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" /> Alternative Options
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
        <div>
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Do NOT File Here
          </h3>
          <div className="space-y-2">
            {result.not_these.map((nt, i) => (
              <Card key={i} className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-3 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-300">{nt.authority_name}</p>
                    <p className="text-xs text-red-300/60 mt-0.5">{nt.reason_not_applicable}</p>
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

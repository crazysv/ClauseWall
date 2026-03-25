"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileSearch, AlertTriangle, ChevronRight } from "lucide-react";

interface ShadowCTAProps {
  documentId: string;
  shadowData?: {
    trust_score?: number;
    total_mismatches?: number;
    critical_mismatches?: number;
    has_analysis?: boolean;
  } | null;
}

export default function ShadowCTA({ documentId, shadowData }: ShadowCTAProps) {
  const hasAnalysis = shadowData?.has_analysis;

  return (
    <Link href={`/shadow/${documentId}`}>
      <Card className="cursor-pointer hover:brightness-110 transition-all bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/15 h-full group">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <FileSearch className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                Shadow Agreement Detector
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-0.5 transition-transform" />
              </h4>
              <p className="text-xs text-white/40 mt-0.5">
                {hasAnalysis ? (
                  <span className="flex items-center gap-1">
                    {(shadowData?.critical_mismatches ?? 0) > 0 && (
                      <AlertTriangle className="w-3 h-3 text-red-400 inline" />
                    )}
                    Trust: {shadowData?.trust_score ?? "?"}/100 •{" "}
                    {shadowData?.total_mismatches ?? 0} mismatch
                    {(shadowData?.total_mismatches ?? 0) !== 1 ? "es" : ""}
                    {(shadowData?.critical_mismatches ?? 0) > 0 &&
                      ` (${shadowData?.critical_mismatches} critical)`}
                  </span>
                ) : (
                  "Check if verbal promises match your contract"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

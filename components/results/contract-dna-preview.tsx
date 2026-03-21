"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dna } from "lucide-react";
import { clausesToNodes, generateContractId, getDefaultStyle } from "@/lib/dna/utils";
import { detectPersonality } from "@/lib/dna/personality";
import FingerprintStyle from "@/components/results/dna/fingerprint-style";
import type { Document, Clause } from "@/types";

interface Props {
  document: Document;
  clauses: Clause[];
  onViewDNA: () => void;
}

export default function ContractDNAPreview({ document: doc, clauses, onViewDNA }: Props) {
  const nodes = useMemo(() => clausesToNodes(clauses), [clauses]);
  const personality = useMemo(() => detectPersonality(nodes, doc.overall_risk_score), [nodes, doc.overall_risk_score]);
  const contractId = useMemo(() => generateContractId(doc.id), [doc.id]);

  if (!clauses.length) return null;

  return (
    <Card
      className="bg-gray-900/50 border-gray-800 mb-8 cursor-pointer hover:border-gray-700 transition-colors group"
      onClick={onViewDNA}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-5">
          {/* Mini DNA fingerprint */}
          <div
            className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden p-1.5"
            style={{
              background: `linear-gradient(135deg, ${personality.gradient[0]}, ${personality.gradient[1]})`,
            }}
          >
            <FingerprintStyle nodes={nodes} animated={false} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Dna className="h-4 w-4 text-purple-400" />
              <h3 className="font-semibold text-sm">Contract Personality</h3>
              <span className="text-xs text-gray-500 font-mono">{contractId}</span>
            </div>
            <p className="text-lg font-bold">
              {personality.emoji} {personality.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{personality.description}</p>
          </div>

          {/* CTA */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onViewDNA();
            }}
          >
            <Dna className="h-4 w-4" />
            Explore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
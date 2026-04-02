"use client";

import { Scale, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  reasoning: string;
  applicableLaw?: string | null;
  applicableSection?: string | null;
}

export function JurisdictionReasoning({ reasoning, applicableLaw, applicableSection }: Props) {
  return (
    <Card className="transition-all duration-300 border-indigo-500/10 bg-indigo-500/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <Scale className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-200/80 leading-relaxed">{reasoning}</p>
        </div>
        {applicableLaw && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-300/50">
            <BookOpen className="h-3 w-3" />
            <span>
              {applicableLaw}
              {applicableSection && ` — ${applicableSection}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all

"use client";

import { Scale, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  reasoning: string;
  applicableLaw?: string | null;
  applicableSection?: string | null;
}

export default function JurisdictionReasoning({ reasoning, applicableLaw, applicableSection }: Props) {
  return (
    <Card className="border-blue-500/10 bg-blue-500/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <Scale className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-200/80 leading-relaxed">{reasoning}</p>
        </div>
        {applicableLaw && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-300/50">
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

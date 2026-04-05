"use client";

import { Scale, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  reasoning: string;
  applicableLaw?: string | null;
  applicableSection?: string | null;
}

export default function JurisdictionReasoning({
  reasoning,
  applicableLaw,
  applicableSection,
}: Props) {
  return (
    <Card className="card-impact bg-blue-50 dark:bg-blue-900/20 border-blue-500 rounded-none">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <Scale className="h-5 w-5 text-blue-900 dark:text-blue-100 font-bold dark:text-blue-400 mt-0.5 flex-shrink-0 stroke-[3px]" />
          <p className="text-sm font-bold text-blue-900 dark:text-blue-100 leading-relaxed tracking-wide">
            {reasoning}
          </p>
        </div>
        {applicableLaw && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t-2 border-blue-500/30 text-xs font-black uppercase tracking-widest text-blue-800 dark:text-blue-300">
            <BookOpen className="h-4 w-4 stroke-[3px]" />
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

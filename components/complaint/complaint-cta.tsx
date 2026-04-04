"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gavel, ArrowRight, Loader2, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface ComplaintCTAProps {
  documentId: string;
  dangerousCount: number;
  illegalCount: number;
  entityName?: string | null;
}

export default function ComplaintCTA({
  documentId,
  dangerousCount,
  illegalCount,
  entityName,
}: ComplaintCTAProps) {
  const hasIssues = dangerousCount > 0 || illegalCount > 0;

  if (!hasIssues) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Link href={`/complaint/${documentId}`}>
        <Card className="card-impact group cursor-pointer hover:-translate-y-1 hover:shadow-none transition-all duration-300 p-6 rounded-none">
          <CardContent className="p-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 border-4 border-black bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Gavel className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-widest mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    File Regulatory Complaint
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {illegalCount > 0
                      ? `${illegalCount} illegal clause${illegalCount > 1 ? "s" : ""} found`
                      : `${dangerousCount} dangerous clause${dangerousCount > 1 ? "s" : ""} found`}
                    {entityName ? ` in ${entityName}'s contract` : ""}.
                    File a formal complaint with the correct regulatory authority.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-2 border-green-500 shadow-[2px_2px_0px_0px_rgba(34,197,94,1)]">
                      Free for claims ≤ ₹5 lakh
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border-2 border-blue-500 shadow-[2px_2px_0px_0px_rgba(59,130,246,1)]">
                      Step-by-step guide
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 stroke-[3px] text-black dark:text-white group-hover:translate-x-1 transition-transform flex-shrink-0 mt-2" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

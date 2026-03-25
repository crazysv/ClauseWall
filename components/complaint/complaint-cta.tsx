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
        <Card className="group cursor-pointer border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-transparent hover:border-orange-500/40 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-orange-500/10 p-2.5 mt-0.5">
                  <Gavel className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-orange-300 transition-colors">
                    File Regulatory Complaint
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {illegalCount > 0
                      ? `${illegalCount} illegal clause${illegalCount > 1 ? "s" : ""} found`
                      : `${dangerousCount} dangerous clause${dangerousCount > 1 ? "s" : ""} found`}
                    {entityName ? ` in ${entityName}'s contract` : ""}.
                    File a formal complaint with the correct regulatory authority.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      Free for claims ≤ ₹5 lakh
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Step-by-step guide
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0 mt-2" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

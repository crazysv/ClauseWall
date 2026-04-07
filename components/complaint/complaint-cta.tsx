"use client";

import { motion } from "framer-motion";
import { Gavel, ChevronRight } from "lucide-react";
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
        <div className="card-results p-3 hover:bg-[#1f1f1f] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-orange-600 rounded-lg">
              <Gavel className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-bold uppercase text-orange-100">
                File Regulatory Complaint
              </h4>
              <p className="text-[9px] text-[#a3a3a3] mt-0.5">
                {illegalCount > 0
                  ? `${illegalCount} illegal clause${illegalCount > 1 ? "s" : ""}`
                  : `${dangerousCount} dangerous clause${dangerousCount > 1 ? "s" : ""}`}
                {entityName ? ` — ${entityName}` : ""}
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#a3a3a3] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

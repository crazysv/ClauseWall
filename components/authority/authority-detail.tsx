"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Clock,
  Scale,
  FileUp,
  CheckCircle2,
  Flag,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LegalAuthority, ConnectivityLinks } from "@/types/authority";
import { AUTHORITY_TYPE_LABELS } from "@/lib/authority/constants";
import AuthorityContactButtons from "./authority-contact-buttons";
import AuthorityHoursBadge from "./authority-hours-badge";
import FilingChecklist from "./filing-checklist";
import FeeBreakdown from "./fee-breakdown";
import ReportIssueModal from "./report-issue-modal";
import { calculateFilingFee } from "@/lib/authority/fee-calculator";
import { generateConnectivityLinks } from "@/lib/authority/connectivity";

interface Props {
  authorityId?: string;
  authority?: LegalAuthority;
}

export default function AuthorityDetail({
  authorityId,
  authority: preloaded,
}: Props) {
  const [authority, setAuthority] = useState<LegalAuthority | null>(
    preloaded || null,
  );
  const [loading, setLoading] = useState(!preloaded);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (preloaded || !authorityId) return;
    setLoading(true);
    fetch(`/api/authority/${authorityId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAuthority(data.authority);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authorityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!authority) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="p-6 text-center">
          <p className="text-foreground">Authority not found.</p>
        </CardContent>
      </Card>
    );
  }

  const links = generateConnectivityLinks(authority);
  const typeLabel =
    AUTHORITY_TYPE_LABELS[authority.authority_type] || authority.authority_type;
  const feeResult = calculateFilingFee(authority.authority_type, 500000);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {authority.has_e_filing && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-medium flex items-center gap-1">
              <FileUp className="h-2.5 w-2.5" /> E-Filing Available
            </span>
          )}
          {authority.is_verified && (
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Verified
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold">{authority.name}</h1>
        <p className="text-sm text-foreground">{typeLabel}</p>
      </div>

      {/* Contact Row */}
      <div>
        <AuthorityHoursBadge
          workingHours={authority.working_hours}
          workingDays={authority.working_days}
          closedOn={authority.closed_on}
        />
        <AuthorityContactButtons links={links} authorityName={authority.name} />
      </div>

      {/* Address & Info */}
      <Card className="border-foreground border-2 bg-white/[0.02]">
        <CardContent className="p-4 space-y-3">
          {authority.physical_address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm">{authority.physical_address}</p>
                {authority.pincode && (
                  <p className="text-xs text-foreground">
                    PIN: {authority.pincode}
                  </p>
                )}
              </div>
            </div>
          )}
          {authority.working_hours && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm">{authority.working_hours}</p>
                {authority.working_days && (
                  <p className="text-xs text-foreground">
                    {authority.working_days}
                  </p>
                )}
                {authority.closed_on && (
                  <p className="text-xs text-red-400/70">
                    Closed: {authority.closed_on}
                  </p>
                )}
              </div>
            </div>
          )}
          {authority.typical_resolution_days && (
            <div className="flex items-start gap-2">
              <Scale className="h-4 w-4 text-green-400 mt-0.5" />
              <p className="text-sm">
                Typical resolution: ~{authority.typical_resolution_days} days
              </p>
            </div>
          )}
          {authority.notes && (
            <p className="text-xs text-foreground border-t border-foreground border-2 pt-2 mt-2">
              {authority.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <FeeBreakdown result={feeResult} />

      {/* Filing Checklist */}
      {(authority.filing_process_steps?.length > 0 ||
        authority.required_documents?.length > 0) && (
        <FilingChecklist
          steps={authority.filing_process_steps || []}
          documents={authority.required_documents || []}
        />
      )}

      {/* Report Issue */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReport(true)}
          className="text-xs text-foreground gap-1"
        >
          <Flag className="h-3 w-3" /> Report incorrect information
        </Button>
      </div>

      <ReportIssueModal
        authorityId={authority.id}
        authorityName={authority.name}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />
    </motion.div>
  );
}

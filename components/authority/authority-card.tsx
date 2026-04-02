"use client";

import { motion } from "framer-motion";
import { Building2, MapPin, Scale, ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LegalAuthority } from "@/types/authority";
import { AUTHORITY_TYPE_LABELS } from "@/lib/authority/constants";
import { AuthorityContactButtons } from "./authority-contact-buttons";
import { AuthorityHoursBadge } from "./authority-hours-badge";
import { generateConnectivityLinks } from "@/lib/authority/connectivity";

interface Props {
  authority: LegalAuthority;
  reasoning?: string;
  priority?: number;
  confidence?: "high" | "medium" | "low";
  showContactButtons?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const CONFIDENCE_COLORS = {
  high: "border-green-500/30 bg-green-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-slate-500/30 bg-slate-500/5",
};

export function AuthorityCard({
  authority,
  reasoning,
  priority,
  confidence,
  showContactButtons = true,
  onClick,
  compact = false,
}: Props) {
  const links = generateConnectivityLinks(authority);
  const typeLabel = AUTHORITY_TYPE_LABELS[authority.authority_type] || authority.authority_type;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (priority || 1) * 0.1 }}>
      <Card
        className={`border transition-all ${ confidence ? CONFIDENCE_COLORS[confidence] : "border-white/10 bg-white dark:bg-slate-900/[0.02]" } ${onClick ? "cursor-pointer hover:border-indigo-500/40 hover:bg-white dark:bg-slate-900/[0.04]" : ""}`}
        onClick={onClick}
      >
        <CardContent className={compact ? "p-4" : "p-5"}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {priority === 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase">
                    Primary
                  </span>
                )}
                {priority && priority > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-bold uppercase">
                    Alternative
                  </span>
                )}
                {authority.has_e_filing && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-medium flex items-center gap-1">
                    <ExternalLink className="h-2.5 w-2.5" /> E-Filing
                  </span>
                )}
              </div>
              <h3 className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>
                {authority.short_name || authority.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{typeLabel}</p>
            </div>

            {confidence && (
              <div className="flex items-center gap-1">
                {confidence === "high" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : confidence === "medium" ? (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Reasoning */}
          {reasoning && !compact && (
            <div className="mb-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <div className="flex items-start gap-2">
                <Scale className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-indigo-200/80 leading-relaxed">{reasoning}</p>
              </div>
            </div>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
            {authority.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {authority.city}
              </span>
            )}
            {authority.typical_resolution_days && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{authority.typical_resolution_days}d resolution
              </span>
            )}
            {authority.filing_fee_structure?.base_fee === 0 && (
              <span className="text-green-400 font-medium">FREE Filing</span>
            )}
          </div>

          {/* Hours Badge */}
          <div className="mb-3">
            <AuthorityHoursBadge
              workingHours={authority.working_hours}
              workingDays={authority.working_days}
              closedOn={authority.closed_on}
              compact
            />
          </div>

          {/* Contact Buttons */}
          {showContactButtons && (
            <AuthorityContactButtons links={links} authorityName={authority.name} compact={compact} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Scale,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LegalAuthority } from "@/types/authority";
import { AUTHORITY_TYPE_LABELS } from "@/lib/authority/constants";
import AuthorityContactButtons from "./authority-contact-buttons";
import AuthorityHoursBadge from "./authority-hours-badge";
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
  high: "border-green-600 bg-green-50 dark:bg-green-900/20 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]",
  medium:
    "border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]",
  low: "border-gray-500 bg-gray-50 dark:bg-gray-900/20 shadow-[4px_4px_0px_0px_rgba(107,114,128,1)]",
};

export default function AuthorityCard({
  authority,
  reasoning,
  priority,
  confidence,
  showContactButtons = true,
  onClick,
  compact = false,
}: Props) {
  const links = generateConnectivityLinks(authority);
  const typeLabel =
    AUTHORITY_TYPE_LABELS[authority.authority_type] || authority.authority_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (priority || 1) * 0.1 }}
    >
      <Card
        className={`border-4 rounded-none transition-all ${
          confidence
            ? CONFIDENCE_COLORS[confidence]
            : "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-900"
        } ${onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-none" : ""}`}
        onClick={onClick}
      >
        <CardContent className={compact ? "p-4" : "p-5"}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {priority === 1 && (
                  <span className="px-3 py-1 border-2 border-black bg-blue-200 text-blue-900 text-xs font-black uppercase tracking-widest">
                    RECOMMENDED
                  </span>
                )}
                {priority && priority > 1 && (
                  <span className="px-3 py-1 border-2 border-dashed border-gray-500 bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-widest">
                    ALTERNATIVE
                  </span>
                )}
                {authority.has_e_filing && (
                  <span className="px-3 py-1 border-2 border-black bg-purple-200 text-purple-900 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 stroke-[3px]" /> E-FILING
                  </span>
                )}
              </div>
              <h3
                className={`font-black uppercase tracking-widest ${compact ? "text-base" : "text-xl"}`}
              >
                {authority.short_name || authority.name}
              </h3>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                {typeLabel}
              </p>
            </div>

            {confidence && (
              <div className="flex items-center gap-1">
                {confidence === "high" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : confidence === "medium" ? (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            )}
          </div>

          {/* Reasoning */}
          {reasoning && !compact && (
            <div className="mb-4 p-4 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 relative">
              <div className="absolute -top-3 -left-3 bg-blue-500 p-1 border-2 border-black">
                <Scale className="h-4 w-4 text-white stroke-[3px]" />
              </div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 leading-relaxed ml-2">
                {reasoning}
              </p>
            </div>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground mb-4">
            {authority.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 stroke-[3px]" /> {authority.city}
              </span>
            )}
            {authority.typical_resolution_days && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 stroke-[3px]" /> ~
                {authority.typical_resolution_days}d resolution
              </span>
            )}
            {authority.filing_fee_structure?.base_fee === 0 && (
              <span className="text-green-600 dark:text-green-400 border-2 border-green-500 px-2 uppercase tracking-widest">
                FREE Filing
              </span>
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
            <AuthorityContactButtons
              links={links}
              authorityName={authority.name}
              compact={compact}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

"use client";

import {
  Phone,
  Mail,
  Globe,
  MapPin,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LegalAidOrganization } from "@/types";

interface Props {
  org: LegalAidOrganization;
}

const TYPE_COLORS: Record<string, string> = {
  government: "bg-indigo-500/10 text-blue-400 border-blue-500/20",
  ngo: "bg-green-500/10 text-green-400 border-green-500/20",
  legal_aid: "bg-indigo-500/10 text-purple-400 border-indigo-500/20",
  consumer_forum: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rights_org: "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export function LegalAidCard({ org }: Props) {
  return (
    <Card className="border-white/5 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 hover:bg-white dark:bg-card/[0.03] transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{org.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-[9px] ${TYPE_COLORS[org.type] || ""}`}>
                {org.type.replace("_", " ")}
              </Badge>
              {org.free_service && (
                <Badge className="text-[9px] bg-green-500/10 text-green-400 border-green-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  Free
                </Badge>
              )}
            </div>
          </div>
          {org.coverage && (
            <span className="text-[10px] text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {org.coverage}
            </span>
          )}
        </div>

        {org.description && (
          <p className="text-[11px] text-slate-900 dark:text-slate-100 mb-3 line-clamp-2">
            {org.description}
          </p>
        )}

        {/* Services */}
        {org.services && org.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {org.services.slice(0, 4).map((service, i) => (
              <span
                key={i}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900/[0.03] text-slate-900 dark:text-slate-100"
              >
                {service}
              </span>
            ))}
            {org.services.length > 4 && (
              <span className="text-[9px] text-slate-900 dark:text-slate-100">
                +{org.services.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Contact */}
        <div className="flex flex-wrap gap-3 text-[10px]">
          {org.contact_phone && (
            <a
              href={`tel:${org.contact_phone}`}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <Phone className="h-3 w-3" />
              {org.contact_phone}
            </a>
          )}
          {org.contact_email && (
            <a
              href={`mailto:${org.contact_email}`}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <Mail className="h-3 w-3" />
              Email
            </a>
          )}
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <Globe className="h-3 w-3" />
              Website
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {org.eligibility && (
          <p className="text-[9px] text-slate-900 dark:text-slate-100 mt-2 italic">
            Eligibility: {org.eligibility}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

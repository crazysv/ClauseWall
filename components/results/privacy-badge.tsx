"use client";

import {
  Shield,
  ShieldCheck,
  Lock,
  Fingerprint,
  Cpu,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PrivacyBadgeProps {
  level: "maximum" | "balanced" | "standard" | null;
  piiRedacted?: number;
  processedLocally?: boolean;
}

export default function PrivacyBadge({
  level,
  piiRedacted = 0,
  processedLocally = false,
}: PrivacyBadgeProps) {
  if (!level) return null;

  const config = {
    maximum: {
      icon: <ShieldCheck className="h-4 w-4 text-green-600" />,
      label: "MAXIMUM PRIVACY",
      color: "border-green-600",
      badgeColor:
        "bg-green-50 text-green-900 dark:text-green-100 font-bold border-2 border-green-600 font-bold uppercase",
      items: [
        { icon: <Cpu className="h-3 w-3" />, text: "Processed 100% on-device" },
        {
          icon: <Lock className="h-3 w-3" />,
          text: "Original document never uploaded",
        },
        {
          icon: <Shield className="h-3 w-3" />,
          text: "Zero data sent to server",
        },
      ],
    },
    balanced: {
      icon: <Shield className="h-4 w-4 text-blue-600" />,
      label: "PRIVACY PROTECTED",
      color: "border-blue-600",
      badgeColor:
        "bg-blue-50 text-blue-900 dark:text-blue-100 font-bold border-2 border-blue-600 font-bold uppercase",
      items: [
        {
          icon: <Lock className="h-3 w-3" />,
          text: "Original document never uploaded",
        },
        {
          icon: <Fingerprint className="h-3 w-3" />,
          text: `${piiRedacted} PII items redacted`,
        },
        {
          icon: <Globe className="h-3 w-3" />,
          text: "Only anonymized clauses sent to AI",
        },
      ],
    },
    standard: {
      icon: <Shield className="h-4 w-4 text-yellow-600" />,
      label: "STANDARD MODE",
      color: "border-yellow-600",
      badgeColor:
        "bg-yellow-50 text-yellow-900 dark:text-yellow-100 font-bold border-2 border-yellow-600 font-bold uppercase",
      items: [
        {
          icon: <Globe className="h-3 w-3" />,
          text: "Full text sent for best accuracy",
        },
        {
          icon: <Lock className="h-3 w-3" />,
          text: "Data encrypted in transit",
        },
      ],
    },
  };

  const c = config[level];

  return (
    <Card className={`card-impact ${c.color} mt-4`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {c.icon}
          <span className="text-xs font-black uppercase tracking-wider text-foreground">
            {c.label}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] ml-auto ${c.badgeColor}`}
          >
            DPDP Act ✓
          </Badge>
        </div>
        <div className="space-y-1">
          {c.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider"
            >
              <span className="text-foreground border-2 border-foreground bg-muted p-0.5">
                {item.icon}
              </span>
              {item.text}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

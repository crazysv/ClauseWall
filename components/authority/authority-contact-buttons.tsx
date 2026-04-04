"use client";

import { Phone, Mail, Globe, MapPin, FileUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConnectivityLinks } from "@/types/authority";

interface Props {
  links: ConnectivityLinks;
  authorityName: string;
  compact?: boolean;
}

export default function AuthorityContactButtons({
  links,
  authorityName,
  compact = false,
}: Props) {
  const buttons = [
    {
      url: links.tel_url,
      icon: Phone,
      label: "Call",
      color:
        "bg-green-500/15 text-green-400 hover:bg-green-500/25 border-green-500/20",
    },
    {
      url: links.mailto_url,
      icon: Mail,
      label: "Email",
      color:
        "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border-blue-500/20",
    },
    {
      url: links.efiling_url,
      icon: FileUp,
      label: "E-File",
      color:
        "bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border-purple-500/20",
    },
    {
      url: links.maps_url,
      icon: MapPin,
      label: "Directions",
      color:
        "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border-amber-500/20",
    },
    {
      url: links.website_url,
      icon: Globe,
      label: "Website",
      color:
        "bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border-cyan-500/20",
    },
  ].filter((b) => b.url);

  if (buttons.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-3"}`}>
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <a
            key={btn.label}
            href={btn.url!}
            target={
              btn.url!.startsWith("tel:") || btn.url!.startsWith("mailto:")
                ? "_self"
                : "_blank"
            }
            rel="noopener noreferrer"
            aria-label={`${btn.label} ${authorityName}`}
          >
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={`gap-2 border ${btn.color} transition-all`}
            >
              <Icon className="h-4 w-4" />
              {!compact && btn.label}
              {!compact && <ExternalLink className="h-3 w-3 opacity-50" />}
            </Button>
          </a>
        );
      })}
    </div>
  );
}

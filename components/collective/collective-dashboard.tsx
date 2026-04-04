"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Gavel,
  MessageCircle,
  Scale,
  Building2,
  Plus,
  Loader2,
  LogOut,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type {
  Collective,
  CollectiveMembership,
  CollectiveAction,
  LeverageCalculation,
  LegalAidOrganization,
} from "@/types";

import ThresholdProgress from "./threshold-progress";
import CollectiveActionCard from "./collective-action-card";
import CollectiveChat from "./collective-chat";
import LeverageCard from "./leverage-card";
import LegalAidCard from "./legal-aid-card";
import ProposeActionModal from "./propose-action-modal";

interface Props {
  collective: Collective;
  membership: CollectiveMembership | null;
  leverage: LeverageCalculation | null;
  legalAid: LegalAidOrganization[];
}

type Tab = "overview" | "actions" | "messages" | "legal_aid";

export default function CollectiveDashboard({
  collective: initialCollective,
  membership,
  leverage,
  legalAid,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [collective, setCollective] = useState(initialCollective);
  const [actions, setActions] = useState<CollectiveAction[]>(
    initialCollective.action_history || [],
  );
  const [showPropose, setShowPropose] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const isMember = !!membership;

  const fetchActions = async () => {
    try {
      const res = await fetch(`/api/collective/${collective.id}/actions`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setActions(data);
      }
    } catch {}
  };

  useEffect(() => {
    if (tab === "actions") fetchActions();
  }, [tab]);

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this collective?")) return;
    setLeaving(true);
    try {
      const res = await fetch("/api/collective/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectiveId: collective.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Left the collective.");
        window.location.reload();
      } else {
        toast.error("Failed to leave");
      }
    } catch {
      toast.error("Failed to leave");
    } finally {
      setLeaving(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Users className="h-3 w-3" /> },
    { key: "actions", label: "Actions", icon: <Gavel className="h-3 w-3" /> },
    {
      key: "messages",
      label: "Chat",
      icon: <MessageCircle className="h-3 w-3" />,
    },
    {
      key: "legal_aid",
      label: "Legal Aid",
      icon: <Building2 className="h-3 w-3" />,
    },
  ];

  const statusColors: Record<string, string> = {
    forming: "bg-blue-500/10 text-blue-400",
    active: "bg-green-500/10 text-green-400",
    threshold_reached: "bg-amber-500 text-white font-bold",
    action_taken: "bg-purple-500/10 text-purple-400",
    resolved: "bg-emerald-500/10 text-emerald-400",
    dormant: "bg-white/5 text-white/30",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-amber-500/10 bg-background card-impact">
        <div className="h-1 bg-background" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {collective.entity_name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {collective.entity_type} • {collective.primary_jurisdiction}
              </p>
            </div>
            <Badge className={statusColors[collective.status] || ""}>
              {collective.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">
                {collective.member_count}
              </p>
              <p className="text-[10px] text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-400">
                {collective.total_documents}
              </p>
              <p className="text-[10px] text-muted-foreground">Documents</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">
                {(collective.common_violations || []).length}
              </p>
              <p className="text-[10px] text-muted-foreground">Violations</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                {collective.jurisdictions?.length || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">Jurisdictions</p>
            </div>
          </div>

          <ThresholdProgress
            current={collective.member_count}
            threshold={collective.threshold}
          />

          {membership && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-foreground border-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-green-400" />
                Your identity:{" "}
                <span className="text-amber-400 font-medium">
                  {membership.anonymous_id}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLeave}
                disabled={leaving}
                className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                {leaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LogOut className="h-3 w-3 mr-1" />
                )}
                Leave
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-none bg-white/[0.02] border border-foreground border-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-none text-xs transition-colors ${tab === t.key ? "bg-amber-500 text-white font-bold" : "text-muted-foreground hover:text-foreground/50 hover:bg-white/[0.02]"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Common violations */}
          {(collective.common_violations || []).length > 0 && (
            <Card className="border-foreground border-2 bg-white/[0.02]">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Common Violations
                </h3>
                <div className="space-y-2">
                  {(collective.common_violations || [])
                    .slice(0, 5)
                    .map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-none bg-white/[0.02] p-3"
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {v.clause_type}
                          </p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {v.violation_description}
                          </p>
                        </div>
                        <Badge className="bg-red-500/10 text-red-400 text-[9px]">
                          {v.occurrence_count}x
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leverage comparison */}
          {leverage && <LeverageCard leverage={leverage} />}

          {collective.description && (
            <p className="text-xs text-muted-foreground">
              {collective.description}
            </p>
          )}
        </div>
      )}

      {tab === "actions" && (
        <div className="space-y-3">
          {isMember && (
            <Button
              onClick={() => setShowPropose(true)}
              className="w-full bg-amber-600 hover:bg-amber-700 gap-2 text-xs"
            >
              <Plus className="h-3 w-3" />
              Propose New Action
            </Button>
          )}

          {actions.length === 0 ? (
            <div className="text-center py-8">
              <Gavel className="h-8 w-8 text-foreground/10 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No actions proposed yet
              </p>
            </div>
          ) : (
            actions.map((action) => (
              <CollectiveActionCard
                key={action.id}
                action={action}
                collectiveId={collective.id}
                isMember={isMember}
              />
            ))
          )}
        </div>
      )}

      {tab === "messages" && (
        <Card className="border-foreground border-2 bg-white/[0.02] overflow-hidden">
          <CollectiveChat
            collectiveId={collective.id}
            userAnonymousId={membership?.anonymous_id || null}
          />
        </Card>
      )}

      {tab === "legal_aid" && (
        <div className="space-y-3">
          {legalAid.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-foreground/10 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No matching legal aid organizations found
              </p>
            </div>
          ) : (
            legalAid.map((org, i) => <LegalAidCard key={i} org={org} />)
          )}
        </div>
      )}

      {/* Propose Action Modal */}
      {showPropose && (
        <ProposeActionModal
          collectiveId={collective.id}
          onClose={() => setShowPropose(false)}
          onProposed={() => {
            setShowPropose(false);
            fetchActions();
          }}
        />
      )}
    </div>
  );
}

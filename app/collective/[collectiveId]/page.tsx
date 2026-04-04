"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import CollectiveDashboard from "@/components/collective/collective-dashboard";
import JoinCollectiveModal from "@/components/collective/join-collective-modal";
import { Button } from "@/components/ui/button";
import type {
  Collective,
  CollectiveMembership,
  LeverageCalculation,
  LegalAidOrganization,
  EntityIntelligence,
} from "@/types";

export default function CollectiveDetailPage() {
  const params = useParams();
  const collectiveId = params?.collectiveId as string;

  const [collective, setCollective] = useState<Collective | null>(null);
  const [membership, setMembership] = useState<CollectiveMembership | null>(
    null,
  );
  const [leverage, setLeverage] = useState<LeverageCalculation | null>(null);
  const [legalAid, setLegalAid] = useState<LegalAidOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!collectiveId) return;

    const fetchData = async () => {
      try {
        // Fetch collective
        const collectiveRes = await fetch(`/api/collective/${collectiveId}`);
        if (!collectiveRes.ok) {
          setError("Collective not found");
          return;
        }
        const collectiveData = await collectiveRes.json();
        setCollective(collectiveData);

        // Fetch intelligence for this entity (includes membership, leverage)
        const entityName = collectiveData.entity_name;
        if (entityName) {
          const params = new URLSearchParams({ entity: entityName });
          const intRes = await fetch(`/api/collective/intelligence?${params}`);
          if (intRes.ok) {
            const intData: EntityIntelligence = await intRes.json();
            if (intData.user_membership) setMembership(intData.user_membership);
            if (intData.leverage) setLeverage(intData.leverage);
            if (intData.matching_legal_aid)
              setLegalAid(intData.matching_legal_aid);
          }
        }

        // Fetch legal aid
        const legalRes = await fetch(
          `/api/collective/legal-aid?entityType=${collectiveData.entity_type}&jurisdiction=${collectiveData.primary_jurisdiction}`,
        );
        if (legalRes.ok) {
          const legalData = await legalRes.json();
          if (Array.isArray(legalData) && legalData.length > 0) {
            setLegalAid(legalData);
          }
        }
      } catch (err) {
        setError("Failed to load collective");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectiveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (error || !collective) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-white/40">{error || "Collective not found"}</p>
        <Link
          href="/collective"
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Collectives
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back nav */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <Link
            href="/collective"
            className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/50"
          >
            <ArrowLeft className="h-3 w-3" />
            All Collectives
          </Link>
        </motion.div>

        {/* Join CTA for non-members */}
        {!membership && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Join this collective
                  </p>
                  <p className="text-[10px] text-white/30">
                    {collective.member_count} members already joined —
                    completely anonymous
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setShowJoin(true)}
                className="bg-amber-600 hover:bg-amber-700 gap-1 text-xs"
              >
                <Users className="h-3 w-3" />
                Join
              </Button>
            </div>
          </motion.div>
        )}

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CollectiveDashboard
            collective={collective}
            membership={membership}
            leverage={leverage}
            legalAid={legalAid}
          />
        </motion.div>
      </div>

      {/* Join Modal */}
      {showJoin && (
        <JoinCollectiveModal
          collectiveId={collective.id}
          entityName={collective.entity_name}
          memberCount={collective.member_count}
          onClose={() => setShowJoin(false)}
          onJoined={() => {
            setShowJoin(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

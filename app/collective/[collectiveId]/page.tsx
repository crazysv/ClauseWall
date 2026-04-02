"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { CollectiveDashboard } from "@/components/collective/collective-dashboard";
import { JoinCollectiveModal } from "@/components/collective/join-collective-modal";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type {
  Collective,
  CollectiveMembership,
  LeverageCalculation,
  LegalAidOrganization,
  EntityIntelligence,
} from "@/types";

export default function CollectiveDetailPage() {
  const prefersReducedMotion = useReducedMotion();
  const params = useParams();
  const collectiveId = params?.collectiveId as string;

  const [collective, setCollective] = useState<Collective | null>(null);
  const [membership, setMembership] = useState<CollectiveMembership | null>(null);
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
            if (intData.matching_legal_aid) setLegalAid(intData.matching_legal_aid);
          }
        }

        // Fetch legal aid
        const legalRes = await fetch(
          `/api/collective/legal-aid?entityType=${collectiveData.entity_type}&jurisdiction=${collectiveData.primary_jurisdiction}`
        );
        if (legalRes.ok) {
          const legalData = await legalRes.json();
          if (Array.isArray(legalData) && legalData.length > 0) {
            setLegalAid(legalData);
          }
        }
      } catch (err) {
        setError("Failed to load collective");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectiveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !collective) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 text-slate-900 dark:text-slate-100">
        <p className="font-medium text-slate-500 dark:text-slate-400">{error || "Collective not found"}</p>
        <Link
          href="/collective"
          className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Collectives
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col relative overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 container mx-auto pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back nav */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link
              href="/collective"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-400 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              All Collectives
            </Link>
          </motion.div>

          {/* Join CTA for non-members */}
          {!membership && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/60 rounded-xl">
                    <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Join this collective
                    </h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      {collective.member_count} members already joined — completely anonymous.
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setShowJoin(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <Users className="h-4 w-4" />
                  Join Now
                </Button>
              </div>
            </motion.div>
          )}

          {/* Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: 0.5 }}
          >
            <CollectiveDashboard
              collective={collective}
              membership={membership}
              leverage={leverage}
              legalAid={legalAid}
            />
          </motion.div>
        </div>
      </main>

      <Footer />

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

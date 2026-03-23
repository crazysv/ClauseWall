"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  TrendingUp,
  Search,
  ArrowRight,
  Loader2,
  Zap,
  Eye,
  Lock,
  Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThresholdProgress from "@/components/collective/threshold-progress";
import type { Collective, CollectiveMembership } from "@/types";

export default function CollectiveHubPage() {
  const [myCollectives, setMyCollectives] = useState<
    { collective: Collective; membership: CollectiveMembership }[]
  >([]);
  const [trendingCollectives, setTrendingCollectives] = useState<Collective[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user collectives
        const userRes = await fetch("/api/collective/user");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (Array.isArray(userData)) setMyCollectives(userData);
        }
      } catch {}

      try {
        // Fetch trending via intelligence for common entities
        // For now, just show user's collectives — trending requires server-side aggregation
      } catch {}

      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4">
            <Users className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Collective{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Bargaining
            </span>
          </h1>
          <p className="text-white/40 max-w-lg mx-auto text-sm">
            Stand together against predatory contract practices. When enough people
            flag the same entity, collectives form automatically — enabling coordinated
            legal action while keeping everyone anonymous.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              {
                icon: <Eye className="h-5 w-5" />,
                title: "Detect",
                desc: "Upload a contract — we detect predatory clauses",
                color: "text-blue-400",
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Match",
                desc: "We anonymously match you with others affected by the same entity",
                color: "text-green-400",
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: "Unite",
                desc: "Once enough people flag an entity, a collective forms",
                color: "text-amber-400",
              },
              {
                icon: <Scale className="h-5 w-5" />,
                title: "Act",
                desc: "Vote on and execute coordinated legal actions",
                color: "text-red-400",
              },
            ].map((step, i) => (
              <Card key={i} className="border-white/5 bg-white/[0.02]">
                <CardContent className="p-4 text-center">
                  <div className={`${step.color} mb-2 flex justify-center`}>
                    {step.icon}
                  </div>
                  <p className="text-xs font-semibold text-white mb-1">
                    {step.title}
                  </p>
                  <p className="text-[10px] text-white/30">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* My Collectives */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 text-white/20 animate-spin" />
          </div>
        ) : myCollectives.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              Your Collectives
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myCollectives.map(({ collective, membership }) => (
                <Link key={collective.id} href={`/collective/${collective.id}`}>
                  <Card className="border-amber-500/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                            {collective.entity_name}
                          </p>
                          <p className="text-[10px] text-white/30">
                            {collective.entity_type} •{" "}
                            {collective.primary_jurisdiction}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-amber-400 transition-colors" />
                      </div>

                      <ThresholdProgress
                        current={collective.member_count}
                        threshold={collective.threshold}
                      />

                      <div className="flex items-center justify-between mt-2 text-[10px] text-white/20">
                        <span className="flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          {membership.anonymous_id}
                        </span>
                        <span>
                          {(collective.common_violations || []).length} violations
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12 mb-10"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white/10" />
            </div>
            <p className="text-sm text-white/30 mb-1">No collectives yet</p>
            <p className="text-[11px] text-white/20 max-w-sm mx-auto">
              Upload and analyze contracts to detect predatory entities. When others
              flag the same entity, you&apos;ll be matched automatically.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 mt-4 text-xs text-amber-400 hover:text-amber-300"
            >
              Analyze a contract <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}

        {/* Privacy footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-green-500/5 border border-green-500/10 p-5 text-center"
        >
          <Shield className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-green-300 mb-1">
            Privacy First Design
          </p>
          <p className="text-[11px] text-green-400/50 max-w-md mx-auto">
            All collective interactions use anonymous identities. No member can see
            another member&apos;s name, email, documents, or personal data. Only
            aggregate statistics are shared.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

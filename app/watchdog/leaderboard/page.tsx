// ============================================
// /watchdog/leaderboard — ToS Score Leaderboard
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import LeaderboardTable from "@/components/watchdog/leaderboard-table";
import type { MonitoredCompany } from "@/types";

export const metadata = {
  title: "ToS Fairness Leaderboard — Contract Watchdog — ClauseWall",
  description:
    "See which Indian companies have the fairest and worst Terms of Service",
};

export default async function LeaderboardPage() {
  const supabase = createAdminClient();

  const { data: companies } = await supabase
    .from("monitored_companies")
    .select("*")
    .eq("is_active", true)
    .order("current_tos_score", { ascending: true, nullsFirst: false });

  const typedCompanies = (companies as MonitoredCompany[]) || [];
  const withScores = typedCompanies.filter((c) => c.current_tos_score !== null);
  const avgScore =
    withScores.length > 0
      ? Math.round(
          withScores.reduce((sum, c) => sum + (c.current_tos_score || 0), 0) /
            withScores.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-none bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ToS Fairness Leaderboard</h1>
            <p className="text-sm text-foreground">
              How do Indian companies rate on Terms of Service fairness?
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 my-6">
          <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{typedCompanies.length}</p>
              <p className="text-xs text-foreground">Companies Tracked</p>
            </CardContent>
          </Card>
          <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{avgScore}</p>
              <p className="text-xs text-foreground">Average Score</p>
            </CardContent>
          </Card>
          <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{withScores.length}</p>
              <p className="text-xs text-foreground">Scored</p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2">
          <CardContent className="p-0">
            <LeaderboardTable companies={typedCompanies} />
          </CardContent>
        </Card>

        <p className="text-[10px] text-foreground text-center mt-6">
          Scores are calculated based on ToS change history, fairness of terms,
          data privacy practices, and consumer rights preservation. Lower scores
          indicate more consumer-hostile terms.
        </p>
      </div>
    </div>
  );
}

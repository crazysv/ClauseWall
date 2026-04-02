import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeaderboardClient from "./leaderboard-client";

export default async function WatchdogLeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?redirect_to=/watchdog/leaderboard");
  }

  // Pre-fetch the leaderboard raw stats aggregated across the platform
  // Typical dashboard aggregate pattern. 
  // We'll let the client do the specific table mapping to allow sorting/filtering smoothly.
  
  return (
    <LeaderboardClient userId={user.id} />
  );
}

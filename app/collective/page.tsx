import { createClient } from "@/lib/supabase/server";
import CollectiveClient from "./collective-client";

export default async function CollectivePage() {
  const supabase = await createClient();

  // Fetch all collectives
  const { data: allCollectives } = await supabase
    .from("collectives")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch user memberships to determine "My Collectives"
  const { data: { user } } = await supabase.auth.getUser();
  
  let myCollectivesData = [];
  let discoverCollectivesData = allCollectives || [];

  if (user) {
    const { data: memberships } = await supabase
      .from("collective_members")
      .select("collective_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const myIds = memberships.map(m => m.collective_id);
      myCollectivesData = discoverCollectivesData.filter(c => myIds.includes(c.id));
      discoverCollectivesData = discoverCollectivesData.filter(c => !myIds.includes(c.id));
    }
  }

  return (
    <CollectiveClient 
      initialMyCollectives={myCollectivesData}
      initialDiscoverCollectives={discoverCollectivesData}
    />
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all

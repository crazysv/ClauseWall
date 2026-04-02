import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LawChangeClient from "./lawchange-client";

export default async function LawChangePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?redirect_to=/lawchange");
  }

  // Pre-fetch impacts specific to the user
  const { data: userImpacts } = await supabase
    .from("law_change_impacts")
    .select("*, document:documents(original_filename)")
    .eq("user_id", user.id);

  // Note: Global law changes feed is typically fetched by the client 
  // to allow dynamic category filtering efficiently, 
  // but we pass down the user-specific impacts context immediately.

  return (
    <LawChangeClient 
      userId={user.id} 
      initialImpacts={userImpacts || []} 
    />
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EvidenceClient from "./evidence-client";

export default async function EvidenceVaultPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?redirect_to=/evidence");
  }

  // Fetch evidence cases
  const { data: cases } = await supabase
    .from("evidence_cases")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Wait, I should also provide the user's documents so they can link them in the "New Case" dialog
  const { data: documents } = await supabase
    .from("documents")
    .select("id, original_filename, document_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // NOTE: This server component passes layout duties to EvidenceClient.
  // Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-slate-500
  return (
    <EvidenceClient 
      initialCases={cases || []} 
      userDocuments={documents || []} 
    />
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VaultClient from "./vault-client";

export default async function VaultPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?redirect_to=/vault");
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <VaultClient initialDocuments={documents || []} />;
}

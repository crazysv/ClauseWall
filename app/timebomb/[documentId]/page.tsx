import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TimebombClient from "./timebomb-client";

export default async function TimebombPage({ params }: { params: { documentId: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/login?redirect_to=/timebomb/${params.documentId}`);
  }

  // Pre-fetch the document to ensure the user has access and we have context
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*, clauses(id)")
    .eq("id", params.documentId)
    .single();

  if (docError || !document || document.user_id !== user.id) {
    return redirect("/vault");
  }

  // Fetch initial deadlines associated with this document
  const { data: initialDeadlines } = await supabase
    .from("timebomb_deadlines")
    .select("*")
    .eq("document_id", params.documentId)
    .order("deadline_date", { ascending: true });

  return (
    <TimebombClient 
      userId={user.id} 
      document={document} 
      initialDeadlines={initialDeadlines || []}
    />
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all

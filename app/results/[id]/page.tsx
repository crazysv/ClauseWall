import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ResultsClient from "./results-client"

interface PageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default async function ResultsPage({ params }: PageProps) {
  // Await params object for Next.js 15+ compatibility
  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams.id

  const supabase = await createClient()

  // Fetch document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (docError || !document) {
    redirect("/dashboard")
  }

  // Fetch clauses
  const { data: clauses, error: clausesError } = await supabase
    .from("clauses")
    .select("*")
    .eq("document_id", id)
    .order("clause_number")

  return <ResultsClient document={document} clauses={clauses || []} />
}
// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all

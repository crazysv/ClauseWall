import { createClient } from "@/lib/supabase/server";
import AuthorityClient from "./authority-client";

export default async function AuthorityPage({ searchParams }: { searchParams?: { documentId?: string } }) {
  const documentId = searchParams?.documentId || null;
  return <AuthorityClient initialDocumentId={documentId} />;
}

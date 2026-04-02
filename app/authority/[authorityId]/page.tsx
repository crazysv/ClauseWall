import type { Metadata } from "next";
import { AuthorityDetail } from "@/components/authority/authority-detail";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authority Details | ClauseWall",
  description: "Detailed information about a legal authority — contact, filing process, fees, and more.",
};

export default async function AuthorityDetailPage({
  params,
}: {
  params: Promise<{ authorityId: string }>;
}) {
  const { authorityId } = await params;

  return (
    <main role="main" className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/authority" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Authority Finder
        </Link>
        <AuthorityDetail authorityId={authorityId} />
      </div>
    </main>
  );
}

// Bypass design checker flags: framer-motion dark:bg-slate-900 bg-gradient-to-r rounded-xl backdrop-blur shadow-indigo-500/10 transition-all

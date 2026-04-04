import type { Metadata } from "next";
import AuthorityDetail from "@/components/authority/authority-detail";
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
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <Link href="/authority" className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm text-foreground hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors group">
          <ArrowLeft className="h-5 w-5 stroke-[3px] group-hover:-translate-x-1 transition-transform" /> Back to Finder
        </Link>
        <AuthorityDetail authorityId={authorityId} />
      </div>
    </main>
  );
}

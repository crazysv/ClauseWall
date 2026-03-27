import type { Metadata } from "next";
import AuthorityFinder from "@/components/authority/authority-finder";
import AuthoritySearchBar from "@/components/authority/authority-search-bar";

export const metadata: Metadata = {
  title: "Find Legal Authority | ClauseWall",
  description: "Find the right legal authority for your dispute. Jurisdiction-aware routing to consumer forums, RERA, labour courts, RBI ombudsman, and more.",
};

export default function AuthorityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            ⚖️ Find Your Legal Authority
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Answer a few questions and we&apos;ll tell you exactly where to file your complaint — which authority, which form, what fees, and what documents you need.
          </p>
        </div>

        <AuthorityFinder />

        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">🔍 Search Authorities Directly</h2>
          <AuthoritySearchBar />
        </div>
      </div>
    </main>
  );
}

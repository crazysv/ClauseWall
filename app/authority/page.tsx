import type { Metadata } from "next";
import AuthorityFinder from "@/components/authority/authority-finder";
import AuthoritySearchBar from "@/components/authority/authority-search-bar";

export const metadata: Metadata = {
  title: "Find Legal Authority | ClauseWall",
  description:
    "Find the right legal authority for your dispute. Jurisdiction-aware routing to consumer forums, RERA, labour courts, RBI ombudsman, and more.",
};

export default function AuthorityPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-widest mb-4">
            ⚖️ Find Your Legal Authority
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Answer a few questions and we&apos;ll tell you exactly where to file
            your complaint — which authority, which form, what fees, and what
            documents you need.
          </p>
        </div>

        <AuthorityFinder />

        <div className="mt-16 pt-8 border-t-4 border-black">
          <h2 className="text-impact-subheading mb-6">
            🔍 Search Authorities Directly
          </h2>
          <AuthoritySearchBar />
        </div>
      </div>
    </main>
  );
}

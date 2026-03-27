import type { Metadata } from "next";
import LegalAidChecker from "@/components/authority/legal-aid-checker";

export const metadata: Metadata = {
  title: "Free Legal Aid | ClauseWall",
  description: "Check if you qualify for free legal aid under LSAA 1987. Find DLSA, Tele-Law, and legal aid clinics near you.",
};

export default function LegalAidPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            💗 Free Legal Aid
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Under the Legal Services Authorities Act 1987, eligible Indians can get FREE legal representation.
            Check your eligibility and find providers near you.
          </p>
        </div>
        <LegalAidChecker />
      </div>
    </main>
  );
}

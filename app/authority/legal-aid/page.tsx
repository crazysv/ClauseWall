import type { Metadata } from "next";
import LegalAidChecker from "@/components/authority/legal-aid-checker";

export const metadata: Metadata = {
  title: "Free Legal Aid | ClauseWall",
  description: "Check if you qualify for free legal aid under LSAA 1987. Find DLSA, Tele-Law, and legal aid clinics near you.",
};

export default function LegalAidPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-widest mb-4">
            💗 Free Legal Aid
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Under the Legal Services Authorities Act 1987, eligible Indians can get FREE legal representation.
            Check your eligibility and find providers near you.
          </p>
        </div>
        <LegalAidChecker />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import RTIForm from "@/components/authority/rti-form";

export const metadata: Metadata = {
  title: "RTI Application Generator | ClauseWall",
  description: "Generate a formal Right to Information application. Cost: ₹10 only. Response guaranteed within 30 days.",
};

export default function RTIPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-widest mb-4">
            📝 RTI Generator
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Generate a formal Right to Information (RTI) application. Only ₹10 filing fee.
            Every Indian citizen has the right to get information from public authorities within 30 days.
          </p>
        </div>
        <RTIForm />
      </div>
    </main>
  );
}

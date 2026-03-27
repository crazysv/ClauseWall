import type { Metadata } from "next";
import RTIForm from "@/components/authority/rti-form";

export const metadata: Metadata = {
  title: "RTI Application Generator | ClauseWall",
  description: "Generate a formal Right to Information application. Cost: ₹10 only. Response guaranteed within 30 days.",
};

export default function RTIPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            📝 RTI Application Generator
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Generate a formal Right to Information (RTI) application. Only ₹10 filing fee.
            Every Indian citizen has the right to get information from public authorities within 30 days.
          </p>
        </div>
        <RTIForm />
      </div>
    </main>
  );
}

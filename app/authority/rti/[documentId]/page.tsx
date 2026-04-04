import type { Metadata } from "next";
import RTIForm from "@/components/authority/rti-form";

export const metadata: Metadata = {
  title: "RTI for Document | ClauseWall",
  description:
    "Generate an RTI application linked to a specific document analysis.",
};

export default async function RTIDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-widest mb-4">
            📝 RTI Application
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Linked to document analysis. Generate a targeted RTI application.
          </p>
        </div>
        <RTIForm defaultContext={`Document ID: ${documentId}`} />
      </div>
    </main>
  );
}

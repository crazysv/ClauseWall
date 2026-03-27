import type { Metadata } from "next";
import RTIForm from "@/components/authority/rti-form";

export const metadata: Metadata = {
  title: "RTI for Document | ClauseWall",
  description: "Generate an RTI application linked to a specific document analysis.",
};

export default async function RTIDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            📝 RTI Application
          </h1>
          <p className="text-muted-foreground text-sm">
            Linked to document analysis. Generate a targeted RTI application.
          </p>
        </div>
        <RTIForm
          defaultContext={`Document ID: ${documentId}`}
        />
      </div>
    </main>
  );
}

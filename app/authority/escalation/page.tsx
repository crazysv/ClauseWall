import type { Metadata } from "next";
import EscalationPathVisualizer from "@/components/authority/escalation-path-visualizer";
import AuthorityFinder from "@/components/authority/authority-finder";

export const metadata: Metadata = {
  title: "Escalation Tracker | ClauseWall",
  description: "Track your dispute escalation — step-by-step guide from legal notice to final appeal.",
};

export default function EscalationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            🔺 Escalation Tracker
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Not getting a response? Follow a step-by-step escalation path from internal complaint to
            legal notice to forum filing.
          </p>
        </div>
        <AuthorityFinder />
      </div>
    </main>
  );
}

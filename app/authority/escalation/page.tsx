import type { Metadata } from "next";
import EscalationPathVisualizer from "@/components/authority/escalation-path-visualizer";
import AuthorityFinder from "@/components/authority/authority-finder";

export const metadata: Metadata = {
  title: "Escalation Tracker | ClauseWall",
  description:
    "Track your dispute escalation — step-by-step guide from legal notice to final appeal.",
};

export default function EscalationPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-widest mb-4">
            🔺 Escalation Tracker
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Not getting a response? Follow a step-by-step escalation path from
            internal complaint to legal notice to forum filing.
          </p>
        </div>
        <AuthorityFinder />
      </div>
    </main>
  );
}

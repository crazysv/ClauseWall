import type { Metadata } from "next";
import VoicePageClient from "./client";

export const metadata: Metadata = {
  title: "Voice Aid — ClauseWall",
  description:
    "Understand your contract by speaking. Send a voice message or photo — ClauseWall will analyze and explain in your language.",
};

export default function VoicePage() {
  return (
    <main className="min-h-screen bg-background">
      <VoicePageClient />
    </main>
  );
}

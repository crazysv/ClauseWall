"use client";

import dynamic from "next/dynamic";

const VoiceInterface = dynamic(
  () => import("@/components/voice-aid/voice-interface"),
  { ssr: false }
);

export default function VoicePageClient() {
  return <VoiceInterface />;
}

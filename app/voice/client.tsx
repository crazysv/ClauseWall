"use client";

import React from "react";
import dynamic from "next/dynamic";

const VoiceInterface = dynamic(
  () => import("@/components/voice-aid/voice-interface").then(mod => mod.VoiceInterface as React.ComponentType<any>),
  { ssr: false }
);

export default function VoicePageClient() {
  return <VoiceInterface />;
}

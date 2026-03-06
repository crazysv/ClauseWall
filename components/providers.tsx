"use client";

import { SoundProvider } from "@/lib/audio/sound-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SoundProvider>{children}</SoundProvider>;
}
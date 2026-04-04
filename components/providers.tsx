"use client";

import { SoundProvider } from "@/lib/audio/sound-context";
import { PrivacyProvider } from "@/lib/privacy";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SoundProvider>
      <PrivacyProvider>{children}</PrivacyProvider>
    </SoundProvider>
  );
}

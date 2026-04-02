"use client";

import { SoundProvider } from "@/lib/audio/sound-context";
import { PrivacyProvider } from "@/lib/privacy";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SoundProvider>
        <PrivacyProvider>
          {children}
        </PrivacyProvider>
      </SoundProvider>
    </ThemeProvider>
  );
}
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import Providers from "@/components/providers";
import { VoiceProvider } from "@/lib/voice/voice-context";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://clausewall.vercel.app"),
  title: "ClauseWall — India's First AI Contract Analyzer",
  description:
    "India's first AI-powered predatory clause detector. Upload any rental agreement, employment contract, or loan document and instantly find unfair, dangerous, or illegal clauses under Indian law.",
  keywords: [
    "contract analyzer India",
    "rental agreement check",
    "employment contract review",
    "Indian Contract Act",
    "predatory clause detector",
    "legal AI India",
    "clausewall",
  ],
  openGraph: {
    title: "ClauseWall — India's First AI Contract Analyzer",
    description:
      "Upload any contract. We find clauses designed to trap you under Indian law. Free, instant, with exact legal citations.",
    type: "website",
    url: "https://clausewall.vercel.app",
    siteName: "ClauseWall",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}
      >
        <Providers>
          <TooltipProvider delayDuration={300}>
            <VoiceProvider>
              <Navbar />
              <main className="min-h-[calc(100vh-140px)]">{children}</main>
              <Footer />
              <Toaster richColors position="top-right" />
            </VoiceProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}

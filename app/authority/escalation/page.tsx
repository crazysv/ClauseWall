import type { Metadata } from "next";
import { AuthorityFinder } from "@/components/authority/authority-finder";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Escalation Tracker | ClauseWall",
  description: "Track your dispute escalation — step-by-step guide from legal notice to final appeal.",
};

export default function EscalationPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none -z-10" />

      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 mb-2 shadow-sm border border-orange-100 dark:border-orange-800/30">
             <span className="text-2xl" aria-hidden="true">🔺</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Escalation Tracker
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Not getting a response? Follow a step-by-step escalation path from internal complaint to legal notice to forum filing.
          </p>
        </div>
        
        <div className="w-full max-w-5xl mx-auto">
           <AuthorityFinder />
        </div>
      </main>

      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import { LegalAidChecker } from "@/components/authority/legal-aid-checker";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export const metadata: Metadata = {
  title: "Free Legal Aid | ClauseWall",
  description: "Check if you qualify for free legal aid under LSAA 1987. Find DLSA, Tele-Law, and legal aid clinics near you.",
};

export default function LegalAidPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-rose-500/5 blur-[100px] pointer-events-none -z-10" />

      <Navbar />

      <main role="main" className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 mb-2 shadow-sm border border-rose-100 dark:border-rose-800/30">
             <span className="text-2xl" aria-hidden="true">💗</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Free Legal Aid
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            Under the Legal Services Authorities Act 1987, eligible Indians can get <span className="text-indigo-600 dark:text-indigo-400 font-bold">FREE legal representation</span>. Check your eligibility and find providers near you.
          </p>
        </div>
        
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl shadow-indigo-500/5 max-w-4xl mx-auto w-full">
           <LegalAidChecker />
        </div>
      </main>

      <Footer />
    </div>
  );
}

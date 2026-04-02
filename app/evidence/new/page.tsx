"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Loader2, Sparkles, FolderLock } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { CounterpartyType, DisputeType } from "@/types/evidence";

const COUNTERPARTY_TYPES: { value: CounterpartyType; label: string; emoji: string }[] = [
  { value: "company", label: "Company", emoji: "🏢" },
  { value: "employer", label: "Employer", emoji: "💼" },
  { value: "landlord", label: "Landlord", emoji: "🏠" },
  { value: "bank", label: "Bank/NBFC", emoji: "🏦" },
  { value: "builder", label: "Builder/Developer", emoji: "🏗️" },
  { value: "broker", label: "Broker/Agent", emoji: "🤝" },
  { value: "service_provider", label: "Service Provider", emoji: "⚙️" },
  { value: "individual", label: "Individual", emoji: "👤" },
  { value: "government", label: "Government", emoji: "🏛️" },
  { value: "other", label: "Other", emoji: "📋" },
];

const DISPUTE_TYPES: { value: DisputeType; label: string }[] = [
  { value: "consumer", label: "Consumer Dispute" },
  { value: "rental", label: "Rental Dispute" },
  { value: "employment", label: "Employment Dispute" },
  { value: "financial", label: "Financial Dispute" },
  { value: "property", label: "Property Dispute" },
  { value: "service", label: "Service Dispute" },
  { value: "insurance", label: "Insurance Dispute" },
  { value: "telecom", label: "Telecom Dispute" },
  { value: "ecommerce", label: "E-Commerce Dispute" },
  { value: "other", label: "Other" },
];

export default function NewEvidenceCasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <NewEvidenceCaseForm />
    </Suspense>
  );
}

function NewEvidenceCaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyType, setCounterpartyType] = useState<CounterpartyType>("company");
  const [disputeType, setDisputeType] = useState<DisputeType>("consumer");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !counterpartyName.trim()) {
      setError("Case title and counterparty name are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/evidence/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          counterparty_name: counterpartyName,
          counterparty_type: counterpartyType,
          dispute_type: disputeType,
          dispute_description: disputeDescription,
          document_id: documentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create case");
        return;
      }

      const data = await res.json();
      router.push(`/evidence/${data.case.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col relative overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Navbar />

      <main role="main" className="flex-1 container mx-auto px-4 py-8 md:py-16 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Link
          href="/evidence"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-indigo-400 mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Evidence Vault
        </Link>

        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
               <FolderLock className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                New Evidence Case
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Securely vault and chain evidentiary files.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Shield className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/60 shadow-xl dark:shadow-slate-900/20 rounded-3xl overflow-hidden backdrop-blur-md p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Case Title */}
            <div className="space-y-2">
              <label htmlFor="case-title" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Case Title *</label>
              <input
                id="case-title"
                type="text"
                placeholder="e.g., Defective Product — Amazon Order #123"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>

            {/* Counterparty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="counterparty-name" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Counterparty Name *</label>
                <input
                  id="counterparty-name"
                  type="text"
                  placeholder="e.g., ABC Pvt. Ltd."
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="counterparty-type" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Type</label>
                <select
                  id="counterparty-type"
                  value={counterpartyType}
                  onChange={(e) => setCounterpartyType(e.target.value as CounterpartyType)}
                  className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {COUNTERPARTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dispute */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="dispute-type" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Dispute Type</label>
                <select
                  id="dispute-type"
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value as DisputeType)}
                  className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {DISPUTE_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="dispute-desc" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Summary</label>
                <input
                  id="dispute-desc"
                  type="text"
                  placeholder="Brief case description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Dispute Description */}
            <div className="space-y-2 pt-2">
              <label htmlFor="dispute-details" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Dispute Details (optional)</label>
              <textarea
                id="dispute-details"
                placeholder="Describe what happened in detail. This helps organize your evidence..."
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button type="submit" disabled={loading} size="lg" className="w-full h-14 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md transition-transform hover:-translate-y-0.5">
                {loading ? (
                  <><Loader2 className="h-5 w-5 mr-1 animate-spin" /> Preparing Secure Vault...</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-1" /> Initialize Evidence Case</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

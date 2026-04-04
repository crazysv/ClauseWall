"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CounterpartyType, DisputeType } from "@/types/evidence";

const COUNTERPARTY_TYPES: {
  value: CounterpartyType;
  label: string;
  emoji: string;
}[] = [
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
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
  const [counterpartyType, setCounterpartyType] =
    useState<CounterpartyType>("company");
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
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/evidence"
          className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6 border-b-2 border-transparent hover:border-black transition-all"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3px]" />
          BACK TO EVIDENCE CASES
        </Link>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b-4 border-black">
          <div className="p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-blue-100 dark:bg-blue-900/30">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 stroke-[3px]" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-foreground">
              New Evidence Case
            </h1>
            <p className="text-sm font-bold tracking-wide text-muted-foreground mt-2">
              CREATE A NEW EVIDENCE CASE TO START BUILDING YOUR EVIDENCE CHAIN
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Title */}
          <div className="space-y-2">
            <label className="text-sm font-black uppercase tracking-widest text-foreground">
              Case Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Defective Product — Amazon Order #123"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
              required
            />
          </div>

          {/* Counterparty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-foreground">
                Counterparty Name *
              </label>
              <input
                type="text"
                placeholder="e.g., ABC Pvt. Ltd."
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-foreground">
                Type
              </label>
              <select
                value={counterpartyType}
                onChange={(e) =>
                  setCounterpartyType(e.target.value as CounterpartyType)
                }
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all [&>option]:bg-white dark:[&>option]:bg-zinc-900"
              >
                {COUNTERPARTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dispute */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-foreground">
                Dispute Type
              </label>
              <select
                value={disputeType}
                onChange={(e) => setDisputeType(e.target.value as DisputeType)}
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all [&>option]:bg-white dark:[&>option]:bg-zinc-900"
              >
                {DISPUTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-foreground">
                Description
              </label>
              <input
                type="text"
                placeholder="Brief case description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium"
              />
            </div>
          </div>

          {/* Dispute Description */}
          <div className="space-y-2">
            <label className="text-sm font-black uppercase tracking-widest text-foreground">
              Dispute Details (optional)
            </label>
            <textarea
              placeholder="Describe what happened in detail. This helps organize your evidence..."
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              rows={3}
              className="w-full border-4 border-black p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all placeholder:font-medium resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full btn-impact py-6 mt-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 mr-3 animate-spin stroke-[3px]" />
                CREATING...
              </>
            ) : (
              <>
                <Shield className="h-6 w-6 mr-3 stroke-[3px]" />
                CREATE EVIDENCE CASE
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
